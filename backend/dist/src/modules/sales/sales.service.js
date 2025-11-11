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
var SalesService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SalesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../shared/database/prisma.service");
const cache_service_1 = require("../../shared/cache/cache.service");
const inventory_service_1 = require("../inventory/inventory.service");
let SalesService = SalesService_1 = class SalesService {
    prisma;
    cacheService;
    inventoryService;
    logger = new common_1.Logger(SalesService_1.name);
    salesInvoicesCacheKey = 'sales_invoices';
    salesInvoiceCacheKey = 'sales_invoice';
    constructor(prisma, cacheService, inventoryService) {
        this.prisma = prisma;
        this.cacheService = cacheService;
        this.inventoryService = inventoryService;
    }
    async create(createSalesInvoiceDto, userId) {
        try {
            this.logger.log(`إنشاء فاتورة مبيعات جديدة: ${createSalesInvoiceDto.invoiceNumber || 'بدون رقم'}`);
            const branch = await this.prisma.branch.findUnique({
                where: { id: createSalesInvoiceDto.branchId },
            });
            if (!branch) {
                throw new common_1.NotFoundException('الفرع غير موجود');
            }
            if (createSalesInvoiceDto.customerId) {
                const customer = await this.prisma.customer.findUnique({
                    where: { id: createSalesInvoiceDto.customerId },
                });
                if (!customer) {
                    throw new common_1.NotFoundException('العميل غير موجود');
                }
            }
            const warehouse = await this.prisma.warehouse.findUnique({
                where: { id: createSalesInvoiceDto.warehouseId },
            });
            if (!warehouse) {
                throw new common_1.NotFoundException('المخزن غير موجود');
            }
            const currency = await this.prisma.currency.findUnique({
                where: { id: createSalesInvoiceDto.currencyId },
            });
            if (!currency) {
                throw new common_1.NotFoundException('العملة غير موجودة');
            }
            if (createSalesInvoiceDto.invoiceNumber) {
                const existingInvoice = await this.prisma.salesInvoice.findUnique({
                    where: { invoiceNumber: createSalesInvoiceDto.invoiceNumber },
                });
                if (existingInvoice) {
                    throw new common_1.ConflictException('رقم الفاتورة موجود بالفعل');
                }
            }
            return await this.prisma.$transaction(async (tx) => {
                let invoiceNumber = createSalesInvoiceDto.invoiceNumber;
                if (!invoiceNumber) {
                    const lastInvoice = await tx.salesInvoice.findFirst({
                        where: { branchId: createSalesInvoiceDto.branchId },
                        orderBy: { createdAt: 'desc' },
                    });
                    const sequence = lastInvoice ? parseInt(lastInvoice.invoiceNumber.split('-')[1] || '0') + 1 : 1;
                    invoiceNumber = `${branch.code}-INV-${sequence.toString().padStart(6, '0')}`;
                }
                let subtotal = 0;
                let taxAmount = 0;
                let discountAmount = 0;
                for (const line of createSalesInvoiceDto.lines) {
                    const stockItem = await tx.stockItem.findUnique({
                        where: {
                            warehouseId_productVariantId: {
                                warehouseId: createSalesInvoiceDto.warehouseId,
                                productVariantId: line.productVariantId,
                            },
                        },
                        include: {
                            productVariant: {
                                include: {
                                    product: true,
                                },
                            },
                        },
                    });
                    if (!stockItem) {
                        throw new common_1.BadRequestException(`المنتج ${line.productVariantId} غير متوفر في المخزن المحدد`);
                    }
                    if (Number(stockItem.quantity) < line.quantity) {
                        throw new common_1.BadRequestException(`الكمية المتاحة من ${stockItem.productVariant.name} غير كافية (${stockItem.quantity} متوفر)`);
                    }
                    const unitPrice = line.unitPrice || Number(stockItem.productVariant.price) ||
                        Number(stockItem.productVariant.product.basePrice);
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
                const salesInvoice = await tx.salesInvoice.create({
                    data: {
                        invoiceNumber,
                        branchId: createSalesInvoiceDto.branchId,
                        customerId: createSalesInvoiceDto.customerId,
                        cashierId: userId,
                        warehouseId: createSalesInvoiceDto.warehouseId,
                        subtotal,
                        taxAmount,
                        discountAmount,
                        totalAmount,
                        currencyId: createSalesInvoiceDto.currencyId,
                        taxId: createSalesInvoiceDto.taxId,
                        status: createSalesInvoiceDto.status || 'draft',
                        paymentStatus: 'pending',
                        notes: createSalesInvoiceDto.notes,
                        dueDate: createSalesInvoiceDto.dueDate,
                        lines: {
                            create: createSalesInvoiceDto.lines.map(line => ({
                                productVariantId: line.productVariantId,
                                warehouseId: createSalesInvoiceDto.warehouseId,
                                quantity: line.quantity,
                                unitPrice: line.unitPrice || 0,
                                discountAmount: line.discountAmount || 0,
                                taxAmount: line.taxAmount || 0,
                                lineTotal: line.lineTotal || 0,
                            })),
                        },
                    },
                    include: {
                        branch: {
                            select: {
                                id: true,
                                name: true,
                                code: true,
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
                        tax: {
                            select: {
                                id: true,
                                name: true,
                                rate: true,
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
                        payments: {
                            select: {
                                id: true,
                                amount: true,
                                paymentMethod: true,
                                referenceNumber: true,
                                paymentDate: true,
                                processedBy: true,
                            },
                        },
                    },
                });
                for (const line of createSalesInvoiceDto.lines) {
                    await this.inventoryService.adjustStock(createSalesInvoiceDto.warehouseId, line.productVariantId, {
                        quantity: -line.quantity,
                        movementType: 'sale',
                        referenceType: 'sales_invoice',
                        referenceId: salesInvoice.id,
                        reason: `مبيعات - فاتورة رقم ${invoiceNumber}`,
                    }, userId);
                }
                await this.invalidateSalesCache();
                const salesInvoiceWithDetails = this.buildSalesInvoiceWithDetails(salesInvoice);
                this.logger.log(`تم إنشاء فاتورة المبيعات بنجاح: ${invoiceNumber}`);
                return salesInvoiceWithDetails;
            });
        }
        catch (error) {
            this.logger.error('فشل في إنشاء فاتورة المبيعات', error);
            throw error;
        }
    }
    async findAll(branchId, customerId, status, paymentStatus, limit = 50) {
        try {
            const cacheKey = `sales_invoices:${branchId || 'all'}:${customerId || 'all'}:${status || 'all'}:${paymentStatus || 'all'}`;
            const cachedInvoices = await this.cacheService.get(cacheKey);
            if (cachedInvoices) {
                return cachedInvoices;
            }
            const where = {};
            if (branchId) {
                where.branchId = branchId;
            }
            if (customerId) {
                where.customerId = customerId;
            }
            if (status) {
                where.status = status;
            }
            if (paymentStatus) {
                where.paymentStatus = paymentStatus;
            }
            const salesInvoices = await this.prisma.salesInvoice.findMany({
                where,
                include: {
                    branch: {
                        select: {
                            id: true,
                            name: true,
                            code: true,
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
                    tax: {
                        select: {
                            id: true,
                            name: true,
                            rate: true,
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
                    payments: {
                        select: {
                            id: true,
                            amount: true,
                            paymentMethod: true,
                            referenceNumber: true,
                            paymentDate: true,
                            processedBy: true,
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
                take: limit,
            });
            const salesInvoicesWithDetails = salesInvoices.map(invoice => this.buildSalesInvoiceWithDetails(invoice));
            await this.cacheService.set(cacheKey, salesInvoicesWithDetails, { ttl: 600 });
            return salesInvoicesWithDetails;
        }
        catch (error) {
            this.logger.error('فشل في الحصول على فواتير المبيعات', error);
            throw error;
        }
    }
    async findOne(id) {
        try {
            const cacheKey = `${this.salesInvoiceCacheKey}:${id}`;
            const cachedInvoice = await this.cacheService.get(cacheKey);
            if (cachedInvoice) {
                return cachedInvoice;
            }
            const salesInvoice = await this.prisma.salesInvoice.findUnique({
                where: { id },
                include: {
                    branch: {
                        select: {
                            id: true,
                            name: true,
                            code: true,
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
                    tax: {
                        select: {
                            id: true,
                            name: true,
                            rate: true,
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
                    payments: {
                        select: {
                            id: true,
                            amount: true,
                            paymentMethod: true,
                            referenceNumber: true,
                            paymentDate: true,
                            processedBy: true,
                        },
                    },
                },
            });
            if (!salesInvoice) {
                throw new common_1.NotFoundException('فاتورة المبيعات غير موجودة');
            }
            const salesInvoiceWithDetails = this.buildSalesInvoiceWithDetails(salesInvoice);
            await this.cacheService.set(cacheKey, salesInvoiceWithDetails, { ttl: 1800 });
            return salesInvoiceWithDetails;
        }
        catch (error) {
            this.logger.error(`فشل في الحصول على فاتورة المبيعات: ${id}`, error);
            throw error;
        }
    }
    async update(id, updateSalesInvoiceDto) {
        try {
            this.logger.log(`تحديث فاتورة المبيعات: ${id}`);
            const existingInvoice = await this.prisma.salesInvoice.findUnique({
                where: { id },
                include: {
                    lines: true,
                },
            });
            if (!existingInvoice) {
                throw new common_1.NotFoundException('فاتورة المبيعات غير موجودة');
            }
            if (['confirmed', 'cancelled', 'refunded'].includes(existingInvoice.status)) {
                throw new common_1.BadRequestException('لا يمكن تحديث فاتورة مؤكدة أو ملغاة');
            }
            const salesInvoice = await this.prisma.salesInvoice.update({
                where: { id },
                data: {
                    status: updateSalesInvoiceDto.status,
                    paymentStatus: updateSalesInvoiceDto.paymentStatus,
                    notes: updateSalesInvoiceDto.notes,
                    dueDate: updateSalesInvoiceDto.dueDate,
                },
                include: {
                    branch: {
                        select: {
                            id: true,
                            name: true,
                            code: true,
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
                    tax: {
                        select: {
                            id: true,
                            name: true,
                            rate: true,
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
                    payments: {
                        select: {
                            id: true,
                            amount: true,
                            paymentMethod: true,
                            referenceNumber: true,
                            paymentDate: true,
                            processedBy: true,
                        },
                    },
                },
            });
            await this.invalidateSalesCache();
            const salesInvoiceWithDetails = this.buildSalesInvoiceWithDetails(salesInvoice);
            this.logger.log(`تم تحديث فاتورة المبيعات بنجاح`);
            return salesInvoiceWithDetails;
        }
        catch (error) {
            this.logger.error(`فشل في تحديث فاتورة المبيعات: ${id}`, error);
            throw error;
        }
    }
    async addPayment(salesInvoiceId, createPaymentDto, userId) {
        try {
            this.logger.log(`إضافة دفعة للفاتورة: ${salesInvoiceId}`);
            const salesInvoice = await this.prisma.salesInvoice.findUnique({
                where: { id: salesInvoiceId },
                include: {
                    payments: true,
                    currency: true,
                },
            });
            if (!salesInvoice) {
                throw new common_1.NotFoundException('فاتورة المبيعات غير موجودة');
            }
            if (createPaymentDto.currencyId !== salesInvoice.currencyId) {
                throw new common_1.BadRequestException('عملة الدفعة يجب أن تتطابق مع عملة الفاتورة');
            }
            const currentPaymentsTotal = salesInvoice.payments.reduce((sum, payment) => sum + Number(payment.amount), 0);
            const remainingAmount = Number(salesInvoice.totalAmount) - currentPaymentsTotal;
            if (createPaymentDto.amount > remainingAmount) {
                throw new common_1.BadRequestException(`مبلغ الدفعة يتجاوز المبلغ المستحق (${remainingAmount})`);
            }
            return await this.prisma.$transaction(async (tx) => {
                await tx.payment.create({
                    data: {
                        salesInvoiceId,
                        customerId: salesInvoice.customerId,
                        currencyId: createPaymentDto.currencyId,
                        amount: createPaymentDto.amount,
                        paymentMethod: createPaymentDto.paymentMethod,
                        referenceNumber: createPaymentDto.referenceNumber,
                        notes: createPaymentDto.notes,
                        processedBy: userId,
                    },
                });
                const newPaymentsTotal = currentPaymentsTotal + Number(createPaymentDto.amount);
                let paymentStatus = 'partial';
                if (newPaymentsTotal === 0) {
                    paymentStatus = 'pending';
                }
                else if (newPaymentsTotal >= Number(salesInvoice.totalAmount)) {
                    paymentStatus = 'paid';
                }
                const updatedInvoice = await tx.salesInvoice.update({
                    where: { id: salesInvoiceId },
                    data: {
                        paymentStatus,
                    },
                    include: {
                        branch: {
                            select: {
                                id: true,
                                name: true,
                                code: true,
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
                        tax: {
                            select: {
                                id: true,
                                name: true,
                                rate: true,
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
                        payments: {
                            select: {
                                id: true,
                                amount: true,
                                paymentMethod: true,
                                referenceNumber: true,
                                paymentDate: true,
                                processedBy: true,
                            },
                        },
                    },
                });
                await this.invalidateSalesCache();
                const salesInvoiceWithDetails = this.buildSalesInvoiceWithDetails(updatedInvoice);
                this.logger.log(`تم إضافة الدفعة بنجاح للفاتورة: ${salesInvoiceId}`);
                return salesInvoiceWithDetails;
            });
        }
        catch (error) {
            this.logger.error(`فشل في إضافة الدفعة: ${salesInvoiceId}`, error);
            throw error;
        }
    }
    async cancel(id, reason, userId) {
        try {
            this.logger.log(`إلغاء فاتورة المبيعات: ${id}`);
            const salesInvoice = await this.prisma.salesInvoice.findUnique({
                where: { id },
                include: {
                    lines: {
                        include: {
                            productVariant: true,
                        },
                    },
                },
            });
            if (!salesInvoice) {
                throw new common_1.NotFoundException('فاتورة المبيعات غير موجودة');
            }
            if (['cancelled', 'refunded'].includes(salesInvoice.status)) {
                throw new common_1.BadRequestException('الفاتورة ملغاة أو مستردة بالفعل');
            }
            return await this.prisma.$transaction(async (tx) => {
                const updatedInvoice = await tx.salesInvoice.update({
                    where: { id },
                    data: {
                        status: 'cancelled',
                        notes: salesInvoice.notes
                            ? `${salesInvoice.notes}\n\nتم الإلغاء: ${reason}`
                            : `تم الإلغاء: ${reason}`,
                    },
                    include: {
                        branch: {
                            select: {
                                id: true,
                                name: true,
                                code: true,
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
                        tax: {
                            select: {
                                id: true,
                                name: true,
                                rate: true,
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
                        payments: {
                            select: {
                                id: true,
                                amount: true,
                                paymentMethod: true,
                                referenceNumber: true,
                                paymentDate: true,
                                processedBy: true,
                            },
                        },
                    },
                });
                for (const line of salesInvoice.lines) {
                    await this.inventoryService.adjustStock(salesInvoice.warehouseId, line.productVariantId, {
                        quantity: Number(line.quantity),
                        movementType: 'adjustment',
                        referenceType: 'sales_cancelled',
                        referenceId: salesInvoice.id,
                        reason: `إلغاء مبيعات - فاتورة رقم ${salesInvoice.invoiceNumber}`,
                    }, userId);
                }
                await this.invalidateSalesCache();
                const salesInvoiceWithDetails = this.buildSalesInvoiceWithDetails(updatedInvoice);
                this.logger.log(`تم إلغاء فاتورة المبيعات بنجاح: ${id}`);
                return salesInvoiceWithDetails;
            });
        }
        catch (error) {
            this.logger.error(`فشل في إلغاء فاتورة المبيعات: ${id}`, error);
            throw error;
        }
    }
    async getSalesStats(branchId, startDate, endDate) {
        try {
            const where = {};
            if (branchId) {
                where.branchId = branchId;
            }
            if (startDate || endDate) {
                where.createdAt = {};
                if (startDate)
                    where.createdAt.gte = startDate;
                if (endDate)
                    where.createdAt.lte = endDate;
            }
            const [totalInvoices, confirmedInvoices, totalRevenue, totalTax, totalDiscount, pendingPayments, paidInvoices,] = await Promise.all([
                this.prisma.salesInvoice.count({ where }),
                this.prisma.salesInvoice.count({
                    where: { ...where, status: 'confirmed' },
                }),
                this.prisma.salesInvoice.aggregate({
                    where: { ...where, status: 'confirmed' },
                    _sum: { totalAmount: true },
                }),
                this.prisma.salesInvoice.aggregate({
                    where: { ...where, status: 'confirmed' },
                    _sum: { taxAmount: true },
                }),
                this.prisma.salesInvoice.aggregate({
                    where: { ...where, status: 'confirmed' },
                    _sum: { discountAmount: true },
                }),
                this.prisma.salesInvoice.count({
                    where: { ...where, paymentStatus: 'pending' },
                }),
                this.prisma.salesInvoice.count({
                    where: { ...where, paymentStatus: 'paid' },
                }),
            ]);
            return {
                totalInvoices,
                confirmedInvoices,
                cancelledInvoices: totalInvoices - confirmedInvoices,
                totalRevenue: Number(totalRevenue._sum.totalAmount || 0),
                totalTax: Number(totalTax._sum.taxAmount || 0),
                totalDiscount: Number(totalDiscount._sum.discountAmount || 0),
                pendingPayments,
                paidInvoices,
                averageInvoiceValue: confirmedInvoices > 0
                    ? Number(totalRevenue._sum.totalAmount || 0) / confirmedInvoices
                    : 0,
            };
        }
        catch (error) {
            this.logger.error('فشل في الحصول على إحصائيات المبيعات', error);
            throw error;
        }
    }
    buildSalesInvoiceWithDetails(salesInvoice) {
        return {
            id: salesInvoice.id,
            invoiceNumber: salesInvoice.invoiceNumber,
            branchId: salesInvoice.branchId,
            customerId: salesInvoice.customerId || undefined,
            cashierId: salesInvoice.cashierId,
            warehouseId: salesInvoice.warehouseId,
            subtotal: Number(salesInvoice.subtotal),
            taxAmount: Number(salesInvoice.taxAmount),
            discountAmount: Number(salesInvoice.discountAmount),
            totalAmount: Number(salesInvoice.totalAmount),
            currencyId: salesInvoice.currencyId,
            taxId: salesInvoice.taxId || undefined,
            status: salesInvoice.status,
            paymentStatus: salesInvoice.paymentStatus,
            notes: salesInvoice.notes || undefined,
            dueDate: salesInvoice.dueDate || undefined,
            branch: salesInvoice.branch,
            customer: salesInvoice.customer || undefined,
            cashier: salesInvoice.cashier,
            warehouse: salesInvoice.warehouse,
            currency: salesInvoice.currency,
            tax: salesInvoice.tax || undefined,
            lines: salesInvoice.lines.map((line) => ({
                id: line.id,
                productVariantId: line.productVariantId,
                warehouseId: line.warehouseId,
                quantity: Number(line.quantity),
                unitPrice: Number(line.unitPrice),
                discountAmount: Number(line.discountAmount),
                taxAmount: Number(line.taxAmount),
                lineTotal: Number(line.lineTotal),
                productVariant: line.productVariant,
            })),
            payments: salesInvoice.payments.map((payment) => ({
                id: payment.id,
                amount: Number(payment.amount),
                paymentMethod: payment.paymentMethod,
                referenceNumber: payment.referenceNumber || undefined,
                paymentDate: payment.paymentDate,
                processedBy: payment.processedBy || undefined,
            })),
            createdAt: salesInvoice.createdAt,
            updatedAt: salesInvoice.updatedAt,
        };
    }
    async invalidateSalesCache() {
        await this.cacheService.delete(this.salesInvoicesCacheKey);
        const salesKeys = await this.cacheService.getKeys('sales_invoices:*');
        for (const key of salesKeys) {
            await this.cacheService.delete(key);
        }
        const invoiceKeys = await this.cacheService.getKeys(`${this.salesInvoiceCacheKey}:*`);
        for (const key of invoiceKeys) {
            await this.cacheService.delete(key);
        }
    }
};
exports.SalesService = SalesService;
exports.SalesService = SalesService = SalesService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        cache_service_1.CacheService,
        inventory_service_1.InventoryService])
], SalesService);
//# sourceMappingURL=sales.service.js.map