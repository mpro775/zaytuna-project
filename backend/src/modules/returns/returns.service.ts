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
import { CreateReturnDto } from './dto/create-return.dto';
import { UpdateReturnDto } from './dto/update-return.dto';
import { CreateCreditNoteDto } from './dto/create-credit-note.dto';

export interface ReturnWithDetails {
  id: string;
  returnNumber: string;
  salesInvoiceId: string;
  customerId?: string;
  cashierId: string;
  warehouseId: string;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  currencyId: string;
  reason: string;
  status: string;
  refundStatus: string;
  notes?: string;
  salesInvoice: {
    id: string;
    invoiceNumber: string;
    totalAmount: number;
    customer?: {
      id: string;
      name: string;
    };
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
  lines: Array<{
    id: string;
    productVariantId: string;
    warehouseId: string;
    quantity: number;
    unitPrice: number;
    discountAmount: number;
    taxAmount: number;
    lineTotal: number;
    reason?: string;
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
  creditNotes: Array<{
    id: string;
    creditNoteNumber: string;
    amount: number;
    remainingAmount: number;
    status: string;
    expiryDate?: Date;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class ReturnsService {
  private readonly logger = new Logger(ReturnsService.name);
  private readonly returnsCacheKey = 'returns';
  private readonly returnCacheKey = 'return';

  constructor(
    private readonly prisma: PrismaService,
    private readonly cacheService: CacheService,
    private readonly inventoryService: InventoryService,
  ) {}

  /**
   * إنشاء مرتجع جديد
   */
  async create(createReturnDto: CreateReturnDto, userId: string): Promise<ReturnWithDetails> {
    try {
      this.logger.log(`إنشاء مرتجع جديد: ${createReturnDto.returnNumber || 'بدون رقم'}`);

      // التحقق من وجود فاتورة المبيعات
      const salesInvoice = await this.prisma.salesInvoice.findUnique({
        where: { id: createReturnDto.salesInvoiceId },
        include: {
          lines: true,
          customer: true,
          warehouse: true,
        },
      });

      if (!salesInvoice) {
        throw new NotFoundException('فاتورة المبيعات غير موجودة');
      }

      // التحقق من أن الفاتورة مؤكدة
      if (salesInvoice.status !== 'confirmed') {
        throw new BadRequestException('لا يمكن إنشاء مرتجع إلا لفاتورة مؤكدة');
      }

      // التحقق من وجود المخزن
      if (createReturnDto.warehouseId !== salesInvoice.warehouseId) {
        throw new BadRequestException('مخزن المرتجع يجب أن يكون نفس مخزن فاتورة المبيعات');
      }

      // التحقق من عدم تكرار رقم المرتجع
      if (createReturnDto.returnNumber) {
        const existingReturn = await this.prisma.return.findUnique({
          where: { returnNumber: createReturnDto.returnNumber },
        });

        if (existingReturn) {
          throw new ConflictException('رقم المرتجع موجود بالفعل');
        }
      }

      // التحقق من صحة بنود المرتجع
      const returnItems = new Map<string, any>();

      for (const line of createReturnDto.lines) {
        // التحقق من أن البند موجود في فاتورة المبيعات
        const salesLine = salesInvoice.lines.find(
          sl => sl.productVariantId === line.productVariantId
        );

        if (!salesLine) {
          throw new BadRequestException(
            `المنتج ${line.productVariantId} غير موجود في فاتورة المبيعات`
          );
        }

        // التحقق من الكمية
        if (line.quantity > Number(salesLine.quantity)) {
          throw new BadRequestException(
            `كمية المرتجع (${line.quantity}) أكبر من كمية المبيعات (${salesLine.quantity}) للمنتج ${line.productVariantId}`
          );
        }

        // التحقق من عدم تكرار المنتج في المرتجع
        if (returnItems.has(line.productVariantId)) {
          throw new BadRequestException(
            `المنتج ${line.productVariantId} موجود أكثر من مرة في المرتجع`
          );
        }

        returnItems.set(line.productVariantId, {
          salesLine,
          returnLine: line,
        });
      }

      return await this.prisma.$transaction(async (tx) => {
        // إنشاء رقم مرتجع تلقائي إذا لم يُحدد
        let returnNumber = createReturnDto.returnNumber;
        if (!returnNumber) {
          const lastReturn = await tx.return.findFirst({
            where: { salesInvoiceId: createReturnDto.salesInvoiceId },
            orderBy: { createdAt: 'desc' },
          });

          const sequence = lastReturn ? parseInt(lastReturn.returnNumber.split('-')[2] || '0') + 1 : 1;
          returnNumber = `${salesInvoice.invoiceNumber}-RTN-${sequence.toString().padStart(3, '0')}`;
        }

        // حساب المجاميع
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

        // إنشاء المرتجع
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

        // تحديث المخزون - إضافة الكميات المرتجعة
        for (const line of createReturnDto.lines) {
          await this.inventoryService.adjustStock(
            createReturnDto.warehouseId,
            line.productVariantId,
            {
              quantity: line.quantity,
              movementType: 'return',
              referenceType: 'return',
              referenceId: returnDoc.id,
              reason: `مرتجع - ${returnNumber}: ${line.reason || 'بدون سبب'}`,
            },
            userId,
          );
        }

        // تحديث الكاش
        await this.invalidateReturnsCache();

        const returnWithDetails = this.buildReturnWithDetails(returnDoc);

        this.logger.log(`تم إنشاء المرتجع بنجاح: ${returnNumber}`);
        return returnWithDetails;
      });
    } catch (error) {
      this.logger.error('فشل في إنشاء المرتجع', error);
      throw error;
    }
  }

  /**
   * الحصول على المرتجعات
   */
  async findAll(
    salesInvoiceId?: string,
    customerId?: string,
    status?: string,
    refundStatus?: string,
    limit: number = 50,
  ): Promise<ReturnWithDetails[]> {
    try {
      const cacheKey = `returns:${salesInvoiceId || 'all'}:${customerId || 'all'}:${status || 'all'}:${refundStatus || 'all'}`;

      const cachedReturns = await this.cacheService.get<ReturnWithDetails[]>(cacheKey);
      if (cachedReturns) {
        return cachedReturns;
      }

      const where: any = {};

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

      const returnsWithDetails = returns.map(returnDoc =>
        this.buildReturnWithDetails(returnDoc)
      );

      await this.cacheService.set(cacheKey, returnsWithDetails, { ttl: 600 });

      return returnsWithDetails;
    } catch (error) {
      this.logger.error('فشل في الحصول على المرتجعات', error);
      throw error;
    }
  }

  /**
   * الحصول على مرتجع بالمعرف
   */
  async findOne(id: string): Promise<ReturnWithDetails> {
    try {
      const cacheKey = `${this.returnCacheKey}:${id}`;
      const cachedReturn = await this.cacheService.get<ReturnWithDetails>(cacheKey);

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
        throw new NotFoundException('المرتجع غير موجود');
      }

      const returnWithDetails = this.buildReturnWithDetails(returnDoc);

      await this.cacheService.set(cacheKey, returnWithDetails, { ttl: 1800 });

      return returnWithDetails;
    } catch (error) {
      this.logger.error(`فشل في الحصول على المرتجع: ${id}`, error);
      throw error;
    }
  }

  /**
   * تحديث مرتجع
   */
  async update(id: string, updateReturnDto: UpdateReturnDto): Promise<ReturnWithDetails> {
    try {
      this.logger.log(`تحديث المرتجع: ${id}`);

      const existingReturn = await this.prisma.return.findUnique({
        where: { id },
      });

      if (!existingReturn) {
        throw new NotFoundException('المرتجع غير موجود');
      }

      // لا يمكن تحديث المرتجعات المؤكدة أو الملغاة
      if (['confirmed', 'cancelled'].includes(existingReturn.status)) {
        throw new BadRequestException('لا يمكن تحديث مرتجع مؤكد أو ملغى');
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
    } catch (error) {
      this.logger.error(`فشل في تحديث المرتجع: ${id}`, error);
      throw error;
    }
  }

  /**
   * إنشاء إشعار دائن
   */
  async createCreditNote(returnId: string, createCreditNoteDto: CreateCreditNoteDto, userId: string): Promise<any> {
    try {
      this.logger.log(`إنشاء إشعار دائن للمرتجع: ${returnId}`);

      const returnDoc = await this.prisma.return.findUnique({
        where: { id: returnId },
        include: {
          creditNotes: true,
        },
      });

      if (!returnDoc) {
        throw new NotFoundException('المرتجع غير موجود');
      }

      if (returnDoc.status !== 'confirmed') {
        throw new BadRequestException('لا يمكن إنشاء إشعار دائن إلا لمرتجع مؤكد');
      }

      // حساب إجمالي الإشعارات الدائنة الحالية
      const currentCreditTotal = returnDoc.creditNotes.reduce(
        (sum, note) => sum + Number(note.amount),
        0
      );

      const remainingAmount = Number(returnDoc.totalAmount) - currentCreditTotal;

      if (createCreditNoteDto.amount > remainingAmount) {
        throw new BadRequestException(
          `مبلغ الإشعار الدائن يتجاوز المبلغ المتبقي (${remainingAmount})`
        );
      }

      return await this.prisma.$transaction(async (tx) => {
        // إنشاء رقم إشعار دائن تلقائي
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

        // تحديث حالة استرداد المرتجع
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
    } catch (error) {
      this.logger.error(`فشل في إنشاء إشعار الدائن: ${returnId}`, error);
      throw error;
    }
  }

  /**
   * إلغاء مرتجع
   */
  async cancel(id: string, reason: string, userId: string): Promise<ReturnWithDetails> {
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
        throw new NotFoundException('المرتجع غير موجود');
      }

      if (['cancelled'].includes(returnDoc.status)) {
        throw new BadRequestException('المرتجع ملغى بالفعل');
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

        // إنقاص المخزون - إعادة الكميات للمخزون الأصلي
        for (const line of returnDoc.lines) {
          await this.inventoryService.adjustStock(
            returnDoc.warehouseId,
            line.productVariantId,
            {
              quantity: -Number(line.quantity),
              movementType: 'adjustment',
              referenceType: 'return_cancelled',
              referenceId: returnDoc.id,
              reason: `إلغاء مرتجع - ${returnDoc.returnNumber}`,
            },
            userId,
          );
        }

        await this.invalidateReturnsCache();

        const returnWithDetails = this.buildReturnWithDetails(updatedReturn);

        this.logger.log(`تم إلغاء المرتجع بنجاح: ${id}`);
        return returnWithDetails;
      });
    } catch (error) {
      this.logger.error(`فشل في إلغاء المرتجع: ${id}`, error);
      throw error;
    }
  }

  /**
   * الحصول على إحصائيات المرتجعات
   */
  async getReturnsStats(startDate?: Date, endDate?: Date) {
    try {
      const where: any = {};

      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) where.createdAt.gte = startDate;
        if (endDate) where.createdAt.lte = endDate;
      }

      const [
        totalReturns,
        confirmedReturns,
        totalReturnValue,
        totalCreditNotes,
        totalRefunded,
        pendingRefunds,
      ] = await Promise.all([
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
    } catch (error) {
      this.logger.error('فشل في الحصول على إحصائيات المرتجعات', error);
      throw error;
    }
  }

  /**
   * بناء كائن المرتجع مع التفاصيل
   */
  private buildReturnWithDetails(returnDoc: any): ReturnWithDetails {
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
      lines: returnDoc.lines.map((line: any) => ({
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
      creditNotes: returnDoc.creditNotes.map((note: any) => ({
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

  /**
   * إبطال كاش المرتجعات
   */
  private async invalidateReturnsCache(): Promise<void> {
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
}
