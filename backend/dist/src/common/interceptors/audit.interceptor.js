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
var AuditInterceptor_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditInterceptor = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const rxjs_1 = require("rxjs");
const audit_service_1 = require("../../modules/audit/audit.service");
const audit_decorators_1 = require("../decorators/audit.decorators");
let AuditInterceptor = AuditInterceptor_1 = class AuditInterceptor {
    reflector;
    auditService;
    logger = new common_1.Logger(AuditInterceptor_1.name);
    constructor(reflector, auditService) {
        this.reflector = reflector;
        this.auditService = auditService;
    }
    intercept(context, next) {
        const auditOptions = this.reflector.get(audit_decorators_1.AUDIT_LOG, context.getHandler());
        if (!auditOptions) {
            return next.handle();
        }
        const request = context.switchToHttp().getRequest();
        const user = request.user;
        const startTime = Date.now();
        return next.handle().pipe((0, rxjs_1.tap)(async (result) => {
            if (auditOptions.logOnSuccess !== false) {
                await this.logOperation(auditOptions, context, result, null, startTime);
            }
        }), (0, rxjs_1.catchError)(async (error) => {
            if (auditOptions.logOnError !== false) {
                await this.logOperation(auditOptions, context, null, error, startTime);
            }
            throw error;
        }));
    }
    async logOperation(options, context, result, error, startTime) {
        try {
            const request = context.switchToHttp().getRequest();
            const user = request.user;
            const params = request.params;
            const query = request.query;
            const body = request.body;
            let action = options.action || 'CUSTOM';
            if (options.customAction) {
                action = options.customAction;
            }
            else if (!options.action) {
                const method = context.getHandler().name.toLowerCase();
                if (method.includes('create'))
                    action = 'CREATE';
                else if (method.includes('update'))
                    action = 'UPDATE';
                else if (method.includes('delete'))
                    action = 'DELETE';
                else if (method.includes('get') || method.includes('find'))
                    action = 'READ';
            }
            let entity = options.entity;
            if (!entity) {
                const controllerName = context.getClass().name.toLowerCase();
                if (controllerName.includes('user'))
                    entity = 'User';
                else if (controllerName.includes('product'))
                    entity = 'Product';
                else if (controllerName.includes('sale'))
                    entity = 'SalesInvoice';
                else if (controllerName.includes('inventory'))
                    entity = 'StockItem';
                else if (controllerName.includes('customer'))
                    entity = 'Customer';
                else if (controllerName.includes('supplier'))
                    entity = 'Supplier';
                else if (controllerName.includes('account'))
                    entity = 'GLAccount';
                else
                    entity = context.getClass().name.replace('Controller', '');
            }
            let entityId = '';
            if (options.entityIdParam) {
                entityId = params[options.entityIdParam] || query[options.entityIdParam] || '';
            }
            else if (options.entityIdProperty && result) {
                entityId = (0, audit_decorators_1.getNestedValue)(result, options.entityIdProperty) || '';
            }
            else {
                entityId = result?.id || result?.data?.id || params.id || params.entityId || '';
            }
            let referenceType = options.referenceType;
            let referenceId = '';
            if (options.referenceIdParam) {
                referenceId = params[options.referenceIdParam] || query[options.referenceIdParam] || '';
            }
            else if (options.referenceIdProperty && result) {
                referenceId = (0, audit_decorators_1.getNestedValue)(result, options.referenceIdProperty) || '';
            }
            let module = options.module;
            if (!module) {
                const controllerName = context.getClass().name.toLowerCase();
                if (controllerName.includes('user') || controllerName.includes('auth'))
                    module = 'auth';
                else if (controllerName.includes('product') || controllerName.includes('category'))
                    module = 'products';
                else if (controllerName.includes('sale'))
                    module = 'sales';
                else if (controllerName.includes('inventory') || controllerName.includes('stock'))
                    module = 'inventory';
                else if (controllerName.includes('customer'))
                    module = 'customer';
                else if (controllerName.includes('supplier') || controllerName.includes('purchase'))
                    module = 'purchasing';
                else if (controllerName.includes('account'))
                    module = 'accounting';
                else if (controllerName.includes('report'))
                    module = 'reporting';
                else if (controllerName.includes('audit'))
                    module = 'audit';
            }
            let oldValues = {};
            let newValues = {};
            if (options.includeRequestBody && body) {
                newValues = (0, audit_decorators_1.sanitizeObject)(body, options.excludeFields);
            }
            if (options.includeResponseBody && result) {
                if (action === 'UPDATE' && body) {
                    newValues = (0, audit_decorators_1.sanitizeObject)(body, options.excludeFields);
                }
                else if (action === 'CREATE' && result) {
                    newValues = (0, audit_decorators_1.sanitizeObject)(result, options.excludeFields);
                }
            }
            if (options.condition && !options.condition(result, error)) {
                return;
            }
            let severity = options.severity || 'info';
            let category = options.category || 'business';
            if (error) {
                severity = 'error';
                category = 'system';
            }
            const searchableText = (0, audit_decorators_1.createSearchableText)({
                action,
                entity,
                entityId,
                user: user?.username || user?.email,
                module,
                ...newValues,
            });
            const details = {
                method: request.method,
                url: request.url,
                duration: Date.now() - startTime,
                userAgent: request.get('User-Agent'),
            };
            if (error) {
                details.error = {
                    message: error.message,
                    stack: error.stack?.substring(0, 500),
                };
            }
            await this.auditService.log({
                action: action,
                entity,
                entityId,
                details,
                oldValues,
                newValues,
                referenceType,
                referenceId,
                module,
                severity,
                category,
                success: !error,
                errorMessage: error?.message,
                searchableText,
            });
        }
        catch (auditError) {
            this.logger.error('فشل في تسجيل عملية التدقيق', auditError);
        }
    }
};
exports.AuditInterceptor = AuditInterceptor;
exports.AuditInterceptor = AuditInterceptor = AuditInterceptor_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [core_1.Reflector,
        audit_service_1.AuditService])
], AuditInterceptor);
//# sourceMappingURL=audit.interceptor.js.map