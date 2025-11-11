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
exports.AuditController = void 0;
const common_1 = require("@nestjs/common");
const audit_service_1 = require("./audit.service");
const permissions_decorator_1 = require("../../common/decorators/permissions.decorator");
let AuditController = class AuditController {
    auditService;
    constructor(auditService) {
        this.auditService = auditService;
    }
    async searchAuditLogs(query) {
        const auditQuery = {
            userId: query.userId,
            action: query.action,
            entity: query.entity,
            entityId: query.entityId,
            branchId: query.branchId,
            warehouseId: query.warehouseId,
            startDate: query.startDate ? new Date(query.startDate) : undefined,
            endDate: query.endDate ? new Date(query.endDate) : undefined,
            success: query.success ? query.success === 'true' : undefined,
            severity: query.severity,
            category: query.category,
            referenceType: query.referenceType,
            referenceId: query.referenceId,
            module: query.module,
            searchText: query.searchText,
            limit: query.limit ? parseInt(query.limit) : undefined,
            offset: query.offset ? parseInt(query.offset) : undefined,
        };
        return this.auditService.searchAuditLogs(auditQuery);
    }
    getAuditLog(id) {
        return this.auditService.getAuditLog(id);
    }
    getAuditStats(startDate, endDate, branchId) {
        const start = startDate ? new Date(startDate) : undefined;
        const end = endDate ? new Date(endDate) : undefined;
        return this.auditService.getAuditStats(start, end, branchId);
    }
    getDailyAuditStats(branchId) {
        const today = new Date();
        const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);
        return this.auditService.getAuditStats(startOfDay, endOfDay, branchId);
    }
    getWeeklyAuditStats(branchId) {
        const today = new Date();
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());
        startOfWeek.setHours(0, 0, 0, 0);
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999);
        return this.auditService.getAuditStats(startOfWeek, endOfWeek, branchId);
    }
    getMonthlyAuditStats(year, month, branchId) {
        const currentYear = year || new Date().getFullYear();
        const currentMonth = month || new Date().getMonth();
        const startOfMonth = new Date(currentYear, currentMonth, 1);
        const endOfMonth = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59);
        return this.auditService.getAuditStats(startOfMonth, endOfMonth, branchId);
    }
    getEntityAuditTrail(entity, entityId, limit) {
        const limitNum = limit ? parseInt(limit) : 50;
        return this.auditService.getEntityAuditTrail(entity, entityId, limitNum);
    }
    getUserAuditTrail(userId, limit) {
        const limitNum = limit ? parseInt(limit) : 50;
        return this.auditService.getUserAuditTrail(userId, limitNum);
    }
    async getErrorReport(startDate, endDate, branchId) {
        const start = startDate ? new Date(startDate) : undefined;
        const end = endDate ? new Date(endDate) : undefined;
        const stats = await this.auditService.getAuditStats(start, end, branchId);
        return {
            errorRate: stats.errorRate,
            errorsBySeverity: Object.fromEntries(Object.entries(stats.logsBySeverity).filter(([severity]) => ['error', 'critical'].includes(severity))),
            errorsByModule: Object.fromEntries(Object.entries(stats.logsByModule).filter(([module, count]) => count > 0 && module !== 'unknown')),
            recentErrors: stats.recentActivity.filter(activity => !activity.success),
        };
    }
    async getSecurityReport(startDate, endDate, branchId) {
        const start = startDate ? new Date(startDate) : undefined;
        const end = endDate ? new Date(endDate) : undefined;
        const stats = await this.auditService.getAuditStats(start, end, branchId);
        const securityActions = [
            'LOGIN_SUCCESS', 'LOGIN_FAILED', 'LOGOUT',
            'PASSWORD_CHANGE', 'PERMISSION_CHANGE',
            'CREATE', 'DELETE', 'UPDATE'
        ];
        const securityLogs = Object.fromEntries(Object.entries(stats.logsByAction).filter(([action]) => securityActions.includes(action)));
        return {
            totalSecurityEvents: Object.values(securityLogs).reduce((sum, count) => sum + count, 0),
            securityEventsByType: securityLogs,
            securityEventsByUser: Object.fromEntries(Object.entries(stats.logsByUser).filter(([userId, count]) => count > 0)),
            failedLogins: stats.logsByAction['LOGIN_FAILED'] || 0,
            permissionChanges: stats.logsByAction['PERMISSION_CHANGE'] || 0,
            passwordChanges: stats.logsByAction['PASSWORD_CHANGE'] || 0,
        };
    }
    async getActivityReport(startDate, endDate, branchId) {
        const start = startDate ? new Date(startDate) : undefined;
        const end = endDate ? new Date(endDate) : undefined;
        const stats = await this.auditService.getAuditStats(start, end, branchId);
        return {
            totalActivity: stats.totalLogs,
            activityByModule: stats.logsByModule,
            activityByEntity: stats.logsByEntity,
            topEntities: stats.topEntities,
            topUsers: stats.topUsers,
            activityTrend: stats.recentActivity,
        };
    }
    getDetailedAuditTrail(entity, entityId) {
        return this.auditService.getDetailedAuditTrail(entity, entityId);
    }
    compareEntityStates(entity, entityId, version1, version2) {
        return {
            message: 'ميزة مقارنة الإصدارات ستكون متاحة قريباً',
            entity,
            entityId,
            version1,
            version2,
        };
    }
    getChangeReport(startDate, endDate, entity, userId) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            throw new Error('تاريخ البداية أو النهاية غير صحيح');
        }
        return this.auditService.getChangeReport(start, end, entity, userId);
    }
    getDailyChangeReport(entity, userId) {
        const today = new Date();
        const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);
        return this.auditService.getChangeReport(startOfDay, endOfDay, entity, userId);
    }
    getWeeklyChangeReport(entity, userId) {
        const today = new Date();
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());
        startOfWeek.setHours(0, 0, 0, 0);
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999);
        return this.auditService.getChangeReport(startOfWeek, endOfWeek, entity, userId);
    }
    async getComplianceReport(startDate, endDate, branchId) {
        const start = startDate ? new Date(startDate) : undefined;
        const end = endDate ? new Date(endDate) : undefined;
        const stats = await this.auditService.getAuditStats(start, end, branchId);
        const complianceMetrics = {
            totalAuditableEvents: stats.totalLogs,
            auditCoverage: 100,
            errorRate: stats.errorRate,
            securityIncidents: (stats.logsBySeverity['critical'] || 0) + (stats.logsBySeverity['error'] || 0),
            dataAccessEvents: (stats.logsByAction['READ'] || 0) + (stats.logsByAction['UPDATE'] || 0),
            adminActions: stats.logsByAction['PERMISSION_CHANGE'] || 0,
            complianceStatus: stats.errorRate < 5 ? 'compliant' : 'needs_attention',
        };
        return {
            period: {
                startDate: start?.toISOString(),
                endDate: end?.toISOString(),
                branchId,
            },
            complianceMetrics,
            auditTrail: stats.recentActivity.slice(0, 20),
            recommendations: this.generateComplianceRecommendations(complianceMetrics),
        };
    }
    async exportAuditLogsToExcel(res, query) {
        try {
            const auditQuery = {
                userId: query.userId,
                action: query.action,
                entity: query.entity,
                entityId: query.entityId,
                branchId: query.branchId,
                warehouseId: query.warehouseId,
                startDate: query.startDate ? new Date(query.startDate) : undefined,
                endDate: query.endDate ? new Date(query.endDate) : undefined,
                success: query.success ? query.success === 'true' : undefined,
                severity: query.severity,
                category: query.category,
                referenceType: query.referenceType,
                referenceId: query.referenceId,
                module: query.module,
                searchText: query.searchText,
            };
            const logs = await this.auditService.exportAuditLogs(auditQuery);
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Content-Disposition', `attachment; filename=audit-logs-${new Date().toISOString().split('T')[0]}.json`);
            res.send(JSON.stringify(logs, null, 2));
        }
        catch (error) {
            res.status(common_1.HttpStatus.INTERNAL_SERVER_ERROR).json({
                message: 'فشل في تصدير سجلات التدقيق',
                error: error.message,
            });
        }
    }
    async exportAuditLogsToJSON(res, query) {
        try {
            const auditQuery = {
                userId: query.userId,
                action: query.action,
                entity: query.entity,
                entityId: query.entityId,
                branchId: query.branchId,
                warehouseId: query.warehouseId,
                startDate: query.startDate ? new Date(query.startDate) : undefined,
                endDate: query.endDate ? new Date(query.endDate) : undefined,
                success: query.success ? query.success === 'true' : undefined,
                severity: query.severity,
                category: query.category,
                referenceType: query.referenceType,
                referenceId: query.referenceId,
                module: query.module,
                searchText: query.searchText,
            };
            const logs = await this.auditService.exportAuditLogs(auditQuery);
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Content-Disposition', `attachment; filename=audit-logs-${new Date().toISOString().split('T')[0]}.json`);
            res.send(JSON.stringify(logs, null, 2));
        }
        catch (error) {
            res.status(common_1.HttpStatus.INTERNAL_SERVER_ERROR).json({
                message: 'فشل في تصدير سجلات التدقيق',
                error: error.message,
            });
        }
    }
    async cleanupOldLogs(days) {
        const daysToKeep = parseInt(days);
        if (isNaN(daysToKeep) || daysToKeep < 30) {
            throw new Error('يجب أن يكون عدد الأيام 30 يوماً على الأقل');
        }
        const deletedCount = await this.auditService.cleanupOldLogs(daysToKeep);
        return {
            message: `تم حذف ${deletedCount} سجل تدقيق قديم`,
            daysKept: daysToKeep,
            deletedCount,
        };
    }
    generateComplianceRecommendations(metrics) {
        const recommendations = [];
        if (metrics.errorRate > 10) {
            recommendations.push('مراجعة معدل الأخطاء العالي وتحسين استقرار النظام');
        }
        if (metrics.securityIncidents > 0) {
            recommendations.push('مراجعة الحوادث الأمنية وتعزيز إجراءات الأمان');
        }
        if (metrics.dataAccessEvents > 1000) {
            recommendations.push('مراجعة عمليات الوصول إلى البيانات الحساسة');
        }
        if (metrics.adminActions > 50) {
            recommendations.push('مراجعة تغييرات الصلاحيات الإدارية');
        }
        if (recommendations.length === 0) {
            recommendations.push('النظام يتوافق مع معايير الأمان والامتثال');
        }
        return recommendations;
    }
};
exports.AuditController = AuditController;
__decorate([
    (0, common_1.Get)('logs'),
    (0, permissions_decorator_1.Permissions)('audit.read'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuditController.prototype, "searchAuditLogs", null);
__decorate([
    (0, common_1.Get)('logs/:id'),
    (0, permissions_decorator_1.Permissions)('audit.read'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AuditController.prototype, "getAuditLog", null);
__decorate([
    (0, common_1.Get)('stats'),
    (0, permissions_decorator_1.Permissions)('audit.read'),
    __param(0, (0, common_1.Query)('startDate')),
    __param(1, (0, common_1.Query)('endDate')),
    __param(2, (0, common_1.Query)('branchId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", void 0)
], AuditController.prototype, "getAuditStats", null);
__decorate([
    (0, common_1.Get)('stats/daily'),
    (0, permissions_decorator_1.Permissions)('audit.read'),
    __param(0, (0, common_1.Query)('branchId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AuditController.prototype, "getDailyAuditStats", null);
__decorate([
    (0, common_1.Get)('stats/weekly'),
    (0, permissions_decorator_1.Permissions)('audit.read'),
    __param(0, (0, common_1.Query)('branchId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AuditController.prototype, "getWeeklyAuditStats", null);
__decorate([
    (0, common_1.Get)('stats/monthly'),
    (0, permissions_decorator_1.Permissions)('audit.read'),
    __param(0, (0, common_1.Query)('year')),
    __param(1, (0, common_1.Query)('month')),
    __param(2, (0, common_1.Query)('branchId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, String]),
    __metadata("design:returntype", void 0)
], AuditController.prototype, "getMonthlyAuditStats", null);
__decorate([
    (0, common_1.Get)('trail/entity/:entity/:entityId'),
    (0, permissions_decorator_1.Permissions)('audit.read'),
    __param(0, (0, common_1.Param)('entity')),
    __param(1, (0, common_1.Param)('entityId')),
    __param(2, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", void 0)
], AuditController.prototype, "getEntityAuditTrail", null);
__decorate([
    (0, common_1.Get)('trail/user/:userId'),
    (0, permissions_decorator_1.Permissions)('audit.read'),
    __param(0, (0, common_1.Param)('userId')),
    __param(1, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], AuditController.prototype, "getUserAuditTrail", null);
__decorate([
    (0, common_1.Get)('reports/errors'),
    (0, permissions_decorator_1.Permissions)('audit.read'),
    __param(0, (0, common_1.Query)('startDate')),
    __param(1, (0, common_1.Query)('endDate')),
    __param(2, (0, common_1.Query)('branchId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], AuditController.prototype, "getErrorReport", null);
__decorate([
    (0, common_1.Get)('reports/security'),
    (0, permissions_decorator_1.Permissions)('audit.read'),
    __param(0, (0, common_1.Query)('startDate')),
    __param(1, (0, common_1.Query)('endDate')),
    __param(2, (0, common_1.Query)('branchId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], AuditController.prototype, "getSecurityReport", null);
__decorate([
    (0, common_1.Get)('reports/activity'),
    (0, permissions_decorator_1.Permissions)('audit.read'),
    __param(0, (0, common_1.Query)('startDate')),
    __param(1, (0, common_1.Query)('endDate')),
    __param(2, (0, common_1.Query)('branchId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], AuditController.prototype, "getActivityReport", null);
__decorate([
    (0, common_1.Get)('trail/detailed/:entity/:entityId'),
    (0, permissions_decorator_1.Permissions)('audit.read'),
    __param(0, (0, common_1.Param)('entity')),
    __param(1, (0, common_1.Param)('entityId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], AuditController.prototype, "getDetailedAuditTrail", null);
__decorate([
    (0, common_1.Get)('trail/compare'),
    (0, permissions_decorator_1.Permissions)('audit.read'),
    __param(0, (0, common_1.Query)('entity')),
    __param(1, (0, common_1.Query)('entityId')),
    __param(2, (0, common_1.Query)('version1')),
    __param(3, (0, common_1.Query)('version2')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", void 0)
], AuditController.prototype, "compareEntityStates", null);
__decorate([
    (0, common_1.Get)('reports/changes'),
    (0, permissions_decorator_1.Permissions)('audit.read'),
    __param(0, (0, common_1.Query)('startDate')),
    __param(1, (0, common_1.Query)('endDate')),
    __param(2, (0, common_1.Query)('entity')),
    __param(3, (0, common_1.Query)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", void 0)
], AuditController.prototype, "getChangeReport", null);
__decorate([
    (0, common_1.Get)('reports/changes/daily'),
    (0, permissions_decorator_1.Permissions)('audit.read'),
    __param(0, (0, common_1.Query)('entity')),
    __param(1, (0, common_1.Query)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], AuditController.prototype, "getDailyChangeReport", null);
__decorate([
    (0, common_1.Get)('reports/changes/weekly'),
    (0, permissions_decorator_1.Permissions)('audit.read'),
    __param(0, (0, common_1.Query)('entity')),
    __param(1, (0, common_1.Query)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], AuditController.prototype, "getWeeklyChangeReport", null);
__decorate([
    (0, common_1.Get)('reports/compliance'),
    (0, permissions_decorator_1.Permissions)('audit.compliance'),
    __param(0, (0, common_1.Query)('startDate')),
    __param(1, (0, common_1.Query)('endDate')),
    __param(2, (0, common_1.Query)('branchId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], AuditController.prototype, "getComplianceReport", null);
__decorate([
    (0, common_1.Get)('export/excel'),
    (0, permissions_decorator_1.Permissions)('audit.export'),
    __param(0, (0, common_1.Res)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AuditController.prototype, "exportAuditLogsToExcel", null);
__decorate([
    (0, common_1.Get)('export/json'),
    (0, permissions_decorator_1.Permissions)('audit.export'),
    __param(0, (0, common_1.Res)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AuditController.prototype, "exportAuditLogsToJSON", null);
__decorate([
    (0, common_1.Get)('cleanup/:days'),
    (0, permissions_decorator_1.Permissions)('audit.admin'),
    __param(0, (0, common_1.Param)('days')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AuditController.prototype, "cleanupOldLogs", null);
exports.AuditController = AuditController = __decorate([
    (0, common_1.Controller)('audit'),
    __metadata("design:paramtypes", [audit_service_1.AuditService])
], AuditController);
//# sourceMappingURL=audit.controller.js.map