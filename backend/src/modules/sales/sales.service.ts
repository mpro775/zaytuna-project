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
import { CreateSalesInvoiceDto } from './dto/create-sales-invoice.dto';
import { UpdateSalesInvoiceDto } from './dto/update-sales-invoice.dto';
import { CreatePaymentDto } from './dto/create-payment.dto';

export interface SalesInvoiceWithDetails {
  id: string;
  invoiceNumber: string;
  branchId: string;
  customerId?: string;
  cashierId: string;
  warehouseId: string;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  currencyId: string;
  taxId?: string;
  status: string;
  paymentStatus: string;
  notes?: string;
  dueDate?: Date;
  branch: {
    id: string;
    name: string;
    code: string;
  };
  customer?: {
    id: string;
    name: string;
    phone?: string;
    email?: string;
  };
  cashier: {
    id: string;
    username: string;
  };
  warehouse: {
    id: string;
    name: string;
    code: string;
  };
  currency: {
    id: string;
    code: string;
    name: string;
    symbol?: string;
  };
  tax?: {
    id: string;
    name: string;
    rate: number;
  };
  lines: Array<{
    id: string;
    productVariantId: string;
    warehouseId: string;
    quantity: number;
    unitPrice: number;
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
    processedBy?: string;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class SalesService {
  private readonly logger = new Logger(SalesService.name);
  private readonly salesInvoicesCacheKey = 'sales_invoices';
  private readonly salesInvoiceCacheKey = 'sales_invoice';

  constructor(
    private readonly prisma: PrismaService,
    private readonly cacheService: CacheService,
    private readonly inventoryService: InventoryService,
  ) {}

  /**
   * إنشاء فاتورة مبيعات جديدة
   */
  async create(createSalesInvoiceDto: CreateSalesInvoiceDto, userId: string): Promise<SalesInvoiceWithDetails> {
    try {
      this.logger.log(`إنشاء فاتورة مبيعات جديدة: ${createSalesInvoiceDto.invoiceNumber || 'بدون رقم'}`);

      // التحقق من وجود الفرع
      const branch = await this.prisma.branch.findUnique({
        where: { id: createSalesInvoiceDto.branchId },
      });

      if (!branch) {
        throw new NotFoundException('الفرع غير موجود');
      }

      // التحقق من وجود العميل (إذا تم تحديده)
      if (createSalesInvoiceDto.customerId) {
        const customer = await this.prisma.customer.findUnique({
          where: { id: createSalesInvoiceDto.customerId },
        });

        if (!customer) {
          throw new NotFoundException('العميل غير موجود');
        }
      }

      // التحقق من وجود المخزن
      const warehouse = await this.prisma.warehouse.findUnique({
        where: { id: createSalesInvoiceDto.warehouseId },
      });

      if (!warehouse) {
        throw new NotFoundException('المخزن غير موجود');
      }

      // التحقق من وجود العملة
      const currency = await this.prisma.currency.findUnique({
        where: { id: createSalesInvoiceDto.currencyId },
      });

      if (!currency) {
        throw new NotFoundException('العملة غير موجودة');
      }

      // التحقق من عدم تكرار رقم الفاتورة
      if (createSalesInvoiceDto.invoiceNumber) {
        const existingInvoice = await this.prisma.salesInvoice.findUnique({
          where: { invoiceNumber: createSalesInvoiceDto.invoiceNumber },
        });

        if (existingInvoice) {
          throw new ConflictException('رقم الفاتورة موجود بالفعل');
        }
      }

      return await this.prisma.$transaction(async (tx) => {
        // إنشاء رقم فاتورة تلقائي إذا لم يتم تحديده
        let invoiceNumber = createSalesInvoiceDto.invoiceNumber;
        if (!invoiceNumber) {
          const lastInvoice = await tx.salesInvoice.findFirst({
            where: { branchId: createSalesInvoiceDto.branchId },
            orderBy: { createdAt: 'desc' },
          });

          const sequence = lastInvoice ? parseInt(lastInvoice.invoiceNumber.split('-')[1] || '0') + 1 : 1;
          invoiceNumber = `${branch.code}-INV-${sequence.toString().padStart(6, '0')}`;
        }

        // حساب المجاميع
        let subtotal = 0;
        let taxAmount = 0;
        let discountAmount = 0;

        // التحقق من توفر المخزون وتحديث الأسعار
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
            throw new BadRequestException(
              `المنتج ${line.productVariantId} غير متوفر في المخزن المحدد`
            );
          }

          if (Number(stockItem.quantity) < line.quantity) {
            throw new BadRequestException(
              `الكمية المتاحة من ${stockItem.productVariant.name} غير كافية (${stockItem.quantity} متوفر)`
            );
          }

          // استخدام السعر من المنتج أو المتغير
          const unitPrice = line.unitPrice || Number(stockItem.productVariant.price) ||
                           Number(stockItem.productVariant.product.basePrice);

          const lineSubtotal = unitPrice * line.quantity;
          const lineDiscount = line.discountAmount || 0;
          const lineTax = line.taxAmount || 0;

          subtotal += lineSubtotal;
          discountAmount += lineDiscount;
          taxAmount += lineTax;

          // تحديث السطر بالأسعار المحسوبة
          line.unitPrice = unitPrice;
          line.discountAmount = lineDiscount;
          line.taxAmount = lineTax;
          line.lineTotal = lineSubtotal - lineDiscount + lineTax;
        }

        const totalAmount = subtotal - discountAmount + taxAmount;

        // إنشاء فاتورة المبيعات
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

        // تحديث المخزون
        for (const line of createSalesInvoiceDto.lines) {
          await this.inventoryService.adjustStock(
            createSalesInvoiceDto.warehouseId,
            line.productVariantId,
            {
              quantity: -line.quantity,
              movementType: 'sale',
              referenceType: 'sales_invoice',
              referenceId: salesInvoice.id,
              reason: `مبيعات - فاتورة رقم ${invoiceNumber}`,
            },
            userId,
          );
        }

        // تحديث الكاش
        await this.invalidateSalesCache();

        const salesInvoiceWithDetails = this.buildSalesInvoiceWithDetails(salesInvoice);

        this.logger.log(`تم إنشاء فاتورة المبيعات بنجاح: ${invoiceNumber}`);
        return salesInvoiceWithDetails;
      });
    } catch (error) {
      this.logger.error('فشل في إنشاء فاتورة المبيعات', error);
      throw error;
    }
  }

  /**
   * الحصول على فواتير المبيعات
   */
  async findAll(
    branchId?: string,
    customerId?: string,
    status?: string,
    paymentStatus?: string,
    limit: number = 50,
  ): Promise<SalesInvoiceWithDetails[]> {
    try {
      const cacheKey = `sales_invoices:${branchId || 'all'}:${customerId || 'all'}:${status || 'all'}:${paymentStatus || 'all'}`;

      // محاولة الحصول من الكاش أولاً
      const cachedInvoices = await this.cacheService.get<SalesInvoiceWithDetails[]>(cacheKey);
      if (cachedInvoices) {
        return cachedInvoices;
      }

      const where: any = {};

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

      const salesInvoicesWithDetails = salesInvoices.map(invoice =>
        this.buildSalesInvoiceWithDetails(invoice)
      );

      // حفظ في الكاش لمدة 10 دقائق
      await this.cacheService.set(cacheKey, salesInvoicesWithDetails, { ttl: 600 });

      return salesInvoicesWithDetails;
    } catch (error) {
      this.logger.error('فشل في الحصول على فواتير المبيعات', error);
      throw error;
    }
  }

  /**
   * الحصول على فاتورة مبيعات بالمعرف
   */
  async findOne(id: string): Promise<SalesInvoiceWithDetails> {
    try {
      const cacheKey = `${this.salesInvoiceCacheKey}:${id}`;
      const cachedInvoice = await this.cacheService.get<SalesInvoiceWithDetails>(cacheKey);

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
        throw new NotFoundException('فاتورة المبيعات غير موجودة');
      }

      const salesInvoiceWithDetails = this.buildSalesInvoiceWithDetails(salesInvoice);

      // حفظ في الكاش لمدة 30 دقيقة
      await this.cacheService.set(cacheKey, salesInvoiceWithDetails, { ttl: 1800 });

      return salesInvoiceWithDetails;
    } catch (error) {
      this.logger.error(`فشل في الحصول على فاتورة المبيعات: ${id}`, error);
      throw error;
    }
  }

  /**
   * تحديث فاتورة مبيعات
   */
  async update(id: string, updateSalesInvoiceDto: UpdateSalesInvoiceDto): Promise<SalesInvoiceWithDetails> {
    try {
      this.logger.log(`تحديث فاتورة المبيعات: ${id}`);

      // التحقق من وجود الفاتورة
      const existingInvoice = await this.prisma.salesInvoice.findUnique({
        where: { id },
        include: {
          lines: true,
        },
      });

      if (!existingInvoice) {
        throw new NotFoundException('فاتورة المبيعات غير موجودة');
      }

      // لا يمكن تحديث الفواتير المؤكدة أو الملغاة
      if (['confirmed', 'cancelled', 'refunded'].includes(existingInvoice.status)) {
        throw new BadRequestException('لا يمكن تحديث فاتورة مؤكدة أو ملغاة');
      }

      // تحديث الفاتورة
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

      // تحديث الكاش
      await this.invalidateSalesCache();

      const salesInvoiceWithDetails = this.buildSalesInvoiceWithDetails(salesInvoice);

      this.logger.log(`تم تحديث فاتورة المبيعات بنجاح`);
      return salesInvoiceWithDetails;
    } catch (error) {
      this.logger.error(`فشل في تحديث فاتورة المبيعات: ${id}`, error);
      throw error;
    }
  }

  /**
   * إضافة دفعة لفاتورة
   */
  async addPayment(salesInvoiceId: string, createPaymentDto: CreatePaymentDto, userId: string): Promise<SalesInvoiceWithDetails> {
    try {
      this.logger.log(`إضافة دفعة للفاتورة: ${salesInvoiceId}`);

      // التحقق من وجود الفاتورة
      const salesInvoice = await this.prisma.salesInvoice.findUnique({
        where: { id: salesInvoiceId },
        include: {
          payments: true,
          currency: true,
        },
      });

      if (!salesInvoice) {
        throw new NotFoundException('فاتورة المبيعات غير موجودة');
      }

      // التحقق من العملة
      if (createPaymentDto.currencyId !== salesInvoice.currencyId) {
        throw new BadRequestException('عملة الدفعة يجب أن تتطابق مع عملة الفاتورة');
      }

      // حساب إجمالي المدفوعات الحالية
      const currentPaymentsTotal = salesInvoice.payments.reduce(
        (sum, payment) => sum + Number(payment.amount),
        0
      );

      const remainingAmount = Number(salesInvoice.totalAmount) - currentPaymentsTotal;

      if (createPaymentDto.amount > remainingAmount) {
        throw new BadRequestException(
          `مبلغ الدفعة يتجاوز المبلغ المستحق (${remainingAmount})`
        );
      }

      return await this.prisma.$transaction(async (tx) => {
        // إنشاء الدفعة
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

        // تحديث حالة الدفع
        const newPaymentsTotal = currentPaymentsTotal + Number(createPaymentDto.amount);
        let paymentStatus = 'partial';

        if (newPaymentsTotal === 0) {
          paymentStatus = 'pending';
        } else if (newPaymentsTotal >= Number(salesInvoice.totalAmount)) {
          paymentStatus = 'paid';
        }

        // تحديث الفاتورة
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

        // تحديث الكاش
        await this.invalidateSalesCache();

        const salesInvoiceWithDetails = this.buildSalesInvoiceWithDetails(updatedInvoice);

        this.logger.log(`تم إضافة الدفعة بنجاح للفاتورة: ${salesInvoiceId}`);
        return salesInvoiceWithDetails;
      });
    } catch (error) {
      this.logger.error(`فشل في إضافة الدفعة: ${salesInvoiceId}`, error);
      throw error;
    }
  }

  /**
   * إلغاء فاتورة مبيعات
   */
  async cancel(id: string, reason: string, userId: string): Promise<SalesInvoiceWithDetails> {
    try {
      this.logger.log(`إلغاء فاتورة المبيعات: ${id}`);

      // التحقق من وجود الفاتورة
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
        throw new NotFoundException('فاتورة المبيعات غير موجودة');
      }

      // لا يمكن إلغاء الفواتير الملغاة أو المستردة
      if (['cancelled', 'refunded'].includes(salesInvoice.status)) {
        throw new BadRequestException('الفاتورة ملغاة أو مستردة بالفعل');
      }

      return await this.prisma.$transaction(async (tx) => {
        // تحديث حالة الفاتورة
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

        // إعادة المخزون
        for (const line of salesInvoice.lines) {
          await this.inventoryService.adjustStock(
            salesInvoice.warehouseId,
            line.productVariantId,
            {
              quantity: Number(line.quantity),
              movementType: 'adjustment',
              referenceType: 'sales_cancelled',
              referenceId: salesInvoice.id,
              reason: `إلغاء مبيعات - فاتورة رقم ${salesInvoice.invoiceNumber}`,
            },
            userId,
          );
        }

        // تحديث الكاش
        await this.invalidateSalesCache();

        const salesInvoiceWithDetails = this.buildSalesInvoiceWithDetails(updatedInvoice);

        this.logger.log(`تم إلغاء فاتورة المبيعات بنجاح: ${id}`);
        return salesInvoiceWithDetails;
      });
    } catch (error) {
      this.logger.error(`فشل في إلغاء فاتورة المبيعات: ${id}`, error);
      throw error;
    }
  }

  /**
   * الحصول على إحصائيات المبيعات
   */
  async getSalesStats(branchId?: string, startDate?: Date, endDate?: Date) {
    try {
      const where: any = {};

      if (branchId) {
        where.branchId = branchId;
      }

      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) where.createdAt.gte = startDate;
        if (endDate) where.createdAt.lte = endDate;
      }

      const [
        totalInvoices,
        confirmedInvoices,
        totalRevenue,
        totalTax,
        totalDiscount,
        pendingPayments,
        paidInvoices,
      ] = await Promise.all([
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
    } catch (error) {
      this.logger.error('فشل في الحصول على إحصائيات المبيعات', error);
      throw error;
    }
  }

  /**
   * بناء كائن فاتورة المبيعات مع التفاصيل
   */
  private buildSalesInvoiceWithDetails(salesInvoice: any): SalesInvoiceWithDetails {
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
      lines: salesInvoice.lines.map((line: any) => ({
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
      payments: salesInvoice.payments.map((payment: any) => ({
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

  /**
   * إبطال كاش المبيعات
   */
  private async invalidateSalesCache(): Promise<void> {
    await this.cacheService.delete(this.salesInvoicesCacheKey);

    // إبطال جميع الكاشات المتعلقة بالمبيعات
    const salesKeys = await this.cacheService.getKeys('sales_invoices:*');
    for (const key of salesKeys) {
      await this.cacheService.delete(key);
    }

    // إبطال كاش الفواتير الفردية
    const invoiceKeys = await this.cacheService.getKeys(`${this.salesInvoiceCacheKey}:*`);
    for (const key of invoiceKeys) {
      await this.cacheService.delete(key);
    }
  }
}
