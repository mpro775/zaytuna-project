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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportingController = void 0;
const common_1 = require("@nestjs/common");
const reporting_service_1 = require("./reporting.service");
const permissions_decorator_1 = require("../../common/decorators/permissions.decorator");
let ReportingController = class ReportingController {
    reportingService;
    constructor(reportingService) {
        this.reportingService = reportingService;
    }
    getSalesReport(startDate, endDate, branchId, customerId) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            throw new Error('تاريخ البداية أو النهاية غير صحيح');
        }
        return this.reportingService.getSalesReport(start, end, branchId, customerId);
    }
    getMonthlySalesReport(year, month, branchId) {
        const currentYear = year || new Date().getFullYear();
        const currentMonth = month || new Date().getMonth();
        const startDate = new Date(currentYear, currentMonth, 1);
        const endDate = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59);
        return this.reportingService.getSalesReport(startDate, endDate, branchId);
    }
    getDailySalesReport(date, branchId) {
        const reportDate = date ? new Date(date) : new Date();
        const startDate = new Date(reportDate.getFullYear(), reportDate.getMonth(), reportDate.getDate());
        const endDate = new Date(reportDate.getFullYear(), reportDate.getMonth(), reportDate.getDate(), 23, 59, 59);
        return this.reportingService.getSalesReport(startDate, endDate, branchId);
    }
    getInventoryReport(warehouseId, categoryId) {
        return this.reportingService.getInventoryReport(warehouseId, categoryId);
    }
    getLowStockReport(warehouseId) {
        return this.reportingService.getInventoryReport(warehouseId).then(report => ({
            lowStockAlerts: report.lowStockAlerts,
            summary: {
                totalLowStockItems: report.summary.lowStockItems,
                totalOutOfStockItems: report.summary.outOfStockItems,
            },
        }));
    }
    getStockMovementsReport(warehouseId, startDate, endDate) {
        return this.reportingService.getInventoryReport(warehouseId).then(report => ({
            stockMovements: report.stockMovements,
            summary: report.summary,
        }));
    }
    getBalanceSheetReport(asOfDate) {
        const date = asOfDate ? new Date(asOfDate) : new Date();
        return this.reportingService.getFinancialReport(date).then(report => report.balanceSheet);
    }
    getProfitLossReport(startDate, endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            throw new Error('تاريخ البداية أو النهاية غير صحيح');
        }
        return this.reportingService.getFinancialReport(end, false).then(report => report.profitLoss);
    }
    getCashFlowReport(startDate, endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            throw new Error('تاريخ البداية أو النهاية غير صحيح');
        }
        return this.reportingService.getFinancialReport(end, true).then(report => report.cashFlow);
    }
    getComprehensiveFinancialReport(asOfDate) {
        const date = asOfDate ? new Date(asOfDate) : new Date();
        return this.reportingService.getFinancialReport(date, true);
    }
    getDashboardOverview(branchId) {
        return this.reportingService.getDashboardData(branchId);
    }
    getDashboardSalesData(period = 'monthly', branchId) {
        const now = new Date();
        let startDate;
        let endDate = now;
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
    getDashboardInventoryData(warehouseId) {
        return this.reportingService.getInventoryReport(warehouseId).then(report => ({
            summary: report.summary,
            lowStockAlerts: report.lowStockAlerts.slice(0, 5),
            topMovingProducts: report.topMovingProducts.slice(0, 5),
        }));
    }
    async exportSalesReportToExcel(res, startDate, endDate, branchId) {
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
        }
        catch (error) {
            res.status(common_1.HttpStatus.INTERNAL_SERVER_ERROR).json({
                message: 'فشل في تصدير تقرير المبيعات',
                error: error.message,
            });
        }
    }
    async exportInventoryReportToExcel(res, warehouseId) {
        try {
            const filters = { warehouseId };
            const excelBuffer = await this.reportingService.exportReportToExcel('inventory', filters);
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', `attachment; filename=inventory-report-${new Date().toISOString().split('T')[0]}.xlsx`);
            res.send(excelBuffer);
        }
        catch (error) {
            res.status(common_1.HttpStatus.INTERNAL_SERVER_ERROR).json({
                message: 'فشل في تصدير تقرير المخزون',
                error: error.message,
            });
        }
    }
    async exportSalesReportToPDF(res, startDate, endDate, branchId) {
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
        }
        catch (error) {
            res.status(common_1.HttpStatus.INTERNAL_SERVER_ERROR).json({
                message: 'فشل في تصدير تقرير المبيعات',
                error: error.message,
            });
        }
    }
    async exportInventoryReportToPDF(res, warehouseId) {
        try {
            const filters = { warehouseId };
            const pdfBuffer = await this.reportingService.exportReportToPDF('inventory', filters);
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename=inventory-report-${new Date().toISOString().split('T')[0]}.pdf`);
            res.send(pdfBuffer);
        }
        catch (error) {
            res.status(common_1.HttpStatus.INTERNAL_SERVER_ERROR).json({
                message: 'فشل في تصدير تقرير المخزون',
                error: error.message,
            });
        }
    }
    async generateScheduledReport(frequency, branchId) {
        const now = new Date();
        let startDate;
        let endDate = now;
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
        return {
            message: `تم إنشاء التقرير المجدول (${frequency})`,
            period: `${startDate.toISOString()} - ${endDate.toISOString()}`,
        };
    }
    getCustomReport(reportType, filters, groupBy, sortBy) {
        return {
            message: 'ميزة التقارير المخصصة ستكون متاحة قريباً',
            requestedType: reportType,
            filters: JSON.parse(filters || '{}'),
        };
    }
    getPerformanceAnalytics(metric, period = 'month', branchId) {
        return {
            message: 'تحليلات الأداء ستكون متاحة قريباً',
            metric,
            period,
            branchId,
        };
    }
    getPeriodComparison(currentStart, currentEnd, previousStart, previousEnd, branchId) {
        return {
            message: 'مقارنات الفترات ستكون متاحة قريباً',
            currentPeriod: `${currentStart} - ${currentEnd}`,
            previousPeriod: `${previousStart} - ${previousEnd}`,
            branchId,
        };
    }
};
exports.ReportingController = ReportingController;
__decorate([
    (0, common_1.Get)('sales'),
    (0, permissions_decorator_1.Permissions)('reporting.sales.read'),
    __param(0, (0, common_1.Query)('startDate')),
    __param(1, (0, common_1.Query)('endDate')),
    __param(2, (0, common_1.Query)('branchId')),
    __param(3, (0, common_1.Query)('customerId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", void 0)
], ReportingController.prototype, "getSalesReport", null);
__decorate([
    (0, common_1.Get)('sales/monthly'),
    (0, permissions_decorator_1.Permissions)('reporting.sales.read'),
    __param(0, (0, common_1.Query)('year')),
    __param(1, (0, common_1.Query)('month')),
    __param(2, (0, common_1.Query)('branchId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, String]),
    __metadata("design:returntype", void 0)
], ReportingController.prototype, "getMonthlySalesReport", null);
__decorate([
    (0, common_1.Get)('sales/daily'),
    (0, permissions_decorator_1.Permissions)('reporting.sales.read'),
    __param(0, (0, common_1.Query)('date')),
    __param(1, (0, common_1.Query)('branchId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], ReportingController.prototype, "getDailySalesReport", null);
__decorate([
    (0, common_1.Get)('inventory'),
    (0, permissions_decorator_1.Permissions)('reporting.inventory.read'),
    __param(0, (0, common_1.Query)('warehouseId')),
    __param(1, (0, common_1.Query)('categoryId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], ReportingController.prototype, "getInventoryReport", null);
__decorate([
    (0, common_1.Get)('inventory/low-stock'),
    (0, permissions_decorator_1.Permissions)('reporting.inventory.read'),
    __param(0, (0, common_1.Query)('warehouseId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ReportingController.prototype, "getLowStockReport", null);
__decorate([
    (0, common_1.Get)('inventory/movements'),
    (0, permissions_decorator_1.Permissions)('reporting.inventory.read'),
    __param(0, (0, common_1.Query)('warehouseId')),
    __param(1, (0, common_1.Query)('startDate')),
    __param(2, (0, common_1.Query)('endDate')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", void 0)
], ReportingController.prototype, "getStockMovementsReport", null);
__decorate([
    (0, common_1.Get)('financial/balance-sheet'),
    (0, permissions_decorator_1.Permissions)('reporting.financial.read'),
    __param(0, (0, common_1.Query)('asOfDate')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ReportingController.prototype, "getBalanceSheetReport", null);
__decorate([
    (0, common_1.Get)('financial/profit-loss'),
    (0, permissions_decorator_1.Permissions)('reporting.financial.read'),
    __param(0, (0, common_1.Query)('startDate')),
    __param(1, (0, common_1.Query)('endDate')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], ReportingController.prototype, "getProfitLossReport", null);
__decorate([
    (0, common_1.Get)('financial/cash-flow'),
    (0, permissions_decorator_1.Permissions)('reporting.financial.read'),
    __param(0, (0, common_1.Query)('startDate')),
    __param(1, (0, common_1.Query)('endDate')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], ReportingController.prototype, "getCashFlowReport", null);
__decorate([
    (0, common_1.Get)('financial/comprehensive'),
    (0, permissions_decorator_1.Permissions)('reporting.financial.read'),
    __param(0, (0, common_1.Query)('asOfDate')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ReportingController.prototype, "getComprehensiveFinancialReport", null);
__decorate([
    (0, common_1.Get)('dashboard/overview'),
    (0, permissions_decorator_1.Permissions)('reporting.dashboard.read'),
    __param(0, (0, common_1.Query)('branchId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ReportingController.prototype, "getDashboardOverview", null);
__decorate([
    (0, common_1.Get)('dashboard/sales'),
    (0, permissions_decorator_1.Permissions)('reporting.dashboard.read'),
    __param(0, (0, common_1.Query)('period')),
    __param(1, (0, common_1.Query)('branchId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], ReportingController.prototype, "getDashboardSalesData", null);
__decorate([
    (0, common_1.Get)('dashboard/inventory'),
    (0, permissions_decorator_1.Permissions)('reporting.dashboard.read'),
    __param(0, (0, common_1.Query)('warehouseId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ReportingController.prototype, "getDashboardInventoryData", null);
__decorate([
    (0, common_1.Get)('sales/export/excel'),
    (0, permissions_decorator_1.Permissions)('reporting.export'),
    __param(0, (0, common_1.Res)()),
    __param(1, (0, common_1.Query)('startDate')),
    __param(2, (0, common_1.Query)('endDate')),
    __param(3, (0, common_1.Query)('branchId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String]),
    __metadata("design:returntype", Promise)
], ReportingController.prototype, "exportSalesReportToExcel", null);
__decorate([
    (0, common_1.Get)('inventory/export/excel'),
    (0, permissions_decorator_1.Permissions)('reporting.export'),
    __param(0, (0, common_1.Res)()),
    __param(1, (0, common_1.Query)('warehouseId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], ReportingController.prototype, "exportInventoryReportToExcel", null);
__decorate([
    (0, common_1.Get)('sales/export/pdf'),
    (0, permissions_decorator_1.Permissions)('reporting.export'),
    __param(0, (0, common_1.Res)()),
    __param(1, (0, common_1.Query)('startDate')),
    __param(2, (0, common_1.Query)('endDate')),
    __param(3, (0, common_1.Query)('branchId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String]),
    __metadata("design:returntype", Promise)
], ReportingController.prototype, "exportSalesReportToPDF", null);
__decorate([
    (0, common_1.Get)('inventory/export/pdf'),
    (0, permissions_decorator_1.Permissions)('reporting.export'),
    __param(0, (0, common_1.Res)()),
    __param(1, (0, common_1.Query)('warehouseId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], ReportingController.prototype, "exportInventoryReportToPDF", null);
__decorate([
    (0, common_1.Get)('scheduled/:reportType'),
    (0, permissions_decorator_1.Permissions)('reporting.scheduled'),
    __param(0, (0, common_1.Query)('frequency')),
    __param(1, (0, common_1.Query)('branchId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], ReportingController.prototype, "generateScheduledReport", null);
__decorate([
    (0, common_1.Get)('custom'),
    (0, permissions_decorator_1.Permissions)('reporting.custom'),
    __param(0, (0, common_1.Query)('reportType')),
    __param(1, (0, common_1.Query)('filters')),
    __param(2, (0, common_1.Query)('groupBy')),
    __param(3, (0, common_1.Query)('sortBy')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", void 0)
], ReportingController.prototype, "getCustomReport", null);
__decorate([
    (0, common_1.Get)('analytics/performance'),
    (0, permissions_decorator_1.Permissions)('reporting.analytics'),
    __param(0, (0, common_1.Query)('metric')),
    __param(1, (0, common_1.Query)('period')),
    __param(2, (0, common_1.Query)('branchId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", void 0)
], ReportingController.prototype, "getPerformanceAnalytics", null);
__decorate([
    (0, common_1.Get)('analytics/comparison'),
    (0, permissions_decorator_1.Permissions)('reporting.analytics'),
    __param(0, (0, common_1.Query)('currentStart')),
    __param(1, (0, common_1.Query)('currentEnd')),
    __param(2, (0, common_1.Query)('previousStart')),
    __param(3, (0, common_1.Query)('previousEnd')),
    __param(4, (0, common_1.Query)('branchId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String]),
    __metadata("design:returntype", void 0)
], ReportingController.prototype, "getPeriodComparison", null);
exports.ReportingController = ReportingController = __decorate([
    (0, common_1.Controller)('reporting'),
    __metadata("design:paramtypes", [reporting_service_1.ReportingService])
], ReportingController);
//# sourceMappingURL=reporting.controller.js.map