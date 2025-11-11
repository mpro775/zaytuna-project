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
var CustomerService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomerService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../shared/database/prisma.service");
const cache_service_1 = require("../../shared/cache/cache.service");
let CustomerService = CustomerService_1 = class CustomerService {
    prisma;
    cacheService;
    logger = new common_1.Logger(CustomerService_1.name);
    customersCacheKey = 'customers';
    customerCacheKey = 'customer';
    loyaltyTiers = {
        bronze: { minPurchases: 0, multiplier: 1, benefits: ['خصم 2% على المشتريات'] },
        silver: { minPurchases: 1000, multiplier: 1.5, benefits: ['خصم 5% على المشتريات', 'شحن مجاني للطلبات فوق 200 ر.س'] },
        gold: { minPurchases: 5000, multiplier: 2, benefits: ['خصم 10% على المشتريات', 'شحن مجاني', 'دعم فني أولوية'] },
        platinum: { minPurchases: 15000, multiplier: 2.5, benefits: ['خصم 15% على المشتريات', 'شحن مجاني', 'دعم فني أولوية', 'هدايا شهرية'] },
    };
    constructor(prisma, cacheService) {
        this.prisma = prisma;
        this.cacheService = cacheService;
    }
    async create(createCustomerDto) {
        try {
            this.logger.log(`إنشاء عميل جديد: ${createCustomerDto.name}`);
            if (createCustomerDto.email) {
                const existingCustomer = await this.prisma.customer.findFirst({
                    where: { email: createCustomerDto.email },
                });
                if (existingCustomer) {
                    throw new common_1.ConflictException('البريد الإلكتروني موجود بالفعل');
                }
            }
            if (createCustomerDto.phone) {
                const existingCustomer = await this.prisma.customer.findFirst({
                    where: { phone: createCustomerDto.phone },
                });
                if (existingCustomer) {
                    throw new common_1.ConflictException('رقم الهاتف موجود بالفعل');
                }
            }
            const customer = await this.prisma.customer.create({
                data: {
                    name: createCustomerDto.name,
                    phone: createCustomerDto.phone,
                    email: createCustomerDto.email,
                    address: createCustomerDto.address,
                    taxNumber: createCustomerDto.taxNumber,
                    creditLimit: createCustomerDto.creditLimit,
                    birthday: createCustomerDto.birthday ? new Date(createCustomerDto.birthday) : undefined,
                    gender: createCustomerDto.gender,
                    marketingConsent: createCustomerDto.marketingConsent ?? false,
                    isActive: createCustomerDto.isActive ?? true,
                },
            });
            await this.invalidateCustomersCache();
            const customerWithDetails = await this.buildCustomerWithDetails(customer);
            this.logger.log(`تم إنشاء العميل بنجاح: ${customer.name}`);
            return customerWithDetails;
        }
        catch (error) {
            this.logger.error('فشل في إنشاء العميل', error);
            throw error;
        }
    }
    async findAll(search, isActive, loyaltyTier, limit = 50) {
        try {
            const cacheKey = `customers:${search || 'all'}:${isActive ?? 'all'}:${loyaltyTier || 'all'}`;
            const cachedCustomers = await this.cacheService.get(cacheKey);
            if (cachedCustomers) {
                return cachedCustomers;
            }
            const where = {};
            if (search) {
                where.OR = [
                    { name: { contains: search, mode: 'insensitive' } },
                    { email: { contains: search, mode: 'insensitive' } },
                    { phone: { contains: search } },
                ];
            }
            if (isActive !== undefined) {
                where.isActive = isActive;
            }
            if (loyaltyTier) {
                where.loyaltyTier = loyaltyTier;
            }
            const customers = await this.prisma.customer.findMany({
                where,
                orderBy: { name: 'asc' },
                take: limit,
            });
            const customersWithDetails = await Promise.all(customers.map(customer => this.buildCustomerWithDetails(customer)));
            await this.cacheService.set(cacheKey, customersWithDetails, { ttl: 600 });
            return customersWithDetails;
        }
        catch (error) {
            this.logger.error('فشل في الحصول على العملاء', error);
            throw error;
        }
    }
    async findOne(id) {
        try {
            const cacheKey = `${this.customerCacheKey}:${id}`;
            const cachedCustomer = await this.cacheService.get(cacheKey);
            if (cachedCustomer) {
                return cachedCustomer;
            }
            const customer = await this.prisma.customer.findUnique({
                where: { id },
            });
            if (!customer) {
                throw new common_1.NotFoundException('العميل غير موجود');
            }
            const customerWithDetails = await this.buildCustomerWithDetails(customer);
            await this.cacheService.set(cacheKey, customerWithDetails, { ttl: 1800 });
            return customerWithDetails;
        }
        catch (error) {
            this.logger.error(`فشل في الحصول على العميل: ${id}`, error);
            throw error;
        }
    }
    async update(id, updateCustomerDto) {
        try {
            this.logger.log(`تحديث العميل: ${id}`);
            const existingCustomer = await this.prisma.customer.findUnique({
                where: { id },
            });
            if (!existingCustomer) {
                throw new common_1.NotFoundException('العميل غير موجود');
            }
            if (updateCustomerDto.email && updateCustomerDto.email !== existingCustomer.email) {
                const existingEmail = await this.prisma.customer.findFirst({
                    where: { email: updateCustomerDto.email },
                });
                if (existingEmail) {
                    throw new common_1.ConflictException('البريد الإلكتروني موجود بالفعل');
                }
            }
            if (updateCustomerDto.phone && updateCustomerDto.phone !== existingCustomer.phone) {
                const existingPhone = await this.prisma.customer.findFirst({
                    where: { phone: updateCustomerDto.phone },
                });
                if (existingPhone) {
                    throw new common_1.ConflictException('رقم الهاتف موجود بالفعل');
                }
            }
            const customer = await this.prisma.customer.update({
                where: { id },
                data: {
                    name: updateCustomerDto.name,
                    phone: updateCustomerDto.phone,
                    email: updateCustomerDto.email,
                    address: updateCustomerDto.address,
                    taxNumber: updateCustomerDto.taxNumber,
                    creditLimit: updateCustomerDto.creditLimit,
                    birthday: updateCustomerDto.birthday ? new Date(updateCustomerDto.birthday) : undefined,
                    gender: updateCustomerDto.gender,
                    marketingConsent: updateCustomerDto.marketingConsent,
                    isActive: updateCustomerDto.isActive,
                },
            });
            await this.invalidateCustomersCache();
            const customerWithDetails = await this.buildCustomerWithDetails(customer);
            this.logger.log(`تم تحديث العميل بنجاح`);
            return customerWithDetails;
        }
        catch (error) {
            this.logger.error(`فشل في تحديث العميل: ${id}`, error);
            throw error;
        }
    }
    async remove(id) {
        try {
            this.logger.log(`حذف العميل: ${id}`);
            const customer = await this.prisma.customer.findUnique({
                where: { id },
                include: {
                    salesInvoices: true,
                    payments: true,
                    returns: true,
                },
            });
            if (!customer) {
                throw new common_1.NotFoundException('العميل غير موجود');
            }
            if (customer.salesInvoices.length > 0 || customer.payments.length > 0 || customer.returns.length > 0) {
                throw new common_1.BadRequestException('لا يمكن حذف عميل مرتبط بمعاملات');
            }
            await this.prisma.customer.delete({
                where: { id },
            });
            await this.invalidateCustomersCache();
            this.logger.log(`تم حذف العميل بنجاح`);
        }
        catch (error) {
            this.logger.error(`فشل في حذف العميل: ${id}`, error);
            throw error;
        }
    }
    async updateLoyaltyPoints(customerId, pointsChange, reason) {
        try {
            this.logger.log(`تحديث نقاط الولاء للعميل: ${customerId}, التغيير: ${pointsChange}`);
            const customer = await this.prisma.customer.findUnique({
                where: { id: customerId },
            });
            if (!customer) {
                throw new common_1.NotFoundException('العميل غير موجود');
            }
            const newPoints = Math.max(0, customer.loyaltyPoints + pointsChange);
            const newTier = this.calculateLoyaltyTier(Number(customer.totalPurchases), newPoints);
            const updatedCustomer = await this.prisma.customer.update({
                where: { id: customerId },
                data: {
                    loyaltyPoints: newPoints,
                    loyaltyTier: newTier,
                },
            });
            await this.invalidateCustomersCache();
            const customerWithDetails = await this.buildCustomerWithDetails(updatedCustomer);
            this.logger.log(`تم تحديث نقاط الولاء بنجاح: ${reason}`);
            return customerWithDetails;
        }
        catch (error) {
            this.logger.error(`فشل في تحديث نقاط الولاء: ${customerId}`, error);
            throw error;
        }
    }
    async updateCustomerStatsOnSale(customerId, saleAmount, paymentMethod) {
        try {
            const customer = await this.prisma.customer.findUnique({
                where: { id: customerId },
            });
            if (!customer) {
                return;
            }
            const pointsEarned = Math.floor(saleAmount / 10);
            const newTotalPurchases = Number(customer.totalPurchases) + saleAmount;
            const newPoints = customer.loyaltyPoints + pointsEarned;
            const newTier = this.calculateLoyaltyTier(newTotalPurchases, newPoints);
            await this.prisma.customer.update({
                where: { id: customerId },
                data: {
                    totalPurchases: newTotalPurchases,
                    loyaltyPoints: newPoints,
                    loyaltyTier: newTier,
                    lastPurchaseDate: new Date(),
                    preferredPaymentMethod: paymentMethod || customer.preferredPaymentMethod,
                },
            });
            await this.invalidateCustomersCache();
            this.logger.log(`تم تحديث إحصائيات العميل بعد البيع: ${customerId}`);
        }
        catch (error) {
            this.logger.error(`فشل في تحديث إحصائيات العميل: ${customerId}`, error);
        }
    }
    async getLoyaltyStats(customerId) {
        try {
            const customer = await this.prisma.customer.findUnique({
                where: { id: customerId },
                include: {
                    salesInvoices: {
                        take: 10,
                        orderBy: { createdAt: 'desc' },
                        select: {
                            id: true,
                            totalAmount: true,
                            createdAt: true,
                        },
                    },
                    returns: {
                        take: 10,
                        orderBy: { createdAt: 'desc' },
                        select: {
                            id: true,
                            totalAmount: true,
                            createdAt: true,
                        },
                    },
                },
            });
            if (!customer) {
                throw new common_1.NotFoundException('العميل غير موجود');
            }
            const currentTier = customer.loyaltyTier;
            const { pointsToNextTier, nextTier } = this.getNextTierInfo(currentTier, Number(customer.totalPurchases), customer.loyaltyPoints);
            const tierBenefits = this.loyaltyTiers[currentTier]?.benefits || [];
            const recentTransactions = [
                ...customer.salesInvoices.map(invoice => ({
                    id: invoice.id,
                    type: 'sale',
                    amount: Number(invoice.totalAmount),
                    pointsEarned: Math.floor(Number(invoice.totalAmount) / 10),
                    date: invoice.createdAt,
                })),
                ...customer.returns.map(returnDoc => ({
                    id: returnDoc.id,
                    type: 'return',
                    amount: -Number(returnDoc.totalAmount),
                    pointsEarned: 0,
                    date: returnDoc.createdAt,
                })),
            ].sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 10);
            return {
                currentTier,
                pointsToNextTier,
                nextTier,
                tierBenefits,
                recentTransactions,
            };
        }
        catch (error) {
            this.logger.error(`فشل في الحصول على إحصائيات الولاء: ${customerId}`, error);
            throw error;
        }
    }
    async getCustomerStats(startDate, endDate) {
        try {
            const where = {};
            if (startDate || endDate) {
                where.createdAt = {};
                if (startDate)
                    where.createdAt.gte = startDate;
                if (endDate)
                    where.createdAt.lte = endDate;
            }
            const [totalCustomers, activeCustomers, totalLoyaltyPoints, tierBreakdown, topCustomers, newCustomersThisMonth,] = await Promise.all([
                this.prisma.customer.count(),
                this.prisma.customer.count({ where: { isActive: true } }),
                this.prisma.customer.aggregate({ _sum: { loyaltyPoints: true } }),
                this.prisma.customer.groupBy({
                    by: ['loyaltyTier'],
                    _count: { id: true },
                }),
                this.prisma.customer.findMany({
                    orderBy: { totalPurchases: 'desc' },
                    take: 10,
                    select: {
                        id: true,
                        name: true,
                        totalPurchases: true,
                        loyaltyTier: true,
                    },
                }),
                this.prisma.customer.count({
                    where: {
                        createdAt: {
                            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
                        },
                    },
                }),
            ]);
            return {
                overview: {
                    total: totalCustomers,
                    active: activeCustomers,
                    inactive: totalCustomers - activeCustomers,
                    totalLoyaltyPoints: Number(totalLoyaltyPoints._sum.loyaltyPoints || 0),
                    newThisMonth: newCustomersThisMonth,
                },
                tierBreakdown: tierBreakdown.reduce((acc, tier) => {
                    acc[tier.loyaltyTier] = tier._count.id;
                    return acc;
                }, {}),
                topCustomers: topCustomers.map(customer => ({
                    id: customer.id,
                    name: customer.name,
                    totalPurchases: Number(customer.totalPurchases),
                    tier: customer.loyaltyTier,
                })),
            };
        }
        catch (error) {
            this.logger.error('فشل في الحصول على إحصائيات العملاء', error);
            throw error;
        }
    }
    async searchCustomers(query, filters, limit = 50) {
        try {
            const where = {};
            if (query) {
                where.OR = [
                    { name: { contains: query, mode: 'insensitive' } },
                    { email: { contains: query, mode: 'insensitive' } },
                    { phone: { contains: query } },
                    { address: { contains: query, mode: 'insensitive' } },
                ];
            }
            if (filters?.loyaltyTier) {
                where.loyaltyTier = filters.loyaltyTier;
            }
            if (filters?.minPurchases !== undefined || filters?.maxPurchases !== undefined) {
                where.totalPurchases = {};
                if (filters.minPurchases !== undefined) {
                    where.totalPurchases.gte = filters.minPurchases;
                }
                if (filters.maxPurchases !== undefined) {
                    where.totalPurchases.lte = filters.maxPurchases;
                }
            }
            if (filters?.hasMarketingConsent !== undefined) {
                where.marketingConsent = filters.hasMarketingConsent;
            }
            if (filters?.gender) {
                where.gender = filters.gender;
            }
            const customers = await this.prisma.customer.findMany({
                where,
                orderBy: { name: 'asc' },
                take: limit,
            });
            const customersWithDetails = await Promise.all(customers.map(customer => this.buildCustomerWithDetails(customer)));
            return customersWithDetails;
        }
        catch (error) {
            this.logger.error('فشل في البحث في العملاء', error);
            throw error;
        }
    }
    async buildCustomerWithDetails(customer) {
        const [invoiceStats, paymentStats] = await Promise.all([
            this.prisma.salesInvoice.aggregate({
                where: { customerId: customer.id },
                _count: { id: true },
                _sum: { totalAmount: true },
            }),
            this.prisma.payment.aggregate({
                where: { customerId: customer.id },
                _sum: { amount: true },
            }),
        ]);
        const totalInvoices = invoiceStats._count.id;
        const totalPaid = Number(paymentStats._sum.amount || 0);
        const totalPurchases = Number(invoiceStats._sum.totalAmount || 0);
        const outstandingBalance = totalPurchases - totalPaid;
        return {
            id: customer.id,
            name: customer.name,
            phone: customer.phone || undefined,
            email: customer.email || undefined,
            address: customer.address || undefined,
            taxNumber: customer.taxNumber || undefined,
            creditLimit: customer.creditLimit ? Number(customer.creditLimit) : undefined,
            loyaltyPoints: customer.loyaltyPoints,
            loyaltyTier: customer.loyaltyTier,
            totalPurchases: Number(customer.totalPurchases),
            lastPurchaseDate: customer.lastPurchaseDate || undefined,
            preferredPaymentMethod: customer.preferredPaymentMethod || undefined,
            birthday: customer.birthday || undefined,
            gender: customer.gender || undefined,
            marketingConsent: customer.marketingConsent,
            isActive: customer.isActive,
            totalInvoices,
            totalReturns: 0,
            totalPaid,
            outstandingBalance,
            createdAt: customer.createdAt,
            updatedAt: customer.updatedAt,
        };
    }
    calculateLoyaltyTier(totalPurchases, loyaltyPoints) {
        if (totalPurchases >= this.loyaltyTiers.platinum.minPurchases) {
            return 'platinum';
        }
        else if (totalPurchases >= this.loyaltyTiers.gold.minPurchases) {
            return 'gold';
        }
        else if (totalPurchases >= this.loyaltyTiers.silver.minPurchases) {
            return 'silver';
        }
        else {
            return 'bronze';
        }
    }
    getNextTierInfo(currentTier, totalPurchases, points) {
        const tiers = ['bronze', 'silver', 'gold', 'platinum'];
        const currentIndex = tiers.indexOf(currentTier);
        if (currentIndex === tiers.length - 1) {
            return { pointsToNextTier: 0, nextTier: currentTier };
        }
        const nextTier = tiers[currentIndex + 1];
        const nextTierMinPurchases = this.loyaltyTiers[nextTier].minPurchases;
        const pointsToNextTier = Math.max(0, nextTierMinPurchases - totalPurchases);
        return { pointsToNextTier, nextTier };
    }
    async invalidateCustomersCache() {
        await this.cacheService.delete(this.customersCacheKey);
        const customerKeys = await this.cacheService.getKeys(`${this.customerCacheKey}:*`);
        for (const key of customerKeys) {
            await this.cacheService.delete(key);
        }
    }
};
exports.CustomerService = CustomerService;
exports.CustomerService = CustomerService = CustomerService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        cache_service_1.CacheService])
], CustomerService);
//# sourceMappingURL=customer.service.js.map