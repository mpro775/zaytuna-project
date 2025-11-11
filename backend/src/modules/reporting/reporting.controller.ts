import {
  Controller,
  Get,
  Query,
  Res,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import type { Response } from 'express';
import { ReportingService } from './reporting.service';
import { Permissions } from '../../common/decorators/permissions.decorator';

@Controller('reporting')
export class ReportingController {
  constructor(private readonly reportingService: ReportingService) {}

  // ========== SALES REPORTS ==========

  /**
   * تقرير المبيعات الشامل
   */
  @Get('sales')
  @Permissions('reporting.sales.read')
  getSalesReport(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('branchId') branchId?: string,
    @Query('customerId') customerId?: string,
  ) {
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new Error('تاريخ البداية أو النهاية غير صحيح');
    }

    return this.reportingService.getSalesReport(start, end, branchId, customerId);
  }

  /**
   * تقرير المبيعات الشهري
   */
  @Get('sales/monthly')
  @Permissions('reporting.sales.read')
  getMonthlySalesReport(
    @Query('year') year?: number,
    @Query('month') month?: number,
    @Query('branchId') branchId?: string,
  ) {
    const currentYear = year || new Date().getFullYear();
    const currentMonth = month || new Date().getMonth();

    const startDate = new Date(currentYear, currentMonth, 1);
    const endDate = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59);

    return this.reportingService.getSalesReport(startDate, endDate, branchId);
  }

  /**
   * تقرير المبيعات اليومي
   */
  @Get('sales/daily')
  @Permissions('reporting.sales.read')
  getDailySalesReport(
    @Query('date') date?: string,
    @Query('branchId') branchId?: string,
  ) {
    const reportDate = date ? new Date(date) : new Date();
    const startDate = new Date(reportDate.getFullYear(), reportDate.getMonth(), reportDate.getDate());
    const endDate = new Date(reportDate.getFullYear(), reportDate.getMonth(), reportDate.getDate(), 23, 59, 59);

    return this.reportingService.getSalesReport(startDate, endDate, branchId);
  }

  // ========== INVENTORY REPORTS ==========

  /**
   * تقرير المخزون الشامل
   */
  @Get('inventory')
  @Permissions('reporting.inventory.read')
  getInventoryReport(
    @Query('warehouseId') warehouseId?: string,
    @Query('categoryId') categoryId?: string,
  ) {
    return this.reportingService.getInventoryReport(warehouseId, categoryId);
  }

  /**
   * تقرير المخزون المنخفض
   */
  @Get('inventory/low-stock')
  @Permissions('reporting.inventory.read')
  getLowStockReport(@Query('warehouseId') warehouseId?: string) {
    return this.reportingService.getInventoryReport(warehouseId).then(report => ({
      lowStockAlerts: report.lowStockAlerts,
      summary: {
        totalLowStockItems: report.summary.lowStockItems,
        totalOutOfStockItems: report.summary.outOfStockItems,
      },
    }));
  }

  /**
   * تقرير حركات المخزون
   */
  @Get('inventory/movements')
  @Permissions('reporting.inventory.read')
  getStockMovementsReport(
    @Query('warehouseId') warehouseId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    // TODO: تنفيذ فلترة حسب التاريخ
    return this.reportingService.getInventoryReport(warehouseId).then(report => ({
      stockMovements: report.stockMovements,
      summary: report.summary,
    }));
  }

  // ========== FINANCIAL REPORTS ==========

  /**
   * الميزانية العمومية
   */
  @Get('financial/balance-sheet')
  @Permissions('reporting.financial.read')
  getBalanceSheetReport(@Query('asOfDate') asOfDate?: string) {
    const date = asOfDate ? new Date(asOfDate) : new Date();
    return this.reportingService.getFinancialReport(date).then(report => report.balanceSheet);
  }

  /**
   * قائمة الدخل
   */
  @Get('financial/profit-loss')
  @Permissions('reporting.financial.read')
  getProfitLossReport(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new Error('تاريخ البداية أو النهاية غير صحيح');
    }

    return this.reportingService.getFinancialReport(end, false).then(report => report.profitLoss);
  }

  /**
   * التدفق النقدي
   */
  @Get('financial/cash-flow')
  @Permissions('reporting.financial.read')
  getCashFlowReport(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new Error('تاريخ البداية أو النهاية غير صحيح');
    }

    return this.reportingService.getFinancialReport(end, true).then(report => report.cashFlow);
  }

  /**
   * التقرير المالي الشامل
   */
  @Get('financial/comprehensive')
  @Permissions('reporting.financial.read')
  getComprehensiveFinancialReport(@Query('asOfDate') asOfDate?: string) {
    const date = asOfDate ? new Date(asOfDate) : new Date();
    return this.reportingService.getFinancialReport(date, true);
  }

  // ========== DASHBOARD DATA ==========

  /**
   * بيانات لوحة المؤشرات الرئيسية
   */
  @Get('dashboard/overview')
  @Permissions('reporting.dashboard.read')
  getDashboardOverview(@Query('branchId') branchId?: string) {
    return this.reportingService.getDashboardData(branchId);
  }

  /**
   * بيانات المبيعات للوحة المؤشرات
   */
  @Get('dashboard/sales')
  @Permissions('reporting.dashboard.read')
  getDashboardSalesData(
    @Query('period') period: 'daily' | 'weekly' | 'monthly' = 'monthly',
    @Query('branchId') branchId?: string,
  ) {
    // حساب التواريخ حسب الفترة
    const now = new Date();
    let startDate: Date;
    let endDate: Date = now;

    switch (period) {
      case 'daily':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'weekly':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'monthly':
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
    }

    return this.reportingService.getSalesReport(startDate, endDate, branchId);
  }

  /**
   * بيانات المخزون للوحة المؤشرات
   */
  @Get('dashboard/inventory')
  @Permissions('reporting.dashboard.read')
  getDashboardInventoryData(@Query('warehouseId') warehouseId?: string) {
    return this.reportingService.getInventoryReport(warehouseId).then(report => ({
      summary: report.summary,
      lowStockAlerts: report.lowStockAlerts.slice(0, 5), // أول 5 تنبيهات فقط
      topMovingProducts: report.topMovingProducts.slice(0, 5), // أول 5 منتجات فقط
    }));
  }

  // ========== EXPORT FUNCTIONALITY ==========

  /**
   * تصدير تقرير المبيعات إلى Excel
   */
  @Get('sales/export/excel')
  @Permissions('reporting.export')
  async exportSalesReportToExcel(
    @Res() res: Response,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('branchId') branchId?: string,
  ) {
    try {
      const start = new Date(startDate);
      const end = new Date(endDate);

      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        throw new Error('تاريخ البداية أو النهاية غير صحيح');
      }

      const filters = { startDate: start, endDate: end, branchId };
      const excelBuffer = await this.reportingService.exportReportToExcel('sales', filters);

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=sales-report-${startDate}-to-${endDate}.xlsx`);
      res.send(excelBuffer);
    } catch (error) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        message: 'فشل في تصدير تقرير المبيعات',
        error: error.message,
      });
    }
  }

  /**
   * تصدير تقرير المخزون إلى Excel
   */
  @Get('inventory/export/excel')
  @Permissions('reporting.export')
  async exportInventoryReportToExcel(
    @Res() res: Response,
    @Query('warehouseId') warehouseId?: string,
  ) {
    try {
      const filters = { warehouseId };
      const excelBuffer = await this.reportingService.exportReportToExcel('inventory', filters);

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=inventory-report-${new Date().toISOString().split('T')[0]}.xlsx`);
      res.send(excelBuffer);
    } catch (error) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        message: 'فشل في تصدير تقرير المخزون',
        error: error.message,
      });
    }
  }

  /**
   * تصدير تقرير المبيعات إلى PDF
   */
  @Get('sales/export/pdf')
  @Permissions('reporting.export')
  async exportSalesReportToPDF(
    @Res() res: Response,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('branchId') branchId?: string,
  ) {
    try {
      const start = new Date(startDate);
      const end = new Date(endDate);

      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        throw new Error('تاريخ البداية أو النهاية غير صحيح');
      }

      const filters = { startDate: start, endDate: end, branchId };
      const pdfBuffer = await this.reportingService.exportReportToPDF('sales', filters);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=sales-report-${startDate}-to-${endDate}.pdf`);
      res.send(pdfBuffer);
    } catch (error) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        message: 'فشل في تصدير تقرير المبيعات',
        error: error.message,
      });
    }
  }

  /**
   * تصدير تقرير المخزون إلى PDF
   */
  @Get('inventory/export/pdf')
  @Permissions('reporting.export')
  async exportInventoryReportToPDF(
    @Res() res: Response,
    @Query('warehouseId') warehouseId?: string,
  ) {
    try {
      const filters = { warehouseId };
      const pdfBuffer = await this.reportingService.exportReportToPDF('inventory', filters);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=inventory-report-${new Date().toISOString().split('T')[0]}.pdf`);
      res.send(pdfBuffer);
    } catch (error) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        message: 'فشل في تصدير تقرير المخزون',
        error: error.message,
      });
    }
  }

  // ========== SCHEDULED REPORTS ==========

  /**
   * إنشاء تقرير مجدول (للاستخدام الداخلي)
   */
  @Get('scheduled/:reportType')
  @Permissions('reporting.scheduled')
  async generateScheduledReport(
    @Query('frequency') frequency: 'daily' | 'weekly' | 'monthly',
    @Query('branchId') branchId?: string,
  ) {
    const now = new Date();

    // حساب التواريخ حسب التكرار
    let startDate: Date;
    let endDate: Date = now;

    switch (frequency) {
      case 'daily':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'weekly':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'monthly':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
    }

    // TODO: حفظ التقرير أو إرساله بالبريد الإلكتروني
    return {
      message: `تم إنشاء التقرير المجدول (${frequency})`,
      period: `${startDate.toISOString()} - ${endDate.toISOString()}`,
    };
  }

  // ========== CUSTOM REPORTS ==========

  /**
   * تقرير مخصص (للاستخدام المتقدم)
   */
  @Get('custom')
  @Permissions('reporting.custom')
  getCustomReport(
    @Query('reportType') reportType: string,
    @Query('filters') filters: string,
    @Query('groupBy') groupBy?: string,
    @Query('sortBy') sortBy?: string,
  ) {
    // TODO: تنفيذ تقارير مخصصة مع فلاتر متقدمة
    return {
      message: 'ميزة التقارير المخصصة ستكون متاحة قريباً',
      requestedType: reportType,
      filters: JSON.parse(filters || '{}'),
    };
  }

  // ========== ANALYTICS ENDPOINTS ==========

  /**
   * تحليلات الأداء
   */
  @Get('analytics/performance')
  @Permissions('reporting.analytics')
  getPerformanceAnalytics(
    @Query('metric') metric: 'sales' | 'inventory' | 'customers' | 'financial',
    @Query('period') period: 'month' | 'quarter' | 'year' = 'month',
    @Query('branchId') branchId?: string,
  ) {
    // TODO: تنفيذ تحليلات الأداء المتقدمة
    return {
      message: 'تحليلات الأداء ستكون متاحة قريباً',
      metric,
      period,
      branchId,
    };
  }

  /**
   * مقارنات الفترات
   */
  @Get('analytics/comparison')
  @Permissions('reporting.analytics')
  getPeriodComparison(
    @Query('currentStart') currentStart: string,
    @Query('currentEnd') currentEnd: string,
    @Query('previousStart') previousStart: string,
    @Query('previousEnd') previousEnd: string,
    @Query('branchId') branchId?: string,
  ) {
    // TODO: تنفيذ مقارنات الفترات
    return {
      message: 'مقارنات الفترات ستكون متاحة قريباً',
      currentPeriod: `${currentStart} - ${currentEnd}`,
      previousPeriod: `${previousStart} - ${previousEnd}`,
      branchId,
    };
  }
}
