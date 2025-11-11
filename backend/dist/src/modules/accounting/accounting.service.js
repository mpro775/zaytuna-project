"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var AccountingService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AccountingService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../shared/database/prisma.service");
const cache_service_1 = require("../../shared/cache/cache.service");
let AccountingService = AccountingService_1 = class AccountingService {
    prisma;
    cacheService;
    logger = new common_1.Logger(AccountingService_1.name);
    glAccountsCacheKey = 'gl_accounts';
    journalEntriesCacheKey = 'journal_entries';
    systemAccounts = {
        cash: { code: '1001', name: 'النقدية', type: 'asset' },
        accountsReceivable: { code: '1002', name: 'المدينون', type: 'asset' },
        inventory: { code: '1003', name: 'المخزون', type: 'asset' },
        accountsPayable: { code: '2001', name: 'الدائنون', type: 'liability' },
        salesTaxPayable: { code: '2002', name: 'ضريبة المبيعات المستحقة', type: 'liability' },
        capital: { code: '3001', name: 'رأس المال', type: 'equity' },
        retainedEarnings: { code: '3002', name: 'الأرباح المحتجزة', type: 'equity' },
        salesRevenue: { code: '4001', name: 'إيرادات المبيعات', type: 'revenue' },
        otherIncome: { code: '4002', name: 'إيرادات أخرى', type: 'revenue' },
        costOfGoodsSold: { code: '5001', name: 'تكلفة البضائع المباعة', type: 'expense' },
        operatingExpenses: { code: '5002', name: 'المصروفات التشغيلية', type: 'expense' },
        salariesExpense: { code: '5003', name: 'مرتبات', type: 'expense' },
    };
    constructor(prisma, cacheService) {
        this.prisma = prisma;
        this.cacheService = cacheService;
    }
    async createGLAccount(createGLAccountDto) {
        try {
            this.logger.log(`إنشاء حساب GL: ${createGLAccountDto.accountCode} - ${createGLAccountDto.name}`);
            const existingAccount = await this.prisma.gLAccount.findUnique({
                where: { accountCode: createGLAccountDto.accountCode },
            });
            if (existingAccount) {
                throw new common_1.ConflictException('كود الحساب موجود بالفعل');
            }
            if (createGLAccountDto.parentId) {
                const parentAccount = await this.prisma.gLAccount.findUnique({
                    where: { id: createGLAccountDto.parentId },
                });
                if (!parentAccount) {
                    throw new common_1.NotFoundException('الحساب الأب غير موجود');
                }
                if (await this.wouldCreateCycle(createGLAccountDto.parentId, createGLAccountDto.parentId)) {
                    throw new common_1.BadRequestException('لا يمكن إنشاء حلقة في التسلسل الهرمي للحسابات');
                }
            }
            const account = await this.prisma.gLAccount.create({
                data: {
                    accountCode: createGLAccountDto.accountCode,
                    name: createGLAccountDto.name,
                    description: createGLAccountDto.description,
                    accountType: createGLAccountDto.accountType,
                    parentId: createGLAccountDto.parentId,
                    isActive: createGLAccountDto.isActive ?? true,
                    isSystem: createGLAccountDto.isSystem ?? false,
                },
            });
            await this.invalidateGLAccountsCache();
            const accountWithDetails = await this.buildGLAccountWithDetails(account);
            this.logger.log(`تم إنشاء حساب GL بنجاح`);
            return accountWithDetails;
        }
        catch (error) {
            this.logger.error('فشل في إنشاء حساب GL', error);
            throw error;
        }
    }
    async findAllGLAccounts(includeInactive = false, accountType) {
        try {
            const cacheKey = `gl_accounts:${includeInactive}:${accountType || 'all'}`;
            const cachedAccounts = await this.cacheService.get(cacheKey);
            if (cachedAccounts) {
                return cachedAccounts;
            }
            const where = {};
            if (!includeInactive) {
                where.isActive = true;
            }
            if (accountType) {
                where.accountType = accountType;
            }
            const accounts = await this.prisma.gLAccount.findMany({
                where,
                orderBy: [
                    { accountCode: 'asc' },
                    { name: 'asc' },
                ],
            });
            const accountsWithDetails = await Promise.all(accounts.map(account => this.buildGLAccountWithDetails(account)));
            await this.cacheService.set(cacheKey, accountsWithDetails, { ttl: 1800 });
            return accountsWithDetails;
        }
        catch (error) {
            this.logger.error('فشل في الحصول على حسابات GL', error);
            throw error;
        }
    }
    async findGLAccountById(id) {
        try {
            const cacheKey = `gl_account:${id}`;
            const cachedAccount = await this.cacheService.get(cacheKey);
            if (cachedAccount) {
                return cachedAccount;
            }
            const account = await this.prisma.gLAccount.findUnique({
                where: { id },
            });
            if (!account) {
                throw new common_1.NotFoundException('حساب GL غير موجود');
            }
            const accountWithDetails = await this.buildGLAccountWithDetails(account);
            await this.cacheService.set(cacheKey, accountWithDetails, { ttl: 1800 });
            return accountWithDetails;
        }
        catch (error) {
            this.logger.error(`فشل في الحصول على حساب GL: ${id}`, error);
            throw error;
        }
    }
    async updateGLAccount(id, updateGLAccountDto) {
        try {
            this.logger.log(`تحديث حساب GL: ${id}`);
            const existingAccount = await this.prisma.gLAccount.findUnique({
                where: { id },
            });
            if (!existingAccount) {
                throw new common_1.NotFoundException('حساب GL غير موجود');
            }
            if (existingAccount.isSystem) {
                const allowedFields = ['isActive', 'description'];
                const requestedFields = Object.keys(updateGLAccountDto);
                const hasUnauthorizedFields = requestedFields.some(field => !allowedFields.includes(field));
                if (hasUnauthorizedFields) {
                    throw new common_1.BadRequestException('لا يمكن تحديث الحسابات النظامية إلا للحقول المحدودة');
                }
            }
            if (updateGLAccountDto.accountCode && updateGLAccountDto.accountCode !== existingAccount.accountCode) {
                const existingCode = await this.prisma.gLAccount.findUnique({
                    where: { accountCode: updateGLAccountDto.accountCode },
                });
                if (existingCode) {
                    throw new common_1.ConflictException('كود الحساب موجود بالفعل');
                }
            }
            if (updateGLAccountDto.parentId) {
                const parentAccount = await this.prisma.gLAccount.findUnique({
                    where: { id: updateGLAccountDto.parentId },
                });
                if (!parentAccount) {
                    throw new common_1.NotFoundException('الحساب الأب غير موجود');
                }
                if (await this.wouldCreateCycle(id, updateGLAccountDto.parentId)) {
                    throw new common_1.BadRequestException('لا يمكن إنشاء حلقة في التسلسل الهرمي للحسابات');
                }
            }
            const account = await this.prisma.gLAccount.update({
                where: { id },
                data: {
                    accountCode: updateGLAccountDto.accountCode,
                    name: updateGLAccountDto.name,
                    description: updateGLAccountDto.description,
                    accountType: updateGLAccountDto.accountType,
                    parentId: updateGLAccountDto.parentId,
                    isActive: updateGLAccountDto.isActive,
                },
            });
            await this.invalidateGLAccountsCache();
            const accountWithDetails = await this.buildGLAccountWithDetails(account);
            this.logger.log(`تم تحديث حساب GL بنجاح`);
            return accountWithDetails;
        }
        catch (error) {
            this.logger.error(`فشل في تحديث حساب GL: ${id}`, error);
            throw error;
        }
    }
    async removeGLAccount(id) {
        try {
            this.logger.log(`حذف حساب GL: ${id}`);
            const account = await this.prisma.gLAccount.findUnique({
                where: { id },
                include: {
                    children: true,
                    debitEntries: true,
                    creditEntries: true,
                },
            });
            if (!account) {
                throw new common_1.NotFoundException('حساب GL غير موجود');
            }
            if (account.isSystem) {
                throw new common_1.BadRequestException('لا يمكن حذف الحسابات النظامية');
            }
            if (account.children.length > 0) {
                throw new common_1.BadRequestException('لا يمكن حذف حساب يحتوي على حسابات فرعية');
            }
            if (account.debitEntries.length > 0 || account.creditEntries.length > 0) {
                throw new common_1.BadRequestException('لا يمكن حذف حساب مرتبط بقيود يومية');
            }
            await this.prisma.gLAccount.delete({
                where: { id },
            });
            await this.invalidateGLAccountsCache();
            this.logger.log(`تم حذف حساب GL بنجاح`);
        }
        catch (error) {
            this.logger.error(`فشل في حذف حساب GL: ${id}`, error);
            throw error;
        }
    }
    async createJournalEntry(createJournalEntryDto, userId) {
        try {
            this.logger.log(`إنشاء قيد يومي: ${createJournalEntryDto.entryNumber}`);
            const existingEntry = await this.prisma.journalEntry.findUnique({
                where: { entryNumber: createJournalEntryDto.entryNumber },
            });
            if (existingEntry) {
                throw new common_1.ConflictException('رقم القيد موجود بالفعل');
            }
            const totalDebit = createJournalEntryDto.lines.reduce((sum, line) => sum + Number(line.amount), 0);
            const totalCredit = createJournalEntryDto.lines.reduce((sum, line) => sum + Number(line.amount), 0);
            if (totalDebit !== totalCredit) {
                throw new common_1.BadRequestException('القيد غير متوازن - مجموع المدين يجب أن يساوي مجموع الدائن');
            }
            const journalEntry = await this.prisma.$transaction(async (tx) => {
                const entry = await tx.journalEntry.create({
                    data: {
                        entryNumber: createJournalEntryDto.entryNumber,
                        entryDate: createJournalEntryDto.entryDate ? new Date(createJournalEntryDto.entryDate) : new Date(),
                        description: createJournalEntryDto.description,
                        referenceType: createJournalEntryDto.referenceType,
                        referenceId: createJournalEntryDto.referenceId,
                        sourceModule: createJournalEntryDto.sourceModule,
                        status: createJournalEntryDto.status || 'draft',
                        isSystem: createJournalEntryDto.isSystem || false,
                        totalDebit: totalDebit,
                        totalCredit: totalCredit,
                        createdBy: userId,
                    },
                });
                for (let i = 0; i < createJournalEntryDto.lines.length; i++) {
                    const line = createJournalEntryDto.lines[i];
                    const debitAccount = await tx.gLAccount.findUnique({
                        where: { id: line.debitAccountId },
                    });
                    const creditAccount = await tx.gLAccount.findUnique({
                        where: { id: line.creditAccountId },
                    });
                    if (!debitAccount) {
                        throw new common_1.NotFoundException(`حساب المدين غير موجود: ${line.debitAccountId}`);
                    }
                    if (!creditAccount) {
                        throw new common_1.NotFoundException(`حساب الدائن غير موجود: ${line.creditAccountId}`);
                    }
                    await tx.journalEntryLine.create({
                        data: {
                            journalEntryId: entry.id,
                            lineNumber: i + 1,
                            debitAccountId: line.debitAccountId,
                            creditAccountId: line.creditAccountId,
                            amount: line.amount,
                            description: line.description,
                            referenceType: line.referenceType,
                            referenceId: line.referenceId,
                        },
                    });
                    if (entry.status === 'posted') {
                        await tx.gLAccount.update({
                            where: { id: line.debitAccountId },
                            data: {
                                debitBalance: { increment: line.amount },
                            },
                        });
                        await tx.gLAccount.update({
                            where: { id: line.creditAccountId },
                            data: {
                                creditBalance: { increment: line.amount },
                            },
                        });
                    }
                }
                return entry;
            });
            await this.invalidateJournalEntriesCache();
            const entryWithDetails = await this.buildJournalEntryWithDetails(journalEntry);
            this.logger.log(`تم إنشاء القيد اليومي بنجاح`);
            return entryWithDetails;
        }
        catch (error) {
            this.logger.error('فشل في إنشاء القيد اليومي', error);
            throw error;
        }
    }
    async findAllJournalEntries(status, sourceModule, startDate, endDate, limit = 50) {
        try {
            const cacheKey = `journal_entries:${status || 'all'}:${sourceModule || 'all'}:${startDate?.toISOString() || 'all'}:${endDate?.toISOString() || 'all'}:${limit}`;
            const cachedEntries = await this.cacheService.get(cacheKey);
            if (cachedEntries) {
                return cachedEntries;
            }
            const where = {};
            if (status) {
                where.status = status;
            }
            if (sourceModule) {
                where.sourceModule = sourceModule;
            }
            if (startDate || endDate) {
                where.entryDate = {};
                if (startDate)
                    where.entryDate.gte = startDate;
                if (endDate)
                    where.entryDate.lte = endDate;
            }
            const entries = await this.prisma.journalEntry.findMany({
                where,
                orderBy: { entryDate: 'desc' },
                take: limit,
                include: {
                    creator: {
                        select: {
                            id: true,
                            username: true,
                            email: true,
                        },
                    },
                },
            });
            const entriesWithDetails = await Promise.all(entries.map(entry => this.buildJournalEntryWithDetails(entry)));
            await this.cacheService.set(cacheKey, entriesWithDetails, { ttl: 600 });
            return entriesWithDetails;
        }
        catch (error) {
            this.logger.error('فشل في الحصول على القيود اليومية', error);
            throw error;
        }
    }
    async findJournalEntryById(id) {
        try {
            const cacheKey = `journal_entry:${id}`;
            const cachedEntry = await this.cacheService.get(cacheKey);
            if (cachedEntry) {
                return cachedEntry;
            }
            const entry = await this.prisma.journalEntry.findUnique({
                where: { id },
                include: {
                    creator: {
                        select: {
                            id: true,
                            username: true,
                            email: true,
                        },
                    },
                },
            });
            if (!entry) {
                throw new common_1.NotFoundException('القيد اليومي غير موجود');
            }
            const entryWithDetails = await this.buildJournalEntryWithDetails(entry);
            await this.cacheService.set(cacheKey, entryWithDetails, { ttl: 1800 });
            return entryWithDetails;
        }
        catch (error) {
            this.logger.error(`فشل في الحصول على القيد اليومي: ${id}`, error);
            throw error;
        }
    }
    async postJournalEntry(id) {
        try {
            this.logger.log(`اعتماد القيد اليومي: ${id}`);
            const entry = await this.prisma.journalEntry.findUnique({
                where: { id },
                include: {
                    lines: true,
                },
            });
            if (!entry) {
                throw new common_1.NotFoundException('القيد اليومي غير موجود');
            }
            if (entry.status === 'posted') {
                throw new common_1.BadRequestException('القيد معتمد بالفعل');
            }
            await this.prisma.$transaction(async (tx) => {
                await tx.journalEntry.update({
                    where: { id },
                    data: { status: 'posted' },
                });
                for (const line of entry.lines) {
                    await tx.gLAccount.update({
                        where: { id: line.debitAccountId },
                        data: {
                            debitBalance: { increment: line.amount },
                        },
                    });
                    await tx.gLAccount.update({
                        where: { id: line.creditAccountId },
                        data: {
                            creditBalance: { increment: line.amount },
                        },
                    });
                }
            });
            await this.invalidateJournalEntriesCache();
            const updatedEntry = await this.findJournalEntryById(id);
            this.logger.log(`تم اعتماد القيد اليومي بنجاح`);
            return updatedEntry;
        }
        catch (error) {
            this.logger.error(`فشل في اعتماد القيد اليومي: ${id}`, error);
            throw error;
        }
    }
    async unpostJournalEntry(id) {
        try {
            this.logger.log(`إلغاء اعتماد القيد اليومي: ${id}`);
            const entry = await this.prisma.journalEntry.findUnique({
                where: { id },
                include: {
                    lines: true,
                },
            });
            if (!entry) {
                throw new common_1.NotFoundException('القيد اليومي غير موجود');
            }
            if (entry.status !== 'posted') {
                throw new common_1.BadRequestException('القيد غير معتمد');
            }
            await this.prisma.$transaction(async (tx) => {
                await tx.journalEntry.update({
                    where: { id },
                    data: { status: 'draft' },
                });
                for (const line of entry.lines) {
                    await tx.gLAccount.update({
                        where: { id: line.debitAccountId },
                        data: {
                            debitBalance: { decrement: line.amount },
                        },
                    });
                    await tx.gLAccount.update({
                        where: { id: line.creditAccountId },
                        data: {
                            creditBalance: { decrement: line.amount },
                        },
                    });
                }
            });
            await this.invalidateJournalEntriesCache();
            const updatedEntry = await this.findJournalEntryById(id);
            this.logger.log(`تم إلغاء اعتماد القيد اليومي بنجاح`);
            return updatedEntry;
        }
        catch (error) {
            this.logger.error(`فشل في إلغاء اعتماد القيد اليومي: ${id}`, error);
            throw error;
        }
    }
    async getAccountingStats(startDate, endDate) {
        try {
            const where = {};
            if (startDate || endDate) {
                where.createdAt = {};
                if (startDate)
                    where.createdAt.gte = startDate;
                if (endDate)
                    where.createdAt.lte = endDate;
            }
            const [glAccountsStats, journalEntriesStats, assetBalance, liabilityBalance, equityBalance, revenueBalance, expenseBalance,] = await Promise.all([
                this.prisma.gLAccount.groupBy({
                    by: ['accountType', 'isActive'],
                    _count: { id: true },
                }),
                this.prisma.journalEntry.groupBy({
                    by: ['status', 'isSystem'],
                    _count: { id: true },
                }),
                this.prisma.gLAccount.aggregate({
                    where: { accountType: 'asset' },
                    _sum: { debitBalance: true, creditBalance: true },
                }),
                this.prisma.gLAccount.aggregate({
                    where: { accountType: 'liability' },
                    _sum: { debitBalance: true, creditBalance: true },
                }),
                this.prisma.gLAccount.aggregate({
                    where: { accountType: 'equity' },
                    _sum: { debitBalance: true, creditBalance: true },
                }),
                this.prisma.gLAccount.aggregate({
                    where: { accountType: 'revenue' },
                    _sum: { debitBalance: true, creditBalance: true },
                }),
                this.prisma.gLAccount.aggregate({
                    where: { accountType: 'expense' },
                    _sum: { debitBalance: true, creditBalance: true },
                }),
            ]);
            const glAccountsByType = {};
            let totalGLAccounts = 0;
            let activeGLAccounts = 0;
            glAccountsStats.forEach(stat => {
                totalGLAccounts += stat._count.id;
                if (stat.isActive) {
                    activeGLAccounts += stat._count.id;
                }
                if (!glAccountsByType[stat.accountType]) {
                    glAccountsByType[stat.accountType] = 0;
                }
                glAccountsByType[stat.accountType] += stat._count.id;
            });
            let totalJournalEntries = 0;
            let postedEntries = 0;
            let draftEntries = 0;
            let systemEntries = 0;
            let manualEntries = 0;
            journalEntriesStats.forEach(stat => {
                totalJournalEntries += stat._count.id;
                if (stat.status === 'posted') {
                    postedEntries += stat._count.id;
                }
                else if (stat.status === 'draft') {
                    draftEntries += stat._count.id;
                }
                if (stat.isSystem) {
                    systemEntries += stat._count.id;
                }
                else {
                    manualEntries += stat._count.id;
                }
            });
            const totalAssets = Number(assetBalance._sum.debitBalance || 0) - Number(assetBalance._sum.creditBalance || 0);
            const totalLiabilities = Number(liabilityBalance._sum.creditBalance || 0) - Number(liabilityBalance._sum.debitBalance || 0);
            const totalEquity = Number(equityBalance._sum.creditBalance || 0) - Number(equityBalance._sum.debitBalance || 0);
            const totalRevenue = Number(revenueBalance._sum.creditBalance || 0) - Number(revenueBalance._sum.debitBalance || 0);
            const totalExpenses = Number(expenseBalance._sum.debitBalance || 0) - Number(expenseBalance._sum.creditBalance || 0);
            const netProfit = totalRevenue - totalExpenses;
            return {
                glAccounts: {
                    total: totalGLAccounts,
                    active: activeGLAccounts,
                    byType: glAccountsByType,
                },
                journalEntries: {
                    total: totalJournalEntries,
                    posted: postedEntries,
                    draft: draftEntries,
                    system: systemEntries,
                    manual: manualEntries,
                },
                balances: {
                    totalAssets,
                    totalLiabilities,
                    totalEquity,
                    totalRevenue,
                    totalExpenses,
                    netProfit,
                },
            };
        }
        catch (error) {
            this.logger.error('فشل في الحصول على إحصائيات المحاسبة', error);
            throw error;
        }
    }
    async createDefaultSystemAccounts() {
        try {
            this.logger.log('إنشاء حسابات النظام الافتراضية');
            const existingAccounts = await this.prisma.gLAccount.findMany({
                where: { isSystem: true },
            });
            if (existingAccounts.length > 0) {
                this.logger.log('حسابات النظام موجودة بالفعل');
                return;
            }
            for (const [key, account] of Object.entries(this.systemAccounts)) {
                await this.prisma.gLAccount.create({
                    data: {
                        accountCode: account.code,
                        name: account.name,
                        accountType: account.type,
                        isSystem: true,
                        isActive: true,
                    },
                });
            }
            await this.invalidateGLAccountsCache();
            this.logger.log('تم إنشاء حسابات النظام الافتراضية بنجاح');
        }
        catch (error) {
            this.logger.error('فشل في إنشاء حسابات النظام الافتراضية', error);
            throw error;
        }
    }
    async createSalesJournalEntry(salesInvoiceId, customerId, totalAmount, taxAmount, userId) {
        try {
            this.logger.log(`إنشاء قيد تلقائي للمبيعات: ${salesInvoiceId}`);
            const accountsReceivable = await this.prisma.gLAccount.findFirst({
                where: { accountCode: this.systemAccounts.accountsReceivable.code },
            });
            const salesRevenue = await this.prisma.gLAccount.findFirst({
                where: { accountCode: this.systemAccounts.salesRevenue.code },
            });
            const salesTaxPayable = await this.prisma.gLAccount.findFirst({
                where: { accountCode: this.systemAccounts.salesTaxPayable.code },
            });
            if (!accountsReceivable || !salesRevenue || !salesTaxPayable) {
                throw new common_1.BadRequestException('حسابات النظام غير متوفرة - يرجى إنشاء حسابات النظام أولاً');
            }
            const entryNumber = `SALE-${Date.now()}`;
            const entryDto = {
                entryNumber,
                description: `قيد تلقائي لفاتورة المبيعات رقم ${salesInvoiceId}`,
                referenceType: 'sales_invoice',
                referenceId: salesInvoiceId,
                sourceModule: 'sales',
                status: 'posted',
                isSystem: true,
                lines: [
                    {
                        debitAccountId: accountsReceivable.id,
                        creditAccountId: salesRevenue.id,
                        amount: totalAmount - taxAmount,
                        description: 'إيرادات المبيعات',
                        referenceType: 'sales_invoice',
                        referenceId: salesInvoiceId,
                    },
                ],
            };
            if (taxAmount > 0) {
                entryDto.lines.push({
                    debitAccountId: accountsReceivable.id,
                    creditAccountId: salesTaxPayable.id,
                    amount: taxAmount,
                    description: 'ضريبة المبيعات',
                    referenceType: 'sales_invoice',
                    referenceId: salesInvoiceId,
                });
            }
            const journalEntry = await this.createJournalEntry(entryDto, userId);
            this.logger.log(`تم إنشاء قيد المبيعات بنجاح`);
            return journalEntry;
        }
        catch (error) {
            this.logger.error(`فشل في إنشاء قيد المبيعات: ${salesInvoiceId}`, error);
            throw error;
        }
    }
    async createPurchaseJournalEntry(purchaseInvoiceId, supplierId, totalAmount, taxAmount, userId) {
        try {
            this.logger.log(`إنشاء قيد تلقائي للمشتريات: ${purchaseInvoiceId}`);
            const accountsPayable = await this.prisma.gLAccount.findFirst({
                where: { accountCode: this.systemAccounts.accountsPayable.code },
            });
            const inventory = await this.prisma.gLAccount.findFirst({
                where: { accountCode: this.systemAccounts.inventory.code },
            });
            if (!accountsPayable || !inventory) {
                throw new common_1.BadRequestException('حسابات النظام غير متوفرة - يرجى إنشاء حسابات النظام أولاً');
            }
            const entryNumber = `PURCHASE-${Date.now()}`;
            const entryDto = {
                entryNumber,
                description: `قيد تلقائي لفاتورة المشتريات رقم ${purchaseInvoiceId}`,
                referenceType: 'purchase_invoice',
                referenceId: purchaseInvoiceId,
                sourceModule: 'purchasing',
                status: 'posted',
                isSystem: true,
                lines: [
                    {
                        debitAccountId: inventory.id,
                        creditAccountId: accountsPayable.id,
                        amount: totalAmount,
                        description: 'مشتريات المخزون',
                        referenceType: 'purchase_invoice',
                        referenceId: purchaseInvoiceId,
                    },
                ],
            };
            const journalEntry = await this.createJournalEntry(entryDto, userId);
            this.logger.log(`تم إنشاء قيد المشتريات بنجاح`);
            return journalEntry;
        }
        catch (error) {
            this.logger.error(`فشل في إنشاء قيد المشتريات: ${purchaseInvoiceId}`, error);
            throw error;
        }
    }
    async buildGLAccountWithDetails(account) {
        const [children, parent] = await Promise.all([
            this.prisma.gLAccount.findMany({
                where: { parentId: account.id },
                orderBy: { accountCode: 'asc' },
            }),
            account.parentId
                ? this.prisma.gLAccount.findUnique({
                    where: { id: account.parentId },
                })
                : null,
        ]);
        const childrenWithDetails = await Promise.all(children.map(child => this.buildGLAccountWithDetails(child)));
        return {
            id: account.id,
            accountCode: account.accountCode,
            name: account.name,
            description: account.description || undefined,
            accountType: account.accountType,
            parentId: account.parentId || undefined,
            parent: parent ? await this.buildGLAccountWithDetails(parent) : undefined,
            children: childrenWithDetails,
            isActive: account.isActive,
            isSystem: account.isSystem,
            debitBalance: Number(account.debitBalance),
            creditBalance: Number(account.creditBalance),
            netBalance: Number(account.debitBalance) - Number(account.creditBalance),
            createdAt: account.createdAt,
            updatedAt: account.updatedAt,
        };
    }
    async buildJournalEntryWithDetails(entry) {
        const lines = await this.prisma.journalEntryLine.findMany({
            where: { journalEntryId: entry.id },
            orderBy: { lineNumber: 'asc' },
            include: {
                debitAccount: {
                    select: {
                        id: true,
                        accountCode: true,
                        name: true,
                    },
                },
                creditAccount: {
                    select: {
                        id: true,
                        accountCode: true,
                        name: true,
                    },
                },
            },
        });
        return {
            id: entry.id,
            entryNumber: entry.entryNumber,
            entryDate: entry.entryDate,
            description: entry.description,
            referenceType: entry.referenceType || undefined,
            referenceId: entry.referenceId || undefined,
            sourceModule: entry.sourceModule || undefined,
            status: entry.status,
            isSystem: entry.isSystem,
            totalDebit: Number(entry.totalDebit),
            totalCredit: Number(entry.totalCredit),
            isBalanced: Number(entry.totalDebit) === Number(entry.totalCredit),
            createdBy: entry.createdBy || undefined,
            creator: entry.creator || undefined,
            lines: lines.map(line => ({
                id: line.id,
                journalEntryId: line.journalEntryId,
                lineNumber: line.lineNumber,
                debitAccountId: line.debitAccountId,
                debitAccount: line.debitAccount,
                creditAccountId: line.creditAccountId,
                creditAccount: line.creditAccount,
                amount: Number(line.amount),
                description: line.description || undefined,
                referenceType: line.referenceType || undefined,
                referenceId: line.referenceId || undefined,
                createdAt: line.createdAt,
            })),
            createdAt: entry.createdAt,
            updatedAt: entry.updatedAt,
        };
    }
    async wouldCreateCycle(accountId, parentId) {
        let currentId = parentId;
        while (currentId) {
            if (currentId === accountId) {
                return true;
            }
            const account = await this.prisma.gLAccount.findUnique({
                where: { id: currentId },
                select: { parentId: true },
            });
            currentId = account?.parentId || null;
        }
        return false;
    }
    async invalidateGLAccountsCache() {
        await this.cacheService.delete(this.glAccountsCacheKey);
        const accountKeys = await this.cacheService.getKeys(`gl_account:*`);
        for (const key of accountKeys) {
            await this.cacheService.delete(key);
        }
    }
    async invalidateJournalEntriesCache() {
        await this.cacheService.delete(this.journalEntriesCacheKey);
        const entryKeys = await this.cacheService.getKeys(`journal_entry:*`);
        for (const key of entryKeys) {
            await this.cacheService.delete(key);
        }
    }
};
exports.AccountingService = AccountingService;
exports.AccountingService = AccountingService = AccountingService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        cache_service_1.CacheService])
], AccountingService);
//# sourceMappingURL=accounting.service.js.map