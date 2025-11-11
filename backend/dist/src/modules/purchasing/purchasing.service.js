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
var PurchasingService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PurchasingService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../shared/database/prisma.service");
const cache_service_1 = require("../../shared/cache/cache.service");
const inventory_service_1 = require("../inventory/inventory.service");
let PurchasingService = PurchasingService_1 = class PurchasingService {
    prisma;
    cacheService;
    inventoryService;
    logger = new common_1.Logger(PurchasingService_1.name);
    suppliersCacheKey = 'suppliers';
    supplierCacheKey = 'supplier';
    purchaseOrdersCacheKey = 'purchaseOrders';
    purchaseOrderCacheKey = 'purchaseOrder';
    purchaseInvoicesCacheKey = 'purchaseInvoices';
    purchaseInvoiceCacheKey = 'purchaseInvoice';
    constructor(prisma, cacheService, inventoryService) {
        this.prisma = prisma;
        this.cacheService = cacheService;
        this.inventoryService = inventoryService;
    }
    async createSupplier(createSupplierDto) {
        try {
            this.logger.log(`إنشاء مورد جديد: ${createSupplierDto.name}`);
            if (createSupplierDto.email) {
                const existingSupplier = await this.prisma.supplier.findFirst({
                    where: { email: createSupplierDto.email },
                });
                if (existingSupplier) {
                    throw new common_1.ConflictException('البريد الإلكتروني موجود بالفعل');
                }
            }
            const supplier = await this.prisma.supplier.create({
                data: {
                    name: createSupplierDto.name,
                    contactName: createSupplierDto.contactName,
                    phone: createSupplierDto.phone,
                    email: createSupplierDto.email,
                    address: createSupplierDto.address,
                    taxNumber: createSupplierDto.taxNumber,
                    paymentTerms: createSupplierDto.paymentTerms,
                    isActive: createSupplierDto.isActive ?? true,
                },
            });
            await this.invalidateSuppliersCache();
            const supplierWithDetails = await this.buildSupplierWithDetails(supplier);
            this.logger.log(`تم إنشاء المورد بنجاح: ${supplier.name}`);
            return supplierWithDetails;
        }
        catch (error) {
            this.logger.error('فشل في إنشاء المورد', error);
            throw error;
        }
    }
    async findAllSuppliers(search, isActive, limit = 50) {
        try {
            const cacheKey = `suppliers:${search || 'all'}:${isActive ?? 'all'}`;
            const cachedSuppliers = await this.cacheService.get(cacheKey);
            if (cachedSuppliers) {
                return cachedSuppliers;
            }
            const where = {};
            if (search) {
                where.OR = [
                    { name: { contains: search, mode: 'insensitive' } },
                    { contactName: { contains: search, mode: 'insensitive' } },
                    { email: { contains: search, mode: 'insensitive' } },
                    { phone: { contains: search } },
                ];
            }
            if (isActive !== undefined) {
                where.isActive = isActive;
            }
            const suppliers = await this.prisma.supplier.findMany({
                where,
                orderBy: { name: 'asc' },
                take: limit,
            });
            const suppliersWithDetails = await Promise.all(suppliers.map(supplier => this.buildSupplierWithDetails(supplier)));
            await this.cacheService.set(cacheKey, suppliersWithDetails, { ttl: 600 });
            return suppliersWithDetails;
        }
        catch (error) {
            this.logger.error('فشل في الحصول على الموردين', error);
            throw error;
        }
    }
    async findOneSupplier(id) {
        try {
            const cacheKey = `${this.supplierCacheKey}:${id}`;
            const cachedSupplier = await this.cacheService.get(cacheKey);
            if (cachedSupplier) {
                return cachedSupplier;
            }
            const supplier = await this.prisma.supplier.findUnique({
                where: { id },
            });
            if (!supplier) {
                throw new common_1.NotFoundException('المورد غير موجود');
            }
            const supplierWithDetails = await this.buildSupplierWithDetails(supplier);
            await this.cacheService.set(cacheKey, supplierWithDetails, { ttl: 1800 });
            return supplierWithDetails;
        }
        catch (error) {
            this.logger.error(`فشل في الحصول على المورد: ${id}`, error);
            throw error;
        }
    }
    async updateSupplier(id, updateSupplierDto) {
        try {
            this.logger.log(`تحديث المورد: ${id}`);
            const existingSupplier = await this.prisma.supplier.findUnique({
                where: { id },
            });
            if (!existingSupplier) {
                throw new common_1.NotFoundException('المورد غير موجود');
            }
            if (updateSupplierDto.email && updateSupplierDto.email !== existingSupplier.email) {
                const existingEmail = await this.prisma.supplier.findFirst({
                    where: { email: updateSupplierDto.email },
                });
                if (existingEmail) {
                    throw new common_1.ConflictException('البريد الإلكتروني موجود بالفعل');
                }
            }
            const supplier = await this.prisma.supplier.update({
                where: { id },
                data: {
                    name: updateSupplierDto.name,
                    contactName: updateSupplierDto.contactName,
                    phone: updateSupplierDto.phone,
                    email: updateSupplierDto.email,
                    address: updateSupplierDto.address,
                    taxNumber: updateSupplierDto.taxNumber,
                    paymentTerms: updateSupplierDto.paymentTerms,
                    isActive: updateSupplierDto.isActive,
                },
            });
            await this.invalidateSuppliersCache();
            const supplierWithDetails = await this.buildSupplierWithDetails(supplier);
            this.logger.log(`تم تحديث المورد بنجاح`);
            return supplierWithDetails;
        }
        catch (error) {
            this.logger.error(`فشل في تحديث المورد: ${id}`, error);
            throw error;
        }
    }
    async removeSupplier(id) {
        try {
            this.logger.log(`حذف المورد: ${id}`);
            const supplier = await this.prisma.supplier.findUnique({
                where: { id },
                include: {
                    purchaseOrders: true,
                    purchaseInvoices: true,
                },
            });
            if (!supplier) {
                throw new common_1.NotFoundException('المورد غير موجود');
            }
            if (supplier.purchaseOrders.length > 0 || supplier.purchaseInvoices.length > 0) {
                throw new common_1.BadRequestException('لا يمكن حذف مورد مرتبط بأوامر أو فواتير شراء');
            }
            await this.prisma.supplier.delete({
                where: { id },
            });
            await this.invalidateSuppliersCache();
            this.logger.log(`تم حذف المورد بنجاح`);
        }
        catch (error) {
            this.logger.error(`فشل في حذف المورد: ${id}`, error);
            throw error;
        }
    }
    async createPurchaseOrder(createPurchaseOrderDto, userId) {
        try {
            this.logger.log(`إنشاء أمر شراء جديد`);
            const supplier = await this.prisma.supplier.findUnique({
                where: { id: createPurchaseOrderDto.supplierId },
            });
            if (!supplier) {
                throw new common_1.NotFoundException('المورد غير موجود');
            }
            if (!supplier.isActive) {
                throw new common_1.BadRequestException('المورد غير نشط');
            }
            const warehouse = await this.prisma.warehouse.findUnique({
                where: { id: createPurchaseOrderDto.warehouseId },
            });
            if (!warehouse) {
                throw new common_1.NotFoundException('المخزن غير موجود');
            }
            const productIds = createPurchaseOrderDto.lines.map(line => line.productId);
            const products = await this.prisma.product.findMany({
                where: { id: { in: productIds } },
            });
            if (products.length !== productIds.length) {
                throw new common_1.BadRequestException('بعض المنتجات المطلوبة غير موجودة');
            }
            return await this.prisma.$transaction(async (tx) => {
                const lastOrder = await tx.purchaseOrder.findFirst({
                    where: { supplierId: createPurchaseOrderDto.supplierId },
                    orderBy: { createdAt: 'desc' },
                });
                const sequence = lastOrder ? parseInt(lastOrder.orderNumber.split('-')[2] || '0') + 1 : 1;
                const orderNumber = `${supplier.name.substring(0, 3).toUpperCase()}-PO-${sequence.toString().padStart(4, '0')}`;
                const purchaseOrder = await tx.purchaseOrder.create({
                    data: {
                        orderNumber,
                        supplierId: createPurchaseOrderDto.supplierId,
                        warehouseId: createPurchaseOrderDto.warehouseId,
                        requestedBy: userId,
                        expectedDate: createPurchaseOrderDto.expectedDate ? new Date(createPurchaseOrderDto.expectedDate) : undefined,
                        notes: createPurchaseOrderDto.notes,
                        status: 'draft',
                        lines: {
                            create: createPurchaseOrderDto.lines.map(line => ({
                                productId: line.productId,
                                quantity: line.quantity,
                                unitCost: line.unitCost,
                            })),
                        },
                    },
                    include: {
                        supplier: {
                            select: {
                                id: true,
                                name: true,
                                contactName: true,
                                phone: true,
                                email: true,
                            },
                        },
                        warehouse: {
                            select: {
                                id: true,
                                name: true,
                                code: true,
                            },
                        },
                        requester: {
                            select: {
                                id: true,
                                username: true,
                            },
                        },
                        lines: {
                            include: {
                                product: {
                                    select: {
                                        id: true,
                                        name: true,
                                        sku: true,
                                    },
                                },
                            },
                        },
                        purchaseInvoices: {
                            select: { id: true },
                        },
                    },
                });
                await this.invalidatePurchaseOrdersCache();
                const purchaseOrderWithDetails = this.buildPurchaseOrderWithDetails(purchaseOrder);
                this.logger.log(`تم إنشاء أمر الشراء بنجاح: ${orderNumber}`);
                return purchaseOrderWithDetails;
            });
        }
        catch (error) {
            this.logger.error('فشل في إنشاء أمر الشراء', error);
            throw error;
        }
    }
    async findAllPurchaseOrders(supplierId, status, limit = 50) {
        try {
            const cacheKey = `purchaseOrders:${supplierId || 'all'}:${status || 'all'}`;
            const cachedOrders = await this.cacheService.get(cacheKey);
            if (cachedOrders) {
                return cachedOrders;
            }
            const where = {};
            if (supplierId) {
                where.supplierId = supplierId;
            }
            if (status) {
                where.status = status;
            }
            const purchaseOrders = await this.prisma.purchaseOrder.findMany({
                where,
                include: {
                    supplier: {
                        select: {
                            id: true,
                            name: true,
                            contactName: true,
                            phone: true,
                            email: true,
                        },
                    },
                    warehouse: {
                        select: {
                            id: true,
                            name: true,
                            code: true,
                        },
                    },
                    requester: {
                        select: {
                            id: true,
                            username: true,
                        },
                    },
                    lines: {
                        include: {
                            product: {
                                select: {
                                    id: true,
                                    name: true,
                                    sku: true,
                                },
                            },
                        },
                    },
                    purchaseInvoices: {
                        select: { id: true },
                    },
                },
                orderBy: { createdAt: 'desc' },
                take: limit,
            });
            const ordersWithDetails = purchaseOrders.map(order => this.buildPurchaseOrderWithDetails(order));
            await this.cacheService.set(cacheKey, ordersWithDetails, { ttl: 600 });
            return ordersWithDetails;
        }
        catch (error) {
            this.logger.error('فشل في الحصول على أوامر الشراء', error);
            throw error;
        }
    }
    async updatePurchaseOrderStatus(id, status, userId) {
        try {
            this.logger.log(`تحديث حالة أمر الشراء: ${id} إلى ${status}`);
            const existingOrder = await this.prisma.purchaseOrder.findUnique({
                where: { id },
            });
            if (!existingOrder) {
                throw new common_1.NotFoundException('أمر الشراء غير موجود');
            }
            const validStatuses = ['draft', 'approved', 'ordered', 'received', 'cancelled'];
            if (!validStatuses.includes(status)) {
                throw new common_1.BadRequestException('حالة غير صالحة');
            }
            const purchaseOrder = await this.prisma.purchaseOrder.update({
                where: { id },
                data: { status },
                include: {
                    supplier: {
                        select: {
                            id: true,
                            name: true,
                            contactName: true,
                            phone: true,
                            email: true,
                        },
                    },
                    warehouse: {
                        select: {
                            id: true,
                            name: true,
                            code: true,
                        },
                    },
                    requester: {
                        select: {
                            id: true,
                            username: true,
                        },
                    },
                    lines: {
                        include: {
                            product: {
                                select: {
                                    id: true,
                                    name: true,
                                    sku: true,
                                },
                            },
                        },
                    },
                    purchaseInvoices: {
                        select: { id: true },
                    },
                },
            });
            await this.invalidatePurchaseOrdersCache();
            const purchaseOrderWithDetails = this.buildPurchaseOrderWithDetails(purchaseOrder);
            this.logger.log(`تم تحديث حالة أمر الشراء بنجاح`);
            return purchaseOrderWithDetails;
        }
        catch (error) {
            this.logger.error(`فشل في تحديث حالة أمر الشراء: ${id}`, error);
            throw error;
        }
    }
    async createPurchaseInvoice(createPurchaseInvoiceDto, userId) {
        try {
            this.logger.log(`إنشاء فاتورة شراء جديدة: ${createPurchaseInvoiceDto.invoiceNumber || 'بدون رقم'}`);
            const supplier = await this.prisma.supplier.findUnique({
                where: { id: createPurchaseInvoiceDto.supplierId },
            });
            if (!supplier) {
                throw new common_1.NotFoundException('المورد غير موجود');
            }
            const warehouse = await this.prisma.warehouse.findUnique({
                where: { id: createPurchaseInvoiceDto.warehouseId },
            });
            if (!warehouse) {
                throw new common_1.NotFoundException('المخزن غير موجود');
            }
            if (createPurchaseInvoiceDto.invoiceNumber) {
                const existingInvoice = await this.prisma.purchaseInvoice.findUnique({
                    where: { invoiceNumber: createPurchaseInvoiceDto.invoiceNumber },
                });
                if (existingInvoice) {
                    throw new common_1.ConflictException('رقم الفاتورة موجود بالفعل');
                }
            }
            if (createPurchaseInvoiceDto.purchaseOrderId) {
                const purchaseOrder = await this.prisma.purchaseOrder.findUnique({
                    where: { id: createPurchaseInvoiceDto.purchaseOrderId },
                    include: { lines: true },
                });
                if (!purchaseOrder) {
                    throw new common_1.NotFoundException('أمر الشراء غير موجود');
                }
                if (purchaseOrder.supplierId !== createPurchaseInvoiceDto.supplierId) {
                    throw new common_1.BadRequestException('أمر الشراء يجب أن يكون من نفس المورد');
                }
            }
            return await this.prisma.$transaction(async (tx) => {
                let invoiceNumber = createPurchaseInvoiceDto.invoiceNumber;
                if (!invoiceNumber) {
                    const lastInvoice = await tx.purchaseInvoice.findFirst({
                        orderBy: { createdAt: 'desc' },
                    });
                    const sequence = lastInvoice
                        ? parseInt(lastInvoice.invoiceNumber.split('-')[2] || '0') + 1
                        : 1;
                    invoiceNumber = `PI-${new Date().getFullYear()}-${sequence.toString().padStart(6, '0')}`;
                }
                let subtotal = 0;
                let taxAmount = 0;
                let discountAmount = 0;
                for (const line of createPurchaseInvoiceDto.lines) {
                    const lineSubtotal = line.unitCost * line.quantity;
                    const lineDiscount = line.discountAmount || 0;
                    const lineTax = line.taxAmount || 0;
                    subtotal += lineSubtotal;
                    discountAmount += lineDiscount;
                    taxAmount += lineTax;
                    line.lineTotal = lineSubtotal - lineDiscount + lineTax;
                }
                const totalAmount = subtotal - discountAmount + taxAmount;
                const purchaseInvoice = await tx.purchaseInvoice.create({
                    data: {
                        invoiceNumber,
                        supplierId: createPurchaseInvoiceDto.supplierId,
                        warehouseId: createPurchaseInvoiceDto.warehouseId,
                        receivedBy: userId,
                        purchaseOrderId: createPurchaseInvoiceDto.purchaseOrderId,
                        subtotal,
                        taxAmount,
                        discountAmount,
                        totalAmount,
                        currencyId: createPurchaseInvoiceDto.currencyId,
                        invoiceDate: new Date(createPurchaseInvoiceDto.invoiceDate),
                        dueDate: createPurchaseInvoiceDto.dueDate ? new Date(createPurchaseInvoiceDto.dueDate) : undefined,
                        status: createPurchaseInvoiceDto.status || 'draft',
                        paymentStatus: 'pending',
                        notes: createPurchaseInvoiceDto.notes,
                        lines: {
                            create: createPurchaseInvoiceDto.lines.map(line => ({
                                productVariant: {
                                    connect: { id: line.productVariantId }
                                },
                                warehouse: {
                                    connect: { id: createPurchaseInvoiceDto.warehouseId }
                                },
                                quantity: line.quantity,
                                unitCost: line.unitCost,
                                discountAmount: line.discountAmount || 0,
                                taxAmount: line.taxAmount || 0,
                                lineTotal: line.lineTotal || 0,
                            })),
                        },
                    },
                    include: {
                        supplier: {
                            select: {
                                id: true,
                                name: true,
                                contactName: true,
                                phone: true,
                                email: true,
                            },
                        },
                        warehouse: {
                            select: {
                                id: true,
                                name: true,
                                code: true,
                            },
                        },
                        receiver: {
                            select: {
                                id: true,
                                username: true,
                            },
                        },
                        purchaseOrder: {
                            select: {
                                id: true,
                                orderNumber: true,
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
                        payments: {
                            select: {
                                id: true,
                                amount: true,
                                paymentMethod: true,
                                referenceNumber: true,
                                paymentDate: true,
                            },
                        },
                    },
                });
                for (const line of createPurchaseInvoiceDto.lines) {
                    await this.inventoryService.adjustStock(createPurchaseInvoiceDto.warehouseId, line.productVariantId, {
                        quantity: line.quantity,
                        movementType: 'purchase',
                        referenceType: 'purchase_invoice',
                        referenceId: purchaseInvoice.id,
                        reason: `فاتورة شراء - ${invoiceNumber}`,
                    }, userId);
                }
                if (createPurchaseInvoiceDto.purchaseOrderId) {
                    await tx.purchaseOrder.update({
                        where: { id: createPurchaseInvoiceDto.purchaseOrderId },
                        data: { status: 'received' },
                    });
                }
                await this.invalidatePurchaseInvoicesCache();
                const purchaseInvoiceWithDetails = this.buildPurchaseInvoiceWithDetails(purchaseInvoice);
                this.logger.log(`تم إنشاء فاتورة الشراء بنجاح: ${invoiceNumber}`);
                return purchaseInvoiceWithDetails;
            });
        }
        catch (error) {
            this.logger.error('فشل في إنشاء فاتورة الشراء', error);
            throw error;
        }
    }
    async createPurchasePayment(invoiceId, createPurchasePaymentDto, userId) {
        try {
            this.logger.log(`إنشاء دفعة لفاتورة الشراء: ${invoiceId}`);
            const purchaseInvoice = await this.prisma.purchaseInvoice.findUnique({
                where: { id: invoiceId },
                include: { payments: true },
            });
            if (!purchaseInvoice) {
                throw new common_1.NotFoundException('فاتورة الشراء غير موجودة');
            }
            const currentPaymentsTotal = purchaseInvoice.payments.reduce((sum, payment) => sum + Number(payment.amount), 0);
            const remainingAmount = Number(purchaseInvoice.totalAmount) - currentPaymentsTotal;
            if (createPurchasePaymentDto.amount > remainingAmount) {
                throw new common_1.BadRequestException(`مبلغ الدفعة يتجاوز المبلغ المتبقي (${remainingAmount})`);
            }
            return await this.prisma.$transaction(async (tx) => {
                const purchasePayment = await tx.purchasePayment.create({
                    data: {
                        purchaseInvoiceId: invoiceId,
                        supplierId: purchaseInvoice.supplierId,
                        currencyId: purchaseInvoice.currencyId,
                        amount: createPurchasePaymentDto.amount,
                        paymentMethod: createPurchasePaymentDto.paymentMethod,
                        referenceNumber: createPurchasePaymentDto.referenceNumber,
                        notes: createPurchasePaymentDto.notes,
                        processedBy: userId,
                    },
                });
                const newPaymentsTotal = currentPaymentsTotal + Number(createPurchasePaymentDto.amount);
                let paymentStatus = 'partial';
                if (newPaymentsTotal >= Number(purchaseInvoice.totalAmount)) {
                    paymentStatus = 'paid';
                }
                await tx.purchaseInvoice.update({
                    where: { id: invoiceId },
                    data: { paymentStatus },
                });
                await this.invalidatePurchaseInvoicesCache();
                this.logger.log(`تم إنشاء دفعة فاتورة الشراء بنجاح`);
                return purchasePayment;
            });
        }
        catch (error) {
            this.logger.error(`فشل في إنشاء دفعة فاتورة الشراء: ${invoiceId}`, error);
            throw error;
        }
    }
    async getPurchasingStats(startDate, endDate) {
        try {
            const where = {};
            if (startDate || endDate) {
                where.createdAt = {};
                if (startDate)
                    where.createdAt.gte = startDate;
                if (endDate)
                    where.createdAt.lte = endDate;
            }
            const [totalSuppliers, activeSuppliers, totalPurchaseOrders, approvedOrders, totalPurchaseInvoices, paidInvoices, totalPurchased, totalPaid,] = await Promise.all([
                this.prisma.supplier.count(),
                this.prisma.supplier.count({ where: { isActive: true } }),
                this.prisma.purchaseOrder.count({ where }),
                this.prisma.purchaseOrder.count({
                    where: { ...where, status: 'approved' },
                }),
                this.prisma.purchaseInvoice.count({ where }),
                this.prisma.purchaseInvoice.count({
                    where: { ...where, paymentStatus: 'paid' },
                }),
                this.prisma.purchaseInvoice.aggregate({
                    where,
                    _sum: { totalAmount: true },
                }),
                this.prisma.purchasePayment.aggregate({
                    where,
                    _sum: { amount: true },
                }),
            ]);
            return {
                suppliers: {
                    total: totalSuppliers,
                    active: activeSuppliers,
                    inactive: totalSuppliers - activeSuppliers,
                },
                purchaseOrders: {
                    total: totalPurchaseOrders,
                    approved: approvedOrders,
                    pending: totalPurchaseOrders - approvedOrders,
                },
                purchaseInvoices: {
                    total: totalPurchaseInvoices,
                    paid: paidInvoices,
                    unpaid: totalPurchaseInvoices - paidInvoices,
                },
                financial: {
                    totalPurchased: Number(totalPurchased._sum.totalAmount || 0),
                    totalPaid: Number(totalPaid._sum.amount || 0),
                    outstanding: Number(totalPurchased._sum.totalAmount || 0) - Number(totalPaid._sum.amount || 0),
                },
            };
        }
        catch (error) {
            this.logger.error('فشل في الحصول على إحصائيات المشتريات', error);
            throw error;
        }
    }
    async buildSupplierWithDetails(supplier) {
        const [purchaseOrdersCount, purchaseInvoicesCount, totalPurchased] = await Promise.all([
            this.prisma.purchaseOrder.count({ where: { supplierId: supplier.id } }),
            this.prisma.purchaseInvoice.count({ where: { supplierId: supplier.id } }),
            this.prisma.purchaseInvoice.aggregate({
                where: { supplierId: supplier.id },
                _sum: { totalAmount: true },
            }),
        ]);
        return {
            id: supplier.id,
            name: supplier.name,
            contactName: supplier.contactName || undefined,
            phone: supplier.phone || undefined,
            email: supplier.email || undefined,
            address: supplier.address || undefined,
            taxNumber: supplier.taxNumber || undefined,
            paymentTerms: supplier.paymentTerms || undefined,
            isActive: supplier.isActive,
            purchaseOrdersCount,
            purchaseInvoicesCount,
            totalPurchased: Number(totalPurchased._sum.totalAmount || 0),
            createdAt: supplier.createdAt,
            updatedAt: supplier.updatedAt,
        };
    }
    buildPurchaseOrderWithDetails(purchaseOrder) {
        return {
            id: purchaseOrder.id,
            orderNumber: purchaseOrder.orderNumber,
            supplierId: purchaseOrder.supplierId,
            warehouseId: purchaseOrder.warehouseId,
            requestedBy: purchaseOrder.requestedBy,
            expectedDate: purchaseOrder.expectedDate || undefined,
            notes: purchaseOrder.notes || undefined,
            status: purchaseOrder.status,
            supplier: purchaseOrder.supplier,
            warehouse: purchaseOrder.warehouse,
            requester: purchaseOrder.requester,
            lines: purchaseOrder.lines.map((line) => ({
                id: line.id,
                productId: line.productId,
                quantity: Number(line.quantity),
                unitCost: Number(line.unitCost),
                receivedQuantity: Number(line.receivedQuantity),
                product: line.product,
            })),
            purchaseInvoicesCount: purchaseOrder.purchaseInvoices.length,
            createdAt: purchaseOrder.createdAt,
            updatedAt: purchaseOrder.updatedAt,
        };
    }
    buildPurchaseInvoiceWithDetails(purchaseInvoice) {
        return {
            id: purchaseInvoice.id,
            invoiceNumber: purchaseInvoice.invoiceNumber,
            supplierId: purchaseInvoice.supplierId,
            warehouseId: purchaseInvoice.warehouseId,
            receivedBy: purchaseInvoice.receivedBy,
            purchaseOrderId: purchaseInvoice.purchaseOrderId || undefined,
            subtotal: Number(purchaseInvoice.subtotal),
            taxAmount: Number(purchaseInvoice.taxAmount),
            discountAmount: Number(purchaseInvoice.discountAmount),
            totalAmount: Number(purchaseInvoice.totalAmount),
            currencyId: purchaseInvoice.currencyId,
            invoiceDate: purchaseInvoice.invoiceDate,
            dueDate: purchaseInvoice.dueDate || undefined,
            status: purchaseInvoice.status,
            paymentStatus: purchaseInvoice.paymentStatus,
            notes: purchaseInvoice.notes || undefined,
            supplier: purchaseInvoice.supplier,
            warehouse: purchaseInvoice.warehouse,
            receiver: purchaseInvoice.receiver,
            purchaseOrder: purchaseInvoice.purchaseOrder || undefined,
            currency: purchaseInvoice.currency,
            lines: purchaseInvoice.lines.map((line) => ({
                id: line.id,
                productVariantId: line.productVariantId,
                warehouseId: line.warehouseId,
                quantity: Number(line.quantity),
                unitCost: Number(line.unitCost),
                discountAmount: Number(line.discountAmount),
                taxAmount: Number(line.taxAmount),
                lineTotal: Number(line.lineTotal),
                productVariant: line.productVariant,
            })),
            payments: purchaseInvoice.payments.map((payment) => ({
                id: payment.id,
                amount: Number(payment.amount),
                paymentMethod: payment.paymentMethod,
                referenceNumber: payment.referenceNumber || undefined,
                paymentDate: payment.paymentDate,
            })),
            createdAt: purchaseInvoice.createdAt,
            updatedAt: purchaseInvoice.updatedAt,
        };
    }
    async invalidateSuppliersCache() {
        await this.cacheService.delete(this.suppliersCacheKey);
        const supplierKeys = await this.cacheService.getKeys(`${this.supplierCacheKey}:*`);
        for (const key of supplierKeys) {
            await this.cacheService.delete(key);
        }
    }
    async invalidatePurchaseOrdersCache() {
        await this.cacheService.delete(this.purchaseOrdersCacheKey);
        const orderKeys = await this.cacheService.getKeys(`${this.purchaseOrderCacheKey}:*`);
        for (const key of orderKeys) {
            await this.cacheService.delete(key);
        }
    }
    async invalidatePurchaseInvoicesCache() {
        await this.cacheService.delete(this.purchaseInvoicesCacheKey);
        const invoiceKeys = await this.cacheService.getKeys(`${this.purchaseInvoiceCacheKey}:*`);
        for (const key of invoiceKeys) {
            await this.cacheService.delete(key);
        }
    }
};
exports.PurchasingService = PurchasingService;
exports.PurchasingService = PurchasingService = PurchasingService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        cache_service_1.CacheService,
        inventory_service_1.InventoryService])
], PurchasingService);
//# sourceMappingURL=purchasing.service.js.map