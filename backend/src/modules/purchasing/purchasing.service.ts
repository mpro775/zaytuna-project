import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../shared/database/prisma.service';
import { CacheService } from '../../shared/cache/cache.service';
import { InventoryService } from '../inventory/inventory.service';
import { CreatePurchaseOrderDto } from './dto/create-purchase-order.dto';
import { UpdatePurchaseOrderDto } from './dto/update-purchase-order.dto';
import { CreatePurchaseInvoiceDto } from './dto/create-purchase-invoice.dto';
import { UpdatePurchaseInvoiceDto } from './dto/update-purchase-invoice.dto';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';
import { CreatePurchasePaymentDto } from './dto/create-purchase-payment.dto';

export interface SupplierWithDetails {
  id: string;
  name: string;
  contactName?: string;
  phone?: string;
  email?: string;
  address?: string;
  taxNumber?: string;
  paymentTerms?: string;
  isActive: boolean;
  purchaseOrdersCount: number;
  purchaseInvoicesCount: number;
  totalPurchased: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface PurchaseOrderWithDetails {
  id: string;
  orderNumber: string;
  supplierId: string;
  warehouseId: string;
  requestedBy: string;
  expectedDate?: Date;
  notes?: string;
  status: string;
  supplier: {
    id: string;
    name: string;
    contactName?: string;
    phone?: string;
    email?: string;
  };
  warehouse: {
    id: string;
    name: string;
    code: string;
  };
  requester: {
    id: string;
    username: string;
  };
  lines: Array<{
    id: string;
    productId: string;
    quantity: number;
    unitCost: number;
    receivedQuantity: number;
    product: {
      id: string;
      name: string;
      sku?: string;
    };
  }>;
  purchaseInvoicesCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface PurchaseInvoiceWithDetails {
  id: string;
  invoiceNumber: string;
  supplierId: string;
  warehouseId: string;
  receivedBy: string;
  purchaseOrderId?: string;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  currencyId: string;
  invoiceDate: Date;
  dueDate?: Date;
  status: string;
  paymentStatus: string;
  notes?: string;
  supplier: {
    id: string;
    name: string;
    contactName?: string;
    phone?: string;
    email?: string;
  };
  warehouse: {
    id: string;
    name: string;
    code: string;
  };
  receiver: {
    id: string;
    username: string;
  };
  purchaseOrder?: {
    id: string;
    orderNumber: string;
  };
  currency: {
    id: string;
    code: string;
    name: string;
    symbol?: string;
  };
  lines: Array<{
    id: string;
    productVariantId: string;
    warehouseId: string;
    quantity: number;
    unitCost: number;
    discountAmount: number;
    taxAmount: number;
    lineTotal: number;
    productVariant: {
      id: string;
      name: string;
      sku?: string;
      barcode?: string;
      product: {
        id: string;
        name: string;
      };
    };
  }>;
  payments: Array<{
    id: string;
    amount: number;
    paymentMethod: string;
    referenceNumber?: string;
    paymentDate: Date;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class PurchasingService {
  private readonly logger = new Logger(PurchasingService.name);
  private readonly suppliersCacheKey = 'suppliers';
  private readonly supplierCacheKey = 'supplier';
  private readonly purchaseOrdersCacheKey = 'purchaseOrders';
  private readonly purchaseOrderCacheKey = 'purchaseOrder';
  private readonly purchaseInvoicesCacheKey = 'purchaseInvoices';
  private readonly purchaseInvoiceCacheKey = 'purchaseInvoice';

  constructor(
    private readonly prisma: PrismaService,
    private readonly cacheService: CacheService,
    private readonly inventoryService: InventoryService,
  ) {}

  // ========== SUPPLIERS MANAGEMENT ==========

  /**
   * إنشاء مورد جديد
   */
  async createSupplier(createSupplierDto: CreateSupplierDto): Promise<SupplierWithDetails> {
    try {
      this.logger.log(`إنشاء مورد جديد: ${createSupplierDto.name}`);

      // التحقق من عدم تكرار البريد الإلكتروني
      if (createSupplierDto.email) {
        const existingSupplier = await this.prisma.supplier.findFirst({
          where: { email: createSupplierDto.email },
        });

        if (existingSupplier) {
          throw new ConflictException('البريد الإلكتروني موجود بالفعل');
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
    } catch (error) {
      this.logger.error('فشل في إنشاء المورد', error);
      throw error;
    }
  }

  /**
   * الحصول على الموردين
   */
  async findAllSuppliers(
    search?: string,
    isActive?: boolean,
    limit: number = 50,
  ): Promise<SupplierWithDetails[]> {
    try {
      const cacheKey = `suppliers:${search || 'all'}:${isActive ?? 'all'}`;

      const cachedSuppliers = await this.cacheService.get<SupplierWithDetails[]>(cacheKey);
      if (cachedSuppliers) {
        return cachedSuppliers;
      }

      const where: any = {};

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

      const suppliersWithDetails = await Promise.all(
        suppliers.map(supplier => this.buildSupplierWithDetails(supplier))
      );

      await this.cacheService.set(cacheKey, suppliersWithDetails, { ttl: 600 });

      return suppliersWithDetails;
    } catch (error) {
      this.logger.error('فشل في الحصول على الموردين', error);
      throw error;
    }
  }

  /**
   * الحصول على مورد بالمعرف
   */
  async findOneSupplier(id: string): Promise<SupplierWithDetails> {
    try {
      const cacheKey = `${this.supplierCacheKey}:${id}`;
      const cachedSupplier = await this.cacheService.get<SupplierWithDetails>(cacheKey);

      if (cachedSupplier) {
        return cachedSupplier;
      }

      const supplier = await this.prisma.supplier.findUnique({
        where: { id },
      });

      if (!supplier) {
        throw new NotFoundException('المورد غير موجود');
      }

      const supplierWithDetails = await this.buildSupplierWithDetails(supplier);

      await this.cacheService.set(cacheKey, supplierWithDetails, { ttl: 1800 });

      return supplierWithDetails;
    } catch (error) {
      this.logger.error(`فشل في الحصول على المورد: ${id}`, error);
      throw error;
    }
  }

  /**
   * تحديث مورد
   */
  async updateSupplier(id: string, updateSupplierDto: UpdateSupplierDto): Promise<SupplierWithDetails> {
    try {
      this.logger.log(`تحديث المورد: ${id}`);

      const existingSupplier = await this.prisma.supplier.findUnique({
        where: { id },
      });

      if (!existingSupplier) {
        throw new NotFoundException('المورد غير موجود');
      }

      // التحقق من عدم تكرار البريد الإلكتروني
      if (updateSupplierDto.email && updateSupplierDto.email !== existingSupplier.email) {
        const existingEmail = await this.prisma.supplier.findFirst({
          where: { email: updateSupplierDto.email },
        });

        if (existingEmail) {
          throw new ConflictException('البريد الإلكتروني موجود بالفعل');
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
    } catch (error) {
      this.logger.error(`فشل في تحديث المورد: ${id}`, error);
      throw error;
    }
  }

  /**
   * حذف مورد
   */
  async removeSupplier(id: string): Promise<void> {
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
        throw new NotFoundException('المورد غير موجود');
      }

      // التحقق من عدم وجود أوامر أو فواتير مرتبطة
      if (supplier.purchaseOrders.length > 0 || supplier.purchaseInvoices.length > 0) {
        throw new BadRequestException('لا يمكن حذف مورد مرتبط بأوامر أو فواتير شراء');
      }

      await this.prisma.supplier.delete({
        where: { id },
      });

      await this.invalidateSuppliersCache();

      this.logger.log(`تم حذف المورد بنجاح`);
    } catch (error) {
      this.logger.error(`فشل في حذف المورد: ${id}`, error);
      throw error;
    }
  }

  // ========== PURCHASE ORDERS MANAGEMENT ==========

  /**
   * إنشاء أمر شراء جديد
   */
  async createPurchaseOrder(createPurchaseOrderDto: CreatePurchaseOrderDto, userId: string): Promise<PurchaseOrderWithDetails> {
    try {
      this.logger.log(`إنشاء أمر شراء جديد`);

      // التحقق من وجود المورد
      const supplier = await this.prisma.supplier.findUnique({
        where: { id: createPurchaseOrderDto.supplierId },
      });

      if (!supplier) {
        throw new NotFoundException('المورد غير موجود');
      }

      if (!supplier.isActive) {
        throw new BadRequestException('المورد غير نشط');
      }

      // التحقق من وجود المخزن
      const warehouse = await this.prisma.warehouse.findUnique({
        where: { id: createPurchaseOrderDto.warehouseId },
      });

      if (!warehouse) {
        throw new NotFoundException('المخزن غير موجود');
      }

      // التحقق من وجود المنتجات
      const productIds = createPurchaseOrderDto.lines.map(line => line.productId);
      const products = await this.prisma.product.findMany({
        where: { id: { in: productIds } },
      });

      if (products.length !== productIds.length) {
        throw new BadRequestException('بعض المنتجات المطلوبة غير موجودة');
      }

      return await this.prisma.$transaction(async (tx) => {
        // إنشاء رقم أمر شراء تلقائي
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
    } catch (error) {
      this.logger.error('فشل في إنشاء أمر الشراء', error);
      throw error;
    }
  }

  /**
   * الحصول على أوامر الشراء
   */
  async findAllPurchaseOrders(
    supplierId?: string,
    status?: string,
    limit: number = 50,
  ): Promise<PurchaseOrderWithDetails[]> {
    try {
      const cacheKey = `purchaseOrders:${supplierId || 'all'}:${status || 'all'}`;

      const cachedOrders = await this.cacheService.get<PurchaseOrderWithDetails[]>(cacheKey);
      if (cachedOrders) {
        return cachedOrders;
      }

      const where: any = {};

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

      const ordersWithDetails = purchaseOrders.map(order =>
        this.buildPurchaseOrderWithDetails(order)
      );

      await this.cacheService.set(cacheKey, ordersWithDetails, { ttl: 600 });

      return ordersWithDetails;
    } catch (error) {
      this.logger.error('فشل في الحصول على أوامر الشراء', error);
      throw error;
    }
  }

  /**
   * تحديث حالة أمر الشراء
   */
  async updatePurchaseOrderStatus(id: string, status: string, userId: string): Promise<PurchaseOrderWithDetails> {
    try {
      this.logger.log(`تحديث حالة أمر الشراء: ${id} إلى ${status}`);

      const existingOrder = await this.prisma.purchaseOrder.findUnique({
        where: { id },
      });

      if (!existingOrder) {
        throw new NotFoundException('أمر الشراء غير موجود');
      }

      const validStatuses = ['draft', 'approved', 'ordered', 'received', 'cancelled'];
      if (!validStatuses.includes(status)) {
        throw new BadRequestException('حالة غير صالحة');
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
    } catch (error) {
      this.logger.error(`فشل في تحديث حالة أمر الشراء: ${id}`, error);
      throw error;
    }
  }

  // ========== PURCHASE INVOICES MANAGEMENT ==========

  /**
   * إنشاء فاتورة شراء جديدة
   */
  async createPurchaseInvoice(createPurchaseInvoiceDto: CreatePurchaseInvoiceDto, userId: string): Promise<PurchaseInvoiceWithDetails> {
    try {
      this.logger.log(`إنشاء فاتورة شراء جديدة: ${createPurchaseInvoiceDto.invoiceNumber || 'بدون رقم'}`);

      // التحقق من وجود المورد
      const supplier = await this.prisma.supplier.findUnique({
        where: { id: createPurchaseInvoiceDto.supplierId },
      });

      if (!supplier) {
        throw new NotFoundException('المورد غير موجود');
      }

      // التحقق من وجود المخزن
      const warehouse = await this.prisma.warehouse.findUnique({
        where: { id: createPurchaseInvoiceDto.warehouseId },
      });

      if (!warehouse) {
        throw new NotFoundException('المخزن غير موجود');
      }

      // التحقق من عدم تكرار رقم الفاتورة
      if (createPurchaseInvoiceDto.invoiceNumber) {
        const existingInvoice = await this.prisma.purchaseInvoice.findUnique({
          where: { invoiceNumber: createPurchaseInvoiceDto.invoiceNumber },
        });

        if (existingInvoice) {
          throw new ConflictException('رقم الفاتورة موجود بالفعل');
        }
      }

      // التحقق من صحة أمر الشراء إذا تم تحديده
      if (createPurchaseInvoiceDto.purchaseOrderId) {
        const purchaseOrder = await this.prisma.purchaseOrder.findUnique({
          where: { id: createPurchaseInvoiceDto.purchaseOrderId },
          include: { lines: true },
        });

        if (!purchaseOrder) {
          throw new NotFoundException('أمر الشراء غير موجود');
        }

        if (purchaseOrder.supplierId !== createPurchaseInvoiceDto.supplierId) {
          throw new BadRequestException('أمر الشراء يجب أن يكون من نفس المورد');
        }
      }

      return await this.prisma.$transaction(async (tx) => {
        // إنشاء رقم فاتورة تلقائي إذا لم يُحدد
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

        // حساب المجاميع
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

        // تحديث المخزون - إضافة الكميات المشتراة
        for (const line of createPurchaseInvoiceDto.lines) {
          await this.inventoryService.adjustStock(
            createPurchaseInvoiceDto.warehouseId,
            line.productVariantId,
            {
              quantity: line.quantity,
              movementType: 'purchase',
              referenceType: 'purchase_invoice',
              referenceId: purchaseInvoice.id,
              reason: `فاتورة شراء - ${invoiceNumber}`,
            },
            userId,
          );
        }

        // تحديث حالة أمر الشراء إلى "received" إذا كان موجوداً
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
    } catch (error) {
      this.logger.error('فشل في إنشاء فاتورة الشراء', error);
      throw error;
    }
  }

  /**
   * إنشاء دفعة لفاتورة شراء
   */
  async createPurchasePayment(invoiceId: string, createPurchasePaymentDto: CreatePurchasePaymentDto, userId: string): Promise<any> {
    try {
      this.logger.log(`إنشاء دفعة لفاتورة الشراء: ${invoiceId}`);

      const purchaseInvoice = await this.prisma.purchaseInvoice.findUnique({
        where: { id: invoiceId },
        include: { payments: true },
      });

      if (!purchaseInvoice) {
        throw new NotFoundException('فاتورة الشراء غير موجودة');
      }

      // حساب إجمالي المدفوعات الحالية
      const currentPaymentsTotal = purchaseInvoice.payments.reduce(
        (sum, payment) => sum + Number(payment.amount),
        0
      );

      const remainingAmount = Number(purchaseInvoice.totalAmount) - currentPaymentsTotal;

      if (createPurchasePaymentDto.amount > remainingAmount) {
        throw new BadRequestException(
          `مبلغ الدفعة يتجاوز المبلغ المتبقي (${remainingAmount})`
        );
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

        // تحديث حالة الدفع
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
    } catch (error) {
      this.logger.error(`فشل في إنشاء دفعة فاتورة الشراء: ${invoiceId}`, error);
      throw error;
    }
  }

  /**
   * الحصول على إحصائيات المشتريات
   */
  async getPurchasingStats(startDate?: Date, endDate?: Date) {
    try {
      const where: any = {};

      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) where.createdAt.gte = startDate;
        if (endDate) where.createdAt.lte = endDate;
      }

      const [
        totalSuppliers,
        activeSuppliers,
        totalPurchaseOrders,
        approvedOrders,
        totalPurchaseInvoices,
        paidInvoices,
        totalPurchased,
        totalPaid,
      ] = await Promise.all([
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
    } catch (error) {
      this.logger.error('فشل في الحصول على إحصائيات المشتريات', error);
      throw error;
    }
  }

  // ========== HELPER METHODS ==========

  /**
   * بناء كائن المورد مع التفاصيل
   */
  private async buildSupplierWithDetails(supplier: any): Promise<SupplierWithDetails> {
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

  /**
   * بناء كائن أمر الشراء مع التفاصيل
   */
  private buildPurchaseOrderWithDetails(purchaseOrder: any): PurchaseOrderWithDetails {
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
      lines: purchaseOrder.lines.map((line: any) => ({
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

  /**
   * بناء كائن فاتورة الشراء مع التفاصيل
   */
  private buildPurchaseInvoiceWithDetails(purchaseInvoice: any): PurchaseInvoiceWithDetails {
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
      lines: purchaseInvoice.lines.map((line: any) => ({
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
      payments: purchaseInvoice.payments.map((payment: any) => ({
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

  /**
   * إبطال كاش الموردين
   */
  private async invalidateSuppliersCache(): Promise<void> {
    await this.cacheService.delete(this.suppliersCacheKey);

    const supplierKeys = await this.cacheService.getKeys(`${this.supplierCacheKey}:*`);
    for (const key of supplierKeys) {
      await this.cacheService.delete(key);
    }
  }

  /**
   * إبطال كاش أوامر الشراء
   */
  private async invalidatePurchaseOrdersCache(): Promise<void> {
    await this.cacheService.delete(this.purchaseOrdersCacheKey);

    const orderKeys = await this.cacheService.getKeys(`${this.purchaseOrderCacheKey}:*`);
    for (const key of orderKeys) {
      await this.cacheService.delete(key);
    }
  }

  /**
   * إبطال كاش فواتير الشراء
   */
  private async invalidatePurchaseInvoicesCache(): Promise<void> {
    await this.cacheService.delete(this.purchaseInvoicesCacheKey);

    const invoiceKeys = await this.cacheService.getKeys(`${this.purchaseInvoiceCacheKey}:*`);
    for (const key of invoiceKeys) {
      await this.cacheService.delete(key);
    }
  }
}
