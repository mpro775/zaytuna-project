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
var ReturnsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReturnsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../shared/database/prisma.service");
const cache_service_1 = require("../../shared/cache/cache.service");
const inventory_service_1 = require("../inventory/inventory.service");
let ReturnsService = ReturnsService_1 = class ReturnsService {
    prisma;
    cacheService;
    inventoryService;
    logger = new common_1.Logger(ReturnsService_1.name);
    returnsCacheKey = 'returns';
    returnCacheKey = 'return';
    constructor(prisma, cacheService, inventoryService) {
        this.prisma = prisma;
        this.cacheService = cacheService;
        this.inventoryService = inventoryService;
    }
    async create(createReturnDto, userId) {
        try {
            this.logger.log(`إنشاء مرتجع جديد: ${createReturnDto.returnNumber || 'بدون رقم'}`);
            const salesInvoice = await this.prisma.salesInvoice.findUnique({
                where: { id: createReturnDto.salesInvoiceId },
                include: {
                    lines: true,
                    customer: true,
                    warehouse: true,
                },
            });
            if (!salesInvoice) {
                throw new common_1.NotFoundException('فاتورة المبيعات غير موجودة');
            }
            if (salesInvoice.status !== 'confirmed') {
                throw new common_1.BadRequestException('لا يمكن إنشاء مرتجع إلا لفاتورة مؤكدة');
            }
            if (createReturnDto.warehouseId !== salesInvoice.warehouseId) {
                throw new common_1.BadRequestException('مخزن المرتجع يجب أن يكون نفس مخزن فاتورة المبيعات');
            }
            if (createReturnDto.returnNumber) {
                const existingReturn = await this.prisma.return.findUnique({
                    where: { returnNumber: createReturnDto.returnNumber },
                });
                if (existingReturn) {
                    throw new common_1.ConflictException('رقم المرتجع موجود بالفعل');
                }
            }
            const returnItems = new Map();
            for (const line of createReturnDto.lines) {
                const salesLine = salesInvoice.lines.find(sl => sl.productVariantId === line.productVariantId);
                if (!salesLine) {
                    throw new common_1.BadRequestException(`المنتج ${line.productVariantId} غير موجود في فاتورة المبيعات`);
                }
                if (line.quantity > Number(salesLine.quantity)) {
                    throw new common_1.BadRequestException(`كمية المرتجع (${line.quantity}) أكبر من كمية المبيعات (${salesLine.quantity}) للمنتج ${line.productVariantId}`);
                }
                if (returnItems.has(line.productVariantId)) {
                    throw new common_1.BadRequestException(`المنتج ${line.productVariantId} موجود أكثر من مرة في المرتجع`);
                }
                returnItems.set(line.productVariantId, {
                    salesLine,
                    returnLine: line,
                });
            }
            return await this.prisma.$transaction(async (tx) => {
                let returnNumber = createReturnDto.returnNumber;
                if (!returnNumber) {
                    const lastReturn = await tx.return.findFirst({
                        where: { salesInvoiceId: createReturnDto.salesInvoiceId },
                        orderBy: { createdAt: 'desc' },
                    });
                    const sequence = lastReturn ? parseInt(lastReturn.returnNumber.split('-')[2] || '0') + 1 : 1;
                    returnNumber = `${salesInvoice.invoiceNumber}-RTN-${sequence.toString().padStart(3, '0')}`;
                }
                let subtotal = 0;
                let taxAmount = 0;
                let discountAmount = 0;
                for (const line of createReturnDto.lines) {
                    const { salesLine } = returnItems.get(line.productVariantId);
                    const unitPrice = Number(salesLine.unitPrice);
                    const lineSubtotal = unitPrice * line.quantity;
                    const lineDiscount = line.discountAmount || 0;
                    const lineTax = line.taxAmount || 0;
                    subtotal += lineSubtotal;
                    discountAmount += lineDiscount;
                    taxAmount += lineTax;
                    line.unitPrice = unitPrice;
                    line.discountAmount = lineDiscount;
                    line.taxAmount = lineTax;
                    line.lineTotal = lineSubtotal - lineDiscount + lineTax;
                }
                const totalAmount = subtotal - discountAmount + taxAmount;
                const returnDoc = await tx.return.create({
                    data: {
                        returnNumber,
                        salesInvoiceId: createReturnDto.salesInvoiceId,
                        customerId: salesInvoice.customerId,
                        cashierId: userId,
                        warehouseId: createReturnDto.warehouseId,
                        subtotal,
                        taxAmount,
                        discountAmount,
                        totalAmount,
                        currencyId: salesInvoice.currencyId,
                        reason: createReturnDto.reason,
                        status: createReturnDto.status || 'draft',
                        refundStatus: 'pending',
                        notes: createReturnDto.notes,
                        lines: {
                            create: createReturnDto.lines.map(line => ({
                                productVariantId: line.productVariantId,
                                warehouseId: createReturnDto.warehouseId,
                                quantity: line.quantity,
                                unitPrice: line.unitPrice || 0,
                                discountAmount: line.discountAmount || 0,
                                taxAmount: line.taxAmount || 0,
                                lineTotal: line.lineTotal || 0,
                                reason: line.reason,
                            })),
                        },
                    },
                    include: {
                        salesInvoice: {
                            select: {
                                id: true,
                                invoiceNumber: true,
                                totalAmount: true,
                                customer: {
                                    select: {
                                        id: true,
                                        name: true,
                                    },
                                },
                            },
                        },
                        customer: {
                            select: {
                                id: true,
                                name: true,
                                phone: true,
                                email: true,
                            },
                        },
                        cashier: {
                            select: {
                                id: true,
                                username: true,
                            },
                        },
                        warehouse: {
                            select: {
                                id: true,
                                name: true,
                                code: true,
                            },
                        },
                        currency: {
                            select: {
                                id: true,
                                code: true,
                                name: true,
                                symbol: true,
                            },
                        },
                        lines: {
                            include: {
                                productVariant: {
                                    select: {
                                        id: true,
                                        name: true,
                                        sku: true,
                                        barcode: true,
                                        product: {
                                            select: {
                                                id: true,
                                                name: true,
                                            },
                                        },
                                    },
                                },
                            },
                        },
                        creditNotes: {
                            select: {
                                id: true,
                                creditNoteNumber: true,
                                amount: true,
                                remainingAmount: true,
                                status: true,
                                expiryDate: true,
                            },
                        },
                    },
                });
                for (const line of createReturnDto.lines) {
                    await this.inventoryService.adjustStock(createReturnDto.warehouseId, line.productVariantId, {
                        quantity: line.quantity,
                        movementType: 'return',
                        referenceType: 'return',
                        referenceId: returnDoc.id,
                        reason: `مرتجع - ${returnNumber}: ${line.reason || 'بدون سبب'}`,
                    }, userId);
                }
                await this.invalidateReturnsCache();
                const returnWithDetails = this.buildReturnWithDetails(returnDoc);
                this.logger.log(`تم إنشاء المرتجع بنجاح: ${returnNumber}`);
                return returnWithDetails;
            });
        }
        catch (error) {
            this.logger.error('فشل في إنشاء المرتجع', error);
            throw error;
        }
    }
    async findAll(salesInvoiceId, customerId, status, refundStatus, limit = 50) {
        try {
            const cacheKey = `returns:${salesInvoiceId || 'all'}:${customerId || 'all'}:${status || 'all'}:${refundStatus || 'all'}`;
            const cachedReturns = await this.cacheService.get(cacheKey);
            if (cachedReturns) {
                return cachedReturns;
            }
            const where = {};
            if (salesInvoiceId) {
                where.salesInvoiceId = salesInvoiceId;
            }
            if (customerId) {
                where.customerId = customerId;
            }
            if (status) {
                where.status = status;
            }
            if (refundStatus) {
                where.refundStatus = refundStatus;
            }
            const returns = await this.prisma.return.findMany({
                where,
                include: {
                    salesInvoice: {
                        select: {
                            id: true,
                            invoiceNumber: true,
                            totalAmount: true,
                            customer: {
                                select: {
                                    id: true,
                                    name: true,
                                },
                            },
                        },
                    },
                    customer: {
                        select: {
                            id: true,
                            name: true,
                            phone: true,
                            email: true,
                        },
                    },
                    cashier: {
                        select: {
                            id: true,
                            username: true,
                        },
                    },
                    warehouse: {
                        select: {
                            id: true,
                            name: true,
                            code: true,
                        },
                    },
                    currency: {
                        select: {
                            id: true,
                            code: true,
                            name: true,
                            symbol: true,
                        },
                    },
                    lines: {
                        include: {
                            productVariant: {
                                select: {
                                    id: true,
                                    name: true,
                                    sku: true,
                                    barcode: true,
                                    product: {
                                        select: {
                                            id: true,
                                            name: true,
                                        },
                                    },
                                },
                            },
                        },
                    },
                    creditNotes: {
                        select: {
                            id: true,
                            creditNoteNumber: true,
                            amount: true,
                            remainingAmount: true,
                            status: true,
                            expiryDate: true,
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
                take: limit,
            });
            const returnsWithDetails = returns.map(returnDoc => this.buildReturnWithDetails(returnDoc));
            await this.cacheService.set(cacheKey, returnsWithDetails, { ttl: 600 });
            return returnsWithDetails;
        }
        catch (error) {
            this.logger.error('فشل في الحصول على المرتجعات', error);
            throw error;
        }
    }
    async findOne(id) {
        try {
            const cacheKey = `${this.returnCacheKey}:${id}`;
            const cachedReturn = await this.cacheService.get(cacheKey);
            if (cachedReturn) {
                return cachedReturn;
            }
            const returnDoc = await this.prisma.return.findUnique({
                where: { id },
                include: {
                    salesInvoice: {
                        select: {
                            id: true,
                            invoiceNumber: true,
                            totalAmount: true,
                            customer: {
                                select: {
                                    id: true,
                                    name: true,
                                },
                            },
                        },
                    },
                    customer: {
                        select: {
                            id: true,
                            name: true,
                            phone: true,
                            email: true,
                        },
                    },
                    cashier: {
                        select: {
                            id: true,
                            username: true,
                        },
                    },
                    warehouse: {
                        select: {
                            id: true,
                            name: true,
                            code: true,
                        },
                    },
                    currency: {
                        select: {
                            id: true,
                            code: true,
                            name: true,
                            symbol: true,
                        },
                    },
                    lines: {
                        include: {
                            productVariant: {
                                select: {
                                    id: true,
                                    name: true,
                                    sku: true,
                                    barcode: true,
                                    product: {
                                        select: {
                                            id: true,
                                            name: true,
                                        },
                                    },
                                },
                            },
                        },
                    },
                    creditNotes: {
                        select: {
                            id: true,
                            creditNoteNumber: true,
                            amount: true,
                            remainingAmount: true,
                            status: true,
                            expiryDate: true,
                        },
                    },
                },
            });
            if (!returnDoc) {
                throw new common_1.NotFoundException('المرتجع غير موجود');
            }
            const returnWithDetails = this.buildReturnWithDetails(returnDoc);
            await this.cacheService.set(cacheKey, returnWithDetails, { ttl: 1800 });
            return returnWithDetails;
        }
        catch (error) {
            this.logger.error(`فشل في الحصول على المرتجع: ${id}`, error);
            throw error;
        }
    }
    async update(id, updateReturnDto) {
        try {
            this.logger.log(`تحديث المرتجع: ${id}`);
            const existingReturn = await this.prisma.return.findUnique({
                where: { id },
            });
            if (!existingReturn) {
                throw new common_1.NotFoundException('المرتجع غير موجود');
            }
            if (['confirmed', 'cancelled'].includes(existingReturn.status)) {
                throw new common_1.BadRequestException('لا يمكن تحديث مرتجع مؤكد أو ملغى');
            }
            const returnDoc = await this.prisma.return.update({
                where: { id },
                data: {
                    status: updateReturnDto.status,
                    refundStatus: updateReturnDto.refundStatus,
                    notes: updateReturnDto.notes,
                },
                include: {
                    salesInvoice: {
                        select: {
                            id: true,
                            invoiceNumber: true,
                            totalAmount: true,
                            customer: {
                                select: {
                                    id: true,
                                    name: true,
                                },
                            },
                        },
                    },
                    customer: {
                        select: {
                            id: true,
                            name: true,
                            phone: true,
                            email: true,
                        },
                    },
                    cashier: {
                        select: {
                            id: true,
                            username: true,
                        },
                    },
                    warehouse: {
                        select: {
                            id: true,
                            name: true,
                            code: true,
                        },
                    },
                    currency: {
                        select: {
                            id: true,
                            code: true,
                            name: true,
                            symbol: true,
                        },
                    },
                    lines: {
                        include: {
                            productVariant: {
                                select: {
                                    id: true,
                                    name: true,
                                    sku: true,
                                    barcode: true,
                                    product: {
                                        select: {
                                            id: true,
                                            name: true,
                                        },
                                    },
                                },
                            },
                        },
                    },
                    creditNotes: {
                        select: {
                            id: true,
                            creditNoteNumber: true,
                            amount: true,
                            remainingAmount: true,
                            status: true,
                            expiryDate: true,
                        },
                    },
                },
            });
            await this.invalidateReturnsCache();
            const returnWithDetails = this.buildReturnWithDetails(returnDoc);
            this.logger.log(`تم تحديث المرتجع بنجاح`);
            return returnWithDetails;
        }
        catch (error) {
            this.logger.error(`فشل في تحديث المرتجع: ${id}`, error);
            throw error;
        }
    }
    async createCreditNote(returnId, createCreditNoteDto, userId) {
        try {
            this.logger.log(`إنشاء إشعار دائن للمرتجع: ${returnId}`);
            const returnDoc = await this.prisma.return.findUnique({
                where: { id: returnId },
                include: {
                    creditNotes: true,
                },
            });
            if (!returnDoc) {
                throw new common_1.NotFoundException('المرتجع غير موجود');
            }
            if (returnDoc.status !== 'confirmed') {
                throw new common_1.BadRequestException('لا يمكن إنشاء إشعار دائن إلا لمرتجع مؤكد');
            }
            const currentCreditTotal = returnDoc.creditNotes.reduce((sum, note) => sum + Number(note.amount), 0);
            const remainingAmount = Number(returnDoc.totalAmount) - currentCreditTotal;
            if (createCreditNoteDto.amount > remainingAmount) {
                throw new common_1.BadRequestException(`مبلغ الإشعار الدائن يتجاوز المبلغ المتبقي (${remainingAmount})`);
            }
            return await this.prisma.$transaction(async (tx) => {
                const lastCreditNote = await tx.creditNote.findFirst({
                    orderBy: { createdAt: 'desc' },
                });
                const sequence = lastCreditNote
                    ? parseInt(lastCreditNote.creditNoteNumber.split('-')[2] || '0') + 1
                    : 1;
                const creditNoteNumber = `CN-${new Date().getFullYear()}-${sequence.toString().padStart(6, '0')}`;
                const creditNote = await tx.creditNote.create({
                    data: {
                        creditNoteNumber,
                        returnId,
                        customerId: returnDoc.customerId,
                        currencyId: returnDoc.currencyId,
                        amount: createCreditNoteDto.amount,
                        remainingAmount: createCreditNoteDto.amount,
                        status: 'active',
                        expiryDate: createCreditNoteDto.expiryDate,
                        notes: createCreditNoteDto.notes,
                    },
                });
                const newCreditTotal = currentCreditTotal + Number(createCreditNoteDto.amount);
                let refundStatus = 'partial';
                if (newCreditTotal >= Number(returnDoc.totalAmount)) {
                    refundStatus = 'refunded';
                }
                await tx.return.update({
                    where: { id: returnId },
                    data: { refundStatus },
                });
                await this.invalidateReturnsCache();
                this.logger.log(`تم إنشاء إشعار الدائن بنجاح: ${creditNoteNumber}`);
                return creditNote;
            });
        }
        catch (error) {
            this.logger.error(`فشل في إنشاء إشعار الدائن: ${returnId}`, error);
            throw error;
        }
    }
    async cancel(id, reason, userId) {
        try {
            this.logger.log(`إلغاء المرتجع: ${id}`);
            const returnDoc = await this.prisma.return.findUnique({
                where: { id },
                include: {
                    lines: {
                        include: {
                            productVariant: true,
                        },
                    },
                },
            });
            if (!returnDoc) {
                throw new common_1.NotFoundException('المرتجع غير موجود');
            }
            if (['cancelled'].includes(returnDoc.status)) {
                throw new common_1.BadRequestException('المرتجع ملغى بالفعل');
            }
            return await this.prisma.$transaction(async (tx) => {
                const updatedReturn = await tx.return.update({
                    where: { id },
                    data: {
                        status: 'cancelled',
                        notes: returnDoc.notes
                            ? `${returnDoc.notes}\n\nتم الإلغاء: ${reason}`
                            : `تم الإلغاء: ${reason}`,
                    },
                    include: {
                        salesInvoice: {
                            select: {
                                id: true,
                                invoiceNumber: true,
                                totalAmount: true,
                                customer: {
                                    select: {
                                        id: true,
                                        name: true,
                                    },
                                },
                            },
                        },
                        customer: {
                            select: {
                                id: true,
                                name: true,
                                phone: true,
                                email: true,
                            },
                        },
                        cashier: {
                            select: {
                                id: true,
                                username: true,
                            },
                        },
                        warehouse: {
                            select: {
                                id: true,
                                name: true,
                                code: true,
                            },
                        },
                        currency: {
                            select: {
                                id: true,
                                code: true,
                                name: true,
                                symbol: true,
                            },
                        },
                        lines: {
                            include: {
                                productVariant: {
                                    select: {
                                        id: true,
                                        name: true,
                                        sku: true,
                                        barcode: true,
                                        product: {
                                            select: {
                                                id: true,
                                                name: true,
                                            },
                                        },
                                    },
                                },
                            },
                        },
                        creditNotes: {
                            select: {
                                id: true,
                                creditNoteNumber: true,
                                amount: true,
                                remainingAmount: true,
                                status: true,
                                expiryDate: true,
                            },
                        },
                    },
                });
                for (const line of returnDoc.lines) {
                    await this.inventoryService.adjustStock(returnDoc.warehouseId, line.productVariantId, {
                        quantity: -Number(line.quantity),
                        movementType: 'adjustment',
                        referenceType: 'return_cancelled',
                        referenceId: returnDoc.id,
                        reason: `إلغاء مرتجع - ${returnDoc.returnNumber}`,
                    }, userId);
                }
                await this.invalidateReturnsCache();
                const returnWithDetails = this.buildReturnWithDetails(updatedReturn);
                this.logger.log(`تم إلغاء المرتجع بنجاح: ${id}`);
                return returnWithDetails;
            });
        }
        catch (error) {
            this.logger.error(`فشل في إلغاء المرتجع: ${id}`, error);
            throw error;
        }
    }
    async getReturnsStats(startDate, endDate) {
        try {
            const where = {};
            if (startDate || endDate) {
                where.createdAt = {};
                if (startDate)
                    where.createdAt.gte = startDate;
                if (endDate)
                    where.createdAt.lte = endDate;
            }
            const [totalReturns, confirmedReturns, totalReturnValue, totalCreditNotes, totalRefunded, pendingRefunds,] = await Promise.all([
                this.prisma.return.count({ where }),
                this.prisma.return.count({
                    where: { ...where, status: 'confirmed' },
                }),
                this.prisma.return.aggregate({
                    where: { ...where, status: 'confirmed' },
                    _sum: { totalAmount: true },
                }),
                this.prisma.creditNote.count({ where }),
                this.prisma.return.count({
                    where: { ...where, refundStatus: 'refunded' },
                }),
                this.prisma.return.count({
                    where: { ...where, refundStatus: 'pending' },
                }),
            ]);
            return {
                totalReturns,
                confirmedReturns,
                cancelledReturns: totalReturns - confirmedReturns,
                totalReturnValue: Number(totalReturnValue._sum.totalAmount || 0),
                totalCreditNotes,
                refundedReturns: totalRefunded,
                pendingRefunds,
                averageReturnValue: confirmedReturns > 0
                    ? Number(totalReturnValue._sum.totalAmount || 0) / confirmedReturns
                    : 0,
            };
        }
        catch (error) {
            this.logger.error('فشل في الحصول على إحصائيات المرتجعات', error);
            throw error;
        }
    }
    buildReturnWithDetails(returnDoc) {
        return {
            id: returnDoc.id,
            returnNumber: returnDoc.returnNumber,
            salesInvoiceId: returnDoc.salesInvoiceId,
            customerId: returnDoc.customerId || undefined,
            cashierId: returnDoc.cashierId,
            warehouseId: returnDoc.warehouseId,
            subtotal: Number(returnDoc.subtotal),
            taxAmount: Number(returnDoc.taxAmount),
            discountAmount: Number(returnDoc.discountAmount),
            totalAmount: Number(returnDoc.totalAmount),
            currencyId: returnDoc.currencyId,
            reason: returnDoc.reason,
            status: returnDoc.status,
            refundStatus: returnDoc.refundStatus,
            notes: returnDoc.notes || undefined,
            salesInvoice: returnDoc.salesInvoice,
            customer: returnDoc.customer || undefined,
            cashier: returnDoc.cashier,
            warehouse: returnDoc.warehouse,
            currency: returnDoc.currency,
            lines: returnDoc.lines.map((line) => ({
                id: line.id,
                productVariantId: line.productVariantId,
                warehouseId: line.warehouseId,
                quantity: Number(line.quantity),
                unitPrice: Number(line.unitPrice),
                discountAmount: Number(line.discountAmount),
                taxAmount: Number(line.taxAmount),
                lineTotal: Number(line.lineTotal),
                reason: line.reason || undefined,
                productVariant: line.productVariant,
            })),
            creditNotes: returnDoc.creditNotes.map((note) => ({
                id: note.id,
                creditNoteNumber: note.creditNoteNumber,
                amount: Number(note.amount),
                remainingAmount: Number(note.remainingAmount),
                status: note.status,
                expiryDate: note.expiryDate || undefined,
            })),
            createdAt: returnDoc.createdAt,
            updatedAt: returnDoc.updatedAt,
        };
    }
    async invalidateReturnsCache() {
        await this.cacheService.delete(this.returnsCacheKey);
        const returnsKeys = await this.cacheService.getKeys('returns:*');
        for (const key of returnsKeys) {
            await this.cacheService.delete(key);
        }
        const returnKeys = await this.cacheService.getKeys(`${this.returnCacheKey}:*`);
        for (const key of returnKeys) {
            await this.cacheService.delete(key);
        }
    }
};
exports.ReturnsService = ReturnsService;
exports.ReturnsService = ReturnsService = ReturnsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        cache_service_1.CacheService,
        inventory_service_1.InventoryService])
], ReturnsService);
//# sourceMappingURL=returns.service.js.map