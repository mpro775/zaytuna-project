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
var ReportingService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportingService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../shared/database/prisma.service");
const cache_service_1 = require("../../shared/cache/cache.service");
let ReportingService = ReportingService_1 = class ReportingService {
    prisma;
    cacheService;
    logger = new common_1.Logger(ReportingService_1.name);
    reportsCacheKey = 'reports';
    constructor(prisma, cacheService) {
        this.prisma = prisma;
        this.cacheService = cacheService;
    }
    async getSalesReport(startDate, endDate, branchId, customerId) {
        try {
            this.logger.log(`إنشاء تقرير المبيعات: ${startDate.toISOString()} - ${endDate.toISOString()}`);
            const cacheKey = `sales_report:${startDate.toISOString()}:${endDate.toISOString()}:${branchId || 'all'}:${customerId || 'all'}`;
            const cachedReport = await this.cacheService.get(cacheKey);
            if (cachedReport) {
                return cachedReport;
            }
            const whereClause = {
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
            const topProductsWithDetails = await Promise.all(topSellingProducts.map(async (item) => {
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
            }));
            const salesByPeriod = await this.prisma.$queryRaw `
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
            const salesByBranch = await this.prisma.salesInvoice.groupBy({
                by: ['branchId'],
                where: whereClause,
                _count: { id: true },
                _sum: {
                    subtotal: true,
                    totalAmount: true,
                },
            });
            const branchesWithNames = await Promise.all(salesByBranch.map(async (item) => {
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
            }));
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
            const customersWithNames = await Promise.all(salesByCustomer.map(async (item) => {
                const customer = await this.prisma.customer.findUnique({
                    where: { id: item.customerId },
                    select: { name: true },
                });
                return {
                    customerId: item.customerId,
                    customerName: customer?.name || 'عميل نقدي',
                    sales: Number(item._sum.subtotal || 0),
                    revenue: Number(item._sum.totalAmount || 0),
                    invoices: item._count.id,
                    lastPurchase: item._max.createdAt,
                };
            }));
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
            const report = {
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
            await this.cacheService.set(cacheKey, report, { ttl: 1800 });
            return report;
        }
        catch (error) {
            this.logger.error('فشل في إنشاء تقرير المبيعات', error);
            throw error;
        }
    }
    async getInventoryReport(warehouseId, categoryId) {
        try {
            this.logger.log(`إنشاء تقرير المخزون: ${warehouseId || 'all'} - ${categoryId || 'all'}`);
            const cacheKey = `inventory_report:${warehouseId || 'all'}:${categoryId || 'all'}`;
            const cachedReport = await this.cacheService.get(cacheKey);
            if (cachedReport) {
                return cachedReport;
            }
            const stockWhere = {};
            if (warehouseId) {
                stockWhere.warehouseId = warehouseId;
            }
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
            const filteredStockItems = categoryId
                ? stockItems.filter(item => item.productVariant?.product?.categoryId === categoryId)
                : stockItems;
            const totalItems = filteredStockItems.length;
            const totalValue = filteredStockItems.reduce((sum, item) => {
                const costPrice = item.productVariant?.costPrice || 0;
                return sum + (Number(item.quantity) * Number(costPrice));
            }, 0);
            const lowStockItems = filteredStockItems.filter(item => Number(item.quantity) <= Number(item.minStock)).length;
            const outOfStockItems = filteredStockItems.filter(item => Number(item.quantity) <= 0).length;
            const overStockItems = filteredStockItems.filter(item => Number(item.quantity) >= Number(item.maxStock)).length;
            const stockByWarehouse = await this.prisma.stockItem.groupBy({
                by: ['warehouseId'],
                where: stockWhere,
                _count: { id: true },
                _sum: { quantity: true },
            });
            const warehousesWithDetails = await Promise.all(stockByWarehouse.map(async (item) => {
                const warehouse = await this.prisma.warehouse.findUnique({
                    where: { id: item.warehouseId },
                    select: { name: true },
                });
                const warehouseItems = filteredStockItems.filter(stock => stock.warehouseId === item.warehouseId);
                const warehouseValue = warehouseItems.reduce((sum, stockItem) => {
                    const costPrice = stockItem.productVariant?.costPrice || 0;
                    return sum + (Number(stockItem.quantity) * Number(costPrice));
                }, 0);
                const lowStockCount = warehouseItems.filter(stockItem => Number(stockItem.quantity) <= Number(stockItem.minStock)).length;
                return {
                    warehouseId: item.warehouseId,
                    warehouseName: warehouse?.name || 'غير معروف',
                    totalItems: item._count.id,
                    totalValue: warehouseValue,
                    lowStockItems: lowStockCount,
                };
            }));
            const lowStockAlerts = filteredStockItems
                .filter(item => Number(item.quantity) <= Number(item.minStock))
                .map(item => ({
                productVariantId: item.productVariantId,
                productName: item.productVariant?.product?.name || 'غير معروف',
                variantName: item.productVariant?.name || '',
                warehouseName: item.warehouse?.name || 'غير معروف',
                currentStock: Number(item.quantity),
                minStock: Number(item.minStock),
                reorderPoint: Number(item.minStock) * 0.8,
            }))
                .sort((a, b) => a.currentStock - b.currentStock)
                .slice(0, 50);
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
            const productMovements = await this.prisma.stockMovement.groupBy({
                by: ['productVariantId'],
                where: {
                    ...stockWhere,
                    createdAt: {
                        gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
                    },
                },
                _sum: { quantity: true },
            });
            const topMovingProducts = await Promise.all(productMovements
                .sort((a, b) => Math.abs(Number(b._sum.quantity || 0)) - Math.abs(Number(a._sum.quantity || 0)))
                .slice(0, 20)
                .map(async (item) => {
                const productVariant = await this.prisma.productVariant.findUnique({
                    where: { id: item.productVariantId },
                    include: { product: true },
                });
                const totalIn = Math.abs(Number(await this.prisma.stockMovement.aggregate({
                    where: {
                        productVariantId: item.productVariantId,
                        warehouseId: warehouseId,
                        movementType: { in: ['in', 'purchase', 'adjustment_in'] },
                        createdAt: {
                            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
                        },
                    },
                    _sum: { quantity: true },
                }).then(result => result._sum.quantity || 0)));
                const totalOut = Math.abs(Number(await this.prisma.stockMovement.aggregate({
                    where: {
                        productVariantId: item.productVariantId,
                        warehouseId: warehouseId,
                        movementType: { in: ['out', 'sale', 'adjustment_out'] },
                        createdAt: {
                            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
                        },
                    },
                    _sum: { quantity: true },
                }).then(result => result._sum.quantity || 0)));
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
            }));
            const report = {
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
            await this.cacheService.set(cacheKey, report, { ttl: 900 });
            return report;
        }
        catch (error) {
            this.logger.error('فشل في إنشاء تقرير المخزون', error);
            throw error;
        }
    }
    async getFinancialReport(asOfDate, includeCashFlow = false) {
        try {
            this.logger.log(`إنشاء التقرير المالي حتى: ${asOfDate.toISOString()}`);
            const cacheKey = `financial_report:${asOfDate.toISOString()}:${includeCashFlow}`;
            const cachedReport = await this.cacheService.get(cacheKey);
            if (cachedReport) {
                return cachedReport;
            }
            const balanceSheet = await this.calculateBalanceSheet(asOfDate);
            const profitLoss = await this.calculateProfitLoss(asOfDate);
            let cashFlow;
            if (includeCashFlow) {
                cashFlow = await this.calculateCashFlow(asOfDate);
            }
            const report = {
                balanceSheet,
                profitLoss,
                cashFlow: cashFlow || {
                    operatingActivities: 0,
                    investingActivities: 0,
                    financingActivities: 0,
                    netCashFlow: 0,
                },
            };
            await this.cacheService.set(cacheKey, report, { ttl: 3600 });
            return report;
        }
        catch (error) {
            this.logger.error('فشل في إنشاء التقرير المالي', error);
            throw error;
        }
    }
    async getDashboardData(branchId) {
        try {
            this.logger.log(`إنشاء بيانات لوحة المؤشرات: ${branchId || 'all'}`);
            const cacheKey = `dashboard_data:${branchId || 'all'}`;
            const cachedData = await this.cacheService.get(cacheKey);
            if (cachedData) {
                return cachedData;
            }
            const now = new Date();
            const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
            const twoMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, now.getDate());
            const whereClause = {};
            if (branchId) {
                whereClause.branchId = branchId;
            }
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
                where: branchId ? {} : {},
            });
            const lastMonthCustomers = await this.prisma.customer.count({
                where: {
                    createdAt: {
                        gte: new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 1),
                        lt: new Date(now.getFullYear(), now.getMonth(), 1),
                    },
                },
            });
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
            const revenueByPeriod = [];
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
            const salesByCategory = await this.prisma.$queryRaw `
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
            const topProductsWithDetails = await Promise.all(topProducts.map(async (item) => {
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
            }));
            const customerGrowth = [];
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
            const lowStockItems = await this.prisma.stockItem.count({
                where: {
                    quantity: {
                        lte: this.prisma.stockItem.fields.minStock,
                    },
                },
            });
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
                type: 'sale',
                description: `مبيعات للعميل ${sale.customer?.name || 'عميل نقدي'}`,
                amount: Number(sale.totalAmount),
                date: sale.createdAt,
                reference: `فاتورة رقم ${sale.invoiceNumber}`,
            }));
            const dashboardData = {
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
                    overduePayments: 0,
                    pendingOrders: 0,
                    expiringProducts: 0,
                },
                recentActivity,
            };
            await this.cacheService.set(cacheKey, dashboardData, { ttl: 300 });
            return dashboardData;
        }
        catch (error) {
            this.logger.error('فشل في إنشاء بيانات لوحة المؤشرات', error);
            throw error;
        }
    }
    async exportReportToExcel(reportType, filters) {
        try {
            this.logger.log(`تصدير تقرير ${reportType} إلى Excel`);
            throw new common_1.BadRequestException('ميزة التصدير إلى Excel ستكون متاحة قريباً');
        }
        catch (error) {
            this.logger.error(`فشل في تصدير تقرير ${reportType}`, error);
            throw error;
        }
    }
    async exportReportToPDF(reportType, filters) {
        try {
            this.logger.log(`تصدير تقرير ${reportType} إلى PDF`);
            throw new common_1.BadRequestException('ميزة التصدير إلى PDF ستكون متاحة قريباً');
        }
        catch (error) {
            this.logger.error(`فشل في تصدير تقرير ${reportType}`, error);
            throw error;
        }
    }
    async calculateBalanceSheet(asOfDate) {
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
    async calculateProfitLoss(asOfDate) {
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
    async calculateCashFlow(asOfDate) {
        return {
            operatingActivities: 0,
            investingActivities: 0,
            financingActivities: 0,
            netCashFlow: 0,
        };
    }
    async invalidateReportsCache() {
        await this.cacheService.delete(this.reportsCacheKey);
        const reportKeys = await this.cacheService.getKeys(`${this.reportsCacheKey}:*`);
        for (const key of reportKeys) {
            await this.cacheService.delete(key);
        }
    }
};
exports.ReportingService = ReportingService;
exports.ReportingService = ReportingService = ReportingService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        cache_service_1.CacheService])
], ReportingService);
//# sourceMappingURL=reporting.service.js.map