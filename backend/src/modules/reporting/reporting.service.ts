import {
  Injectable,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../shared/database/prisma.service';
import { CacheService } from '../../shared/cache/cache.service';

export interface SalesReport {
  summary: {
    totalSales: number;
    totalRevenue: number;
    totalTax: number;
    totalDiscount: number;
    totalInvoices: number;
    averageOrderValue: number;
    topSellingProducts: Array<{
      productId: string;
      productName: string;
      quantity: number;
      revenue: number;
    }>;
  };
  byPeriod: Array<{
    period: string;
    sales: number;
    revenue: number;
    invoices: number;
  }>;
  byBranch: Array<{
    branchId: string;
    branchName: string;
    sales: number;
    revenue: number;
    invoices: number;
  }>;
  byCustomer: Array<{
    customerId: string;
    customerName: string;
    sales: number;
    revenue: number;
    invoices: number;
    lastPurchase: Date;
  }>;
  byPaymentMethod: Array<{
    method: string;
    amount: number;
    count: number;
    percentage: number;
  }>;
}

export interface InventoryReport {
  summary: {
    totalItems: number;
    totalValue: number;
    lowStockItems: number;
    outOfStockItems: number;
    overStockItems: number;
  };
  byWarehouse: Array<{
    warehouseId: string;
    warehouseName: string;
    totalItems: number;
    totalValue: number;
    lowStockItems: number;
  }>;
  lowStockAlerts: Array<{
    productVariantId: string;
    productName: string;
    variantName: string;
    warehouseName: string;
    currentStock: number;
    minStock: number;
    reorderPoint: number;
  }>;
  stockMovements: Array<{
    date: Date;
    productName: string;
    movementType: string;
    quantity: number;
    warehouseName: string;
    reason: string;
  }>;
  topMovingProducts: Array<{
    productId: string;
    productName: string;
    totalIn: number;
    totalOut: number;
    netMovement: number;
    currentStock: number;
  }>;
}

export interface FinancialReport {
  balanceSheet: {
    assets: {
      currentAssets: number;
      fixedAssets: number;
      totalAssets: number;
    };
    liabilities: {
      currentLiabilities: number;
      longTermLiabilities: number;
      totalLiabilities: number;
    };
    equity: {
      capital: number;
      retainedEarnings: number;
      totalEquity: number;
    };
    totalLiabilitiesAndEquity: number;
  };
  profitLoss: {
    revenue: {
      salesRevenue: number;
      otherIncome: number;
      totalRevenue: number;
    };
    expenses: {
      costOfGoodsSold: number;
      operatingExpenses: number;
      totalExpenses: number;
    };
    netProfit: number;
    grossMargin: number;
    netMargin: number;
  };
  cashFlow?: {
    operatingActivities: number;
    investingActivities: number;
    financingActivities: number;
    netCashFlow: number;
  };
}

export interface DashboardData {
  overview: {
    totalRevenue: number;
    totalRevenueChange: number;
    totalOrders: number;
    totalOrdersChange: number;
    totalCustomers: number;
    totalCustomersChange: number;
    averageOrderValue: number;
    averageOrderValueChange: number;
  };
  charts: {
    revenueByPeriod: Array<{
      period: string;
      revenue: number;
      orders: number;
    }>;
    salesByCategory: Array<{
      category: string;
      revenue: number;
      percentage: number;
    }>;
    topProducts: Array<{
      productId: string;
      productName: string;
      revenue: number;
      quantity: number;
    }>;
    customerGrowth: Array<{
      period: string;
      customers: number;
    }>;
  };
  alerts: {
    lowStockItems: number;
    overduePayments: number;
    pendingOrders: number;
    expiringProducts: number;
  };
  recentActivity: Array<{
    type: 'sale' | 'purchase' | 'payment' | 'return';
    description: string;
    amount: number;
    date: Date;
    reference: string;
  }>;
}

@Injectable()
export class ReportingService {
  private readonly logger = new Logger(ReportingService.name);
  private readonly reportsCacheKey = 'reports';

  constructor(
    private readonly prisma: PrismaService,
    private readonly cacheService: CacheService,
  ) {}

  /**
   * تقرير المبيعات الشامل
   */
  async getSalesReport(
    startDate: Date,
    endDate: Date,
    branchId?: string,
    customerId?: string,
  ): Promise<SalesReport> {
    try {
      this.logger.log(`إنشاء تقرير المبيعات: ${startDate.toISOString()} - ${endDate.toISOString()}`);

      const cacheKey = `sales_report:${startDate.toISOString()}:${endDate.toISOString()}:${branchId || 'all'}:${customerId || 'all'}`;

      const cachedReport = await this.cacheService.get<SalesReport>(cacheKey);
      if (cachedReport) {
        return cachedReport;
      }

      // استعلامات البيانات الأساسية
      const whereClause: any = {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
        status: {
          in: ['confirmed', 'paid'],
        },
      };

      if (branchId) {
        whereClause.branchId = branchId;
      }

      // الملخص العام
      const salesSummary = await this.prisma.salesInvoice.aggregate({
        where: whereClause,
        _count: { id: true },
        _sum: {
          subtotal: true,
          taxAmount: true,
          discountAmount: true,
          totalAmount: true,
        },
      });

      const totalSales = Number(salesSummary._sum.totalAmount || 0);
      const totalInvoices = salesSummary._count.id;
      const averageOrderValue = totalInvoices > 0 ? totalSales / totalInvoices : 0;

      // أفضل المنتجات مبيعاً
      const topSellingProducts = await this.prisma.salesInvoiceLine.groupBy({
        by: ['productVariantId'],
        where: {
          salesInvoice: whereClause,
        },
        _sum: {
          quantity: true,
          lineTotal: true,
        },
        orderBy: {
          _sum: {
            lineTotal: 'desc',
          },
        },
        take: 10,
      });

      // جلب تفاصيل المنتجات
      const topProductsWithDetails = await Promise.all(
        topSellingProducts.map(async (item) => {
          const productVariant = await this.prisma.productVariant.findUnique({
            where: { id: item.productVariantId },
            include: { product: true },
          });

          return {
            productId: productVariant?.product.id || '',
            productName: productVariant?.product.name || 'غير معروف',
            quantity: Number(item._sum.quantity || 0),
            revenue: Number(item._sum.lineTotal || 0),
          };
        })
      );

      // المبيعات حسب الفترة (يومياً)
      const salesByPeriod = await this.prisma.$queryRaw<Array<{
        period: string;
        sales: number;
        revenue: number;
        invoices: number;
      }>>`
        SELECT
          DATE(created_at) as period,
          COUNT(*) as invoices,
          SUM(subtotal) as sales,
          SUM(total_amount) as revenue
        FROM sales_invoices
        WHERE created_at >= ${startDate}
          AND created_at <= ${endDate}
          AND status IN ('confirmed', 'paid')
          ${branchId ? `AND branch_id = '${branchId}'` : ''}
        GROUP BY DATE(created_at)
        ORDER BY DATE(created_at)
      `;

      // المبيعات حسب الفرع
      const salesByBranch = await this.prisma.salesInvoice.groupBy({
        by: ['branchId'],
        where: whereClause,
        _count: { id: true },
        _sum: {
          subtotal: true,
          totalAmount: true,
        },
      });

      const branchesWithNames = await Promise.all(
        salesByBranch.map(async (item) => {
          const branch = await this.prisma.branch.findUnique({
            where: { id: item.branchId },
            select: { name: true },
          });

          return {
            branchId: item.branchId,
            branchName: branch?.name || 'غير معروف',
            sales: Number(item._sum.subtotal || 0),
            revenue: Number(item._sum.totalAmount || 0),
            invoices: item._count.id,
          };
        })
      );

      // المبيعات حسب العميل
      const salesByCustomer = await this.prisma.salesInvoice.groupBy({
        by: ['customerId'],
        where: {
          ...whereClause,
          customerId: { not: null },
        },
        _count: { id: true },
        _sum: {
          subtotal: true,
          totalAmount: true,
        },
        _max: {
          createdAt: true,
        },
      });

      const customersWithNames = await Promise.all(
        salesByCustomer.map(async (item) => {
          const customer = await this.prisma.customer.findUnique({
            where: { id: item.customerId! },
            select: { name: true },
          });

          return {
            customerId: item.customerId!,
            customerName: customer?.name || 'عميل نقدي',
            sales: Number(item._sum.subtotal || 0),
            revenue: Number(item._sum.totalAmount || 0),
            invoices: item._count.id,
            lastPurchase: item._max.createdAt!,
          };
        })
      );

      // المبيعات حسب طريقة الدفع
      const paymentsByMethod = await this.prisma.payment.groupBy({
        by: ['paymentMethod'],
        where: {
          salesInvoice: whereClause,
        },
        _count: { id: true },
        _sum: { amount: true },
      });

      const totalPayments = paymentsByMethod.reduce((sum, item) => sum + Number(item._sum.amount || 0), 0);

      const paymentsByMethodWithPercentage = paymentsByMethod.map(item => ({
        method: item.paymentMethod,
        amount: Number(item._sum.amount || 0),
        count: item._count.id,
        percentage: totalPayments > 0 ? (Number(item._sum.amount || 0) / totalPayments) * 100 : 0,
      }));

      const report: SalesReport = {
        summary: {
          totalSales: Number(salesSummary._sum.subtotal || 0),
          totalRevenue: totalSales,
          totalTax: Number(salesSummary._sum.taxAmount || 0),
          totalDiscount: Number(salesSummary._sum.discountAmount || 0),
          totalInvoices,
          averageOrderValue,
          topSellingProducts: topProductsWithDetails,
        },
        byPeriod: salesByPeriod.map(item => ({
          period: item.period,
          sales: Number(item.sales || 0),
          revenue: Number(item.revenue || 0),
          invoices: Number(item.invoices || 0),
        })),
        byBranch: branchesWithNames,
        byCustomer: customersWithNames.sort((a, b) => b.revenue - a.revenue).slice(0, 20),
        byPaymentMethod: paymentsByMethodWithPercentage,
      };

      await this.cacheService.set(cacheKey, report, { ttl: 1800 }); // 30 دقيقة

      return report;
    } catch (error) {
      this.logger.error('فشل في إنشاء تقرير المبيعات', error);
      throw error;
    }
  }

  /**
   * تقرير المخزون الشامل
   */
  async getInventoryReport(
    warehouseId?: string,
    categoryId?: string,
  ): Promise<InventoryReport> {
    try {
      this.logger.log(`إنشاء تقرير المخزون: ${warehouseId || 'all'} - ${categoryId || 'all'}`);

      const cacheKey = `inventory_report:${warehouseId || 'all'}:${categoryId || 'all'}`;

      const cachedReport = await this.cacheService.get<InventoryReport>(cacheKey);
      if (cachedReport) {
        return cachedReport;
      }

      // استعلامات البيانات الأساسية
      const stockWhere: any = {};
      if (warehouseId) {
        stockWhere.warehouseId = warehouseId;
      }

      // ملخص المخزون
      const stockItems = await this.prisma.stockItem.findMany({
        where: stockWhere,
        include: {
          productVariant: {
            include: {
              product: true,
            },
          },
          warehouse: true,
        },
      });

      // فلترة حسب الفئة إذا تم تحديدها
      const filteredStockItems = categoryId
        ? stockItems.filter(item => item.productVariant?.product?.categoryId === categoryId)
        : stockItems;

      // حساب الإحصائيات
      const totalItems = filteredStockItems.length;
      const totalValue = filteredStockItems.reduce((sum, item) => {
        const costPrice = item.productVariant?.costPrice || 0;
        return sum + (Number(item.quantity) * Number(costPrice));
      }, 0);

      const lowStockItems = filteredStockItems.filter(item => Number(item.quantity) <= Number(item.minStock)).length;
      const outOfStockItems = filteredStockItems.filter(item => Number(item.quantity) <= 0).length;
      const overStockItems = filteredStockItems.filter(item => Number(item.quantity) >= Number(item.maxStock)).length;

      // المخزون حسب المخزن
      const stockByWarehouse = await this.prisma.stockItem.groupBy({
        by: ['warehouseId'],
        where: stockWhere,
        _count: { id: true },
        _sum: { quantity: true },
      });

      const warehousesWithDetails = await Promise.all(
        stockByWarehouse.map(async (item) => {
          const warehouse = await this.prisma.warehouse.findUnique({
            where: { id: item.warehouseId },
            select: { name: true },
          });

          const warehouseItems = filteredStockItems.filter(stock => stock.warehouseId === item.warehouseId);
          const warehouseValue = warehouseItems.reduce((sum, stockItem) => {
            const costPrice = stockItem.productVariant?.costPrice || 0;
            return sum + (Number(stockItem.quantity) * Number(costPrice));
          }, 0);

          const lowStockCount = warehouseItems.filter(stockItem =>
            Number(stockItem.quantity) <= Number(stockItem.minStock)
          ).length;

          return {
            warehouseId: item.warehouseId,
            warehouseName: warehouse?.name || 'غير معروف',
            totalItems: item._count.id,
            totalValue: warehouseValue,
            lowStockItems: lowStockCount,
          };
        })
      );

      // تنبيهات المخزون المنخفض
      const lowStockAlerts = filteredStockItems
        .filter(item => Number(item.quantity) <= Number(item.minStock))
        .map(item => ({
          productVariantId: item.productVariantId,
          productName: item.productVariant?.product?.name || 'غير معروف',
          variantName: item.productVariant?.name || '',
          warehouseName: item.warehouse?.name || 'غير معروف',
          currentStock: Number(item.quantity),
          minStock: Number(item.minStock),
          reorderPoint: Number(item.minStock) * 0.8, // نقطة إعادة الطلب = 80% من الحد الأدنى
        }))
        .sort((a, b) => a.currentStock - b.currentStock)
        .slice(0, 50);

      // حركات المخزون الأخيرة
      const stockMovements = await this.prisma.stockMovement.findMany({
        where: stockWhere,
        include: {
          productVariant: {
            include: { product: true },
          },
          warehouse: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 100,
      });

      const movementsFormatted = stockMovements.map(movement => ({
        date: movement.createdAt,
        productName: `${movement.productVariant?.product?.name || 'غير معروف'} ${movement.productVariant?.name || ''}`.trim(),
        movementType: movement.movementType,
        quantity: Number(movement.quantity),
        warehouseName: movement.warehouse?.name || 'غير معروف',
        reason: movement.reason || '',
      }));

      // المنتجات الأكثر حركة
      const productMovements = await this.prisma.stockMovement.groupBy({
        by: ['productVariantId'],
        where: {
          ...stockWhere,
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // آخر 30 يوم
          },
        },
        _sum: { quantity: true },
      });

      const topMovingProducts = await Promise.all(
        productMovements
          .sort((a, b) => Math.abs(Number(b._sum.quantity || 0)) - Math.abs(Number(a._sum.quantity || 0)))
          .slice(0, 20)
          .map(async (item) => {
            const productVariant = await this.prisma.productVariant.findUnique({
              where: { id: item.productVariantId },
              include: { product: true },
            });

            const totalIn = Math.abs(Number(
              await this.prisma.stockMovement.aggregate({
                where: {
                  productVariantId: item.productVariantId,
                  warehouseId: warehouseId,
                  movementType: { in: ['in', 'purchase', 'adjustment_in'] },
                  createdAt: {
                    gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
                  },
                },
                _sum: { quantity: true },
              }).then(result => result._sum.quantity || 0)
            ));

            const totalOut = Math.abs(Number(
              await this.prisma.stockMovement.aggregate({
                where: {
                  productVariantId: item.productVariantId,
                  warehouseId: warehouseId,
                  movementType: { in: ['out', 'sale', 'adjustment_out'] },
                  createdAt: {
                    gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
                  },
                },
                _sum: { quantity: true },
              }).then(result => result._sum.quantity || 0)
            ));

            const currentStock = await this.prisma.stockItem.findFirst({
              where: {
                productVariantId: item.productVariantId,
                warehouseId: warehouseId,
              },
              select: { quantity: true },
            });

            return {
              productId: productVariant?.product.id || '',
              productName: productVariant?.product.name || 'غير معروف',
              totalIn,
              totalOut,
              netMovement: totalIn - totalOut,
              currentStock: Number(currentStock?.quantity || 0),
            };
          })
      );

      const report: InventoryReport = {
        summary: {
          totalItems,
          totalValue,
          lowStockItems,
          outOfStockItems,
          overStockItems,
        },
        byWarehouse: warehousesWithDetails,
        lowStockAlerts,
        stockMovements: movementsFormatted,
        topMovingProducts,
      };

      await this.cacheService.set(cacheKey, report, { ttl: 900 }); // 15 دقيقة

      return report;
    } catch (error) {
      this.logger.error('فشل في إنشاء تقرير المخزون', error);
      throw error;
    }
  }

  /**
   * التقرير المالي الشامل
   */
  async getFinancialReport(
    asOfDate: Date,
    includeCashFlow: boolean = false,
  ): Promise<FinancialReport> {
    try {
      this.logger.log(`إنشاء التقرير المالي حتى: ${asOfDate.toISOString()}`);

      const cacheKey = `financial_report:${asOfDate.toISOString()}:${includeCashFlow}`;

      const cachedReport = await this.cacheService.get<FinancialReport>(cacheKey);
      if (cachedReport) {
        return cachedReport;
      }

      // الميزانية العمومية
      const balanceSheet = await this.calculateBalanceSheet(asOfDate);
      const profitLoss = await this.calculateProfitLoss(asOfDate);

      let cashFlow;
      if (includeCashFlow) {
        cashFlow = await this.calculateCashFlow(asOfDate);
      }

      const report: FinancialReport = {
        balanceSheet,
        profitLoss,
        cashFlow: cashFlow || {
          operatingActivities: 0,
          investingActivities: 0,
          financingActivities: 0,
          netCashFlow: 0,
        },
      };

      await this.cacheService.set(cacheKey, report, { ttl: 3600 }); // ساعة واحدة

      return report;
    } catch (error) {
      this.logger.error('فشل في إنشاء التقرير المالي', error);
      throw error;
    }
  }

  /**
   * بيانات لوحة المؤشرات
   */
  async getDashboardData(branchId?: string): Promise<DashboardData> {
    try {
      this.logger.log(`إنشاء بيانات لوحة المؤشرات: ${branchId || 'all'}`);

      const cacheKey = `dashboard_data:${branchId || 'all'}`;

      const cachedData = await this.cacheService.get<DashboardData>(cacheKey);
      if (cachedData) {
        return cachedData;
      }

      const now = new Date();
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
      const twoMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, now.getDate());

      // استعلامات البيانات الأساسية
      const whereClause: any = {};
      if (branchId) {
        whereClause.branchId = branchId;
      }

      // الإحصائيات العامة
      const currentMonthSales = await this.prisma.salesInvoice.aggregate({
        where: {
          ...whereClause,
          createdAt: {
            gte: new Date(now.getFullYear(), now.getMonth(), 1),
          },
          status: { in: ['confirmed', 'paid'] },
        },
        _count: { id: true },
        _sum: { totalAmount: true },
      });

      const lastMonthSales = await this.prisma.salesInvoice.aggregate({
        where: {
          ...whereClause,
          createdAt: {
            gte: new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 1),
            lt: new Date(now.getFullYear(), now.getMonth(), 1),
          },
          status: { in: ['confirmed', 'paid'] },
        },
        _count: { id: true },
        _sum: { totalAmount: true },
      });

      const totalCustomers = await this.prisma.customer.count({
        where: branchId ? { /* TODO: إضافة ربط العملاء بالفروع */ } : {},
      });

      const lastMonthCustomers = await this.prisma.customer.count({
        where: {
          createdAt: {
            gte: new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 1),
            lt: new Date(now.getFullYear(), now.getMonth(), 1),
          },
        },
      });

      // حساب التغييرات
      const currentRevenue = Number(currentMonthSales._sum.totalAmount || 0);
      const lastRevenue = Number(lastMonthSales._sum.totalAmount || 0);
      const revenueChange = lastRevenue > 0 ? ((currentRevenue - lastRevenue) / lastRevenue) * 100 : 0;

      const currentOrders = currentMonthSales._count.id;
      const lastOrders = lastMonthSales._count.id;
      const ordersChange = lastOrders > 0 ? ((currentOrders - lastOrders) / lastOrders) * 100 : 0;

      const customersChange = lastMonthCustomers > 0 ? ((totalCustomers - lastMonthCustomers) / lastMonthCustomers) * 100 : 0;

      const currentAOV = currentOrders > 0 ? currentRevenue / currentOrders : 0;
      const lastAOV = lastOrders > 0 ? lastRevenue / lastOrders : 0;
      const aovChange = lastAOV > 0 ? ((currentAOV - lastAOV) / lastAOV) * 100 : 0;

      // الإيرادات حسب الفترة (آخر 12 شهر)
      const revenueByPeriod: Array<{
        period: string;
        revenue: number;
        orders: number;
      }> = [];
      for (let i = 11; i >= 0; i--) {
        const periodStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const periodEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);

        const periodSales = await this.prisma.salesInvoice.aggregate({
          where: {
            ...whereClause,
            createdAt: {
              gte: periodStart,
              lt: periodEnd,
            },
            status: { in: ['confirmed', 'paid'] },
          },
          _count: { id: true },
          _sum: { totalAmount: true },
        });

        revenueByPeriod.push({
          period: periodStart.toLocaleDateString('ar-SA', { year: 'numeric', month: 'short' }),
          revenue: Number(periodSales._sum.totalAmount || 0),
          orders: periodSales._count.id,
        });
      }

      // المبيعات حسب الفئة
      const salesByCategory = await this.prisma.$queryRaw<Array<{
        category: string;
        revenue: number;
      }>>`
        SELECT
          COALESCE(c.name, 'غير مصنف') as category,
          SUM(si.total_amount) as revenue
        FROM sales_invoices si
        LEFT JOIN sales_invoice_lines sil ON si.id = sil.sales_invoice_id
        LEFT JOIN product_variants pv ON sil.product_variant_id = pv.id
        LEFT JOIN products p ON pv.product_id = p.id
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE si.created_at >= ${new Date(now.getFullYear(), now.getMonth() - 3, 1)}
          AND si.status IN ('confirmed', 'paid')
          ${branchId ? `AND si.branch_id = '${branchId}'` : ''}
        GROUP BY c.name
        ORDER BY revenue DESC
        LIMIT 10
      `;

      const totalCategoryRevenue = salesByCategory.reduce((sum, item) => sum + Number(item.revenue || 0), 0);

      const salesByCategoryWithPercentage = salesByCategory.map(item => ({
        category: item.category || 'غير مصنف',
        revenue: Number(item.revenue || 0),
        percentage: totalCategoryRevenue > 0 ? (Number(item.revenue || 0) / totalCategoryRevenue) * 100 : 0,
      }));

      // أفضل المنتجات
      const topProducts = await this.prisma.salesInvoiceLine.groupBy({
        by: ['productVariantId'],
        where: {
          salesInvoice: {
            ...whereClause,
            createdAt: {
              gte: new Date(now.getFullYear(), now.getMonth() - 1, 1),
            },
            status: { in: ['confirmed', 'paid'] },
          },
        },
        _sum: {
          quantity: true,
          lineTotal: true,
        },
        orderBy: {
          _sum: {
            lineTotal: 'desc',
          },
        },
        take: 5,
      });

      const topProductsWithDetails = await Promise.all(
        topProducts.map(async (item) => {
          const productVariant = await this.prisma.productVariant.findUnique({
            where: { id: item.productVariantId },
            include: { product: true },
          });

          return {
            productId: productVariant?.product.id || '',
            productName: productVariant?.product.name || 'غير معروف',
            revenue: Number(item._sum.lineTotal || 0),
            quantity: Number(item._sum.quantity || 0),
          };
        })
      );

      // نمو العملاء
      const customerGrowth: Array<{
        period: string;
        customers: number;
      }> = [];
      for (let i = 11; i >= 0; i--) {
        const periodEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
        const periodStart = new Date(now.getFullYear(), now.getMonth() - i, 1);

        const customersCount = await this.prisma.customer.count({
          where: {
            createdAt: {
              lt: periodEnd,
            },
          },
        });

        customerGrowth.push({
          period: periodStart.toLocaleDateString('ar-SA', { year: 'numeric', month: 'short' }),
          customers: customersCount,
        });
      }

      // التنبيهات
      const lowStockItems = await this.prisma.stockItem.count({
        where: {
          quantity: {
            lte: this.prisma.stockItem.fields.minStock,
          },
        },
      });

      // الأنشطة الأخيرة
      const recentSales = await this.prisma.salesInvoice.findMany({
        where: {
          ...whereClause,
          status: { in: ['confirmed', 'paid'] },
        },
        include: {
          customer: { select: { name: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      });

      const recentActivity = recentSales.map(sale => ({
        type: 'sale' as const,
        description: `مبيعات للعميل ${sale.customer?.name || 'عميل نقدي'}`,
        amount: Number(sale.totalAmount),
        date: sale.createdAt,
        reference: `فاتورة رقم ${sale.invoiceNumber}`,
      }));

      const dashboardData: DashboardData = {
        overview: {
          totalRevenue: currentRevenue,
          totalRevenueChange: revenueChange,
          totalOrders: currentOrders,
          totalOrdersChange: ordersChange,
          totalCustomers,
          totalCustomersChange: customersChange,
          averageOrderValue: currentAOV,
          averageOrderValueChange: aovChange,
        },
        charts: {
          revenueByPeriod,
          salesByCategory: salesByCategoryWithPercentage,
          topProducts: topProductsWithDetails,
          customerGrowth,
        },
        alerts: {
          lowStockItems,
          overduePayments: 0, // TODO: تنفيذ لاحقاً
          pendingOrders: 0, // TODO: تنفيذ لاحقاً
          expiringProducts: 0, // TODO: تنفيذ لاحقاً
        },
        recentActivity,
      };

      await this.cacheService.set(cacheKey, dashboardData, { ttl: 300 }); // 5 دقائق

      return dashboardData;
    } catch (error) {
      this.logger.error('فشل في إنشاء بيانات لوحة المؤشرات', error);
      throw error;
    }
  }

  /**
   * تصدير التقرير كملف Excel
   */
  async exportReportToExcel(reportType: string, filters: any): Promise<Buffer> {
    try {
      this.logger.log(`تصدير تقرير ${reportType} إلى Excel`);

      // TODO: تنفيذ تصدير Excel باستخدام مكتبة مثل exceljs
      throw new BadRequestException('ميزة التصدير إلى Excel ستكون متاحة قريباً');
    } catch (error) {
      this.logger.error(`فشل في تصدير تقرير ${reportType}`, error);
      throw error;
    }
  }

  /**
   * تصدير التقرير كملف PDF
   */
  async exportReportToPDF(reportType: string, filters: any): Promise<Buffer> {
    try {
      this.logger.log(`تصدير تقرير ${reportType} إلى PDF`);

      // TODO: تنفيذ تصدير PDF باستخدام مكتبة مثل puppeteer أو pdfkit
      throw new BadRequestException('ميزة التصدير إلى PDF ستكون متاحة قريباً');
    } catch (error) {
      this.logger.error(`فشل في تصدير تقرير ${reportType}`, error);
      throw error;
    }
  }

  // ========== HELPER METHODS ==========

  /**
   * حساب الميزانية العمومية
   */
  private async calculateBalanceSheet(asOfDate: Date): Promise<FinancialReport['balanceSheet']> {
    // TODO: تنفيذ حساب الميزانية العمومية بناءً على أرصدة الحسابات
    return {
      assets: {
        currentAssets: 0,
        fixedAssets: 0,
        totalAssets: 0,
      },
      liabilities: {
        currentLiabilities: 0,
        longTermLiabilities: 0,
        totalLiabilities: 0,
      },
      equity: {
        capital: 0,
        retainedEarnings: 0,
        totalEquity: 0,
      },
      totalLiabilitiesAndEquity: 0,
    };
  }

  /**
   * حساب قائمة الدخل
   */
  private async calculateProfitLoss(asOfDate: Date): Promise<FinancialReport['profitLoss']> {
    // TODO: تنفيذ حساب قائمة الدخل بناءً على حركة الحسابات
    return {
      revenue: {
        salesRevenue: 0,
        otherIncome: 0,
        totalRevenue: 0,
      },
      expenses: {
        costOfGoodsSold: 0,
        operatingExpenses: 0,
        totalExpenses: 0,
      },
      netProfit: 0,
      grossMargin: 0,
      netMargin: 0,
    };
  }

  /**
   * حساب التدفق النقدي
   */
  private async calculateCashFlow(asOfDate: Date): Promise<FinancialReport['cashFlow']> {
    // TODO: تنفيذ حساب التدفق النقدي
    return {
      operatingActivities: 0,
      investingActivities: 0,
      financingActivities: 0,
      netCashFlow: 0,
    };
  }

  /**
   * إبطال كاش التقارير
   */
  private async invalidateReportsCache(): Promise<void> {
    await this.cacheService.delete(this.reportsCacheKey);

    const reportKeys = await this.cacheService.getKeys(`${this.reportsCacheKey}:*`);
    for (const key of reportKeys) {
      await this.cacheService.delete(key);
    }
  }
}
