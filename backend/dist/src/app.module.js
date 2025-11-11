"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const core_1 = require("@nestjs/core");
const prisma_module_1 = require("./shared/database/prisma.module");
const cache_module_1 = require("./shared/cache/cache.module");
const auth_module_1 = require("./modules/auth/auth.module");
const branch_module_1 = require("./modules/branch/branch.module");
const warehouse_module_1 = require("./modules/warehouse/warehouse.module");
const product_module_1 = require("./modules/product/product.module");
const category_module_1 = require("./modules/category/category.module");
const product_variant_module_1 = require("./modules/product-variant/product-variant.module");
const inventory_module_1 = require("./modules/inventory/inventory.module");
const sales_module_1 = require("./modules/sales/sales.module");
const returns_module_1 = require("./modules/returns/returns.module");
const purchasing_module_1 = require("./modules/purchasing/purchasing.module");
const customer_module_1 = require("./modules/customer/customer.module");
const accounting_module_1 = require("./modules/accounting/accounting.module");
const reporting_module_1 = require("./modules/reporting/reporting.module");
const audit_module_1 = require("./modules/audit/audit.module");
const sync_module_1 = require("./modules/sync/sync.module");
const payment_module_1 = require("./modules/payment/payment.module");
const notification_module_1 = require("./modules/notification/notification.module");
const cache_interceptor_1 = require("./common/interceptors/cache.interceptor");
const cache_invalidation_interceptor_1 = require("./common/interceptors/cache-invalidation.interceptor");
const response_interceptor_1 = require("./common/interceptors/response.interceptor");
const logging_interceptor_1 = require("./common/interceptors/logging.interceptor");
const audit_interceptor_1 = require("./common/interceptors/audit.interceptor");
const http_exception_filter_1 = require("./common/filters/http-exception.filter");
const validation_exception_filter_1 = require("./common/filters/validation-exception.filter");
const validation_pipe_1 = require("./common/pipes/validation.pipe");
const jwt_auth_guard_1 = require("./common/guards/jwt-auth.guard");
const permission_guard_1 = require("./common/guards/permission.guard");
const app_controller_1 = require("./app.controller");
const app_service_1 = require("./app.service");
const database_config_1 = __importDefault(require("./config/database.config"));
const redis_config_1 = __importDefault(require("./config/redis.config"));
const jwt_config_1 = __importDefault(require("./config/jwt.config"));
const app_config_1 = __importDefault(require("./config/app.config"));
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                envFilePath: ['.env.local', '.env'],
                load: [database_config_1.default, redis_config_1.default, jwt_config_1.default, app_config_1.default],
            }),
            prisma_module_1.PrismaModule,
            cache_module_1.CacheModule,
            auth_module_1.AuthModule,
            branch_module_1.BranchModule,
            warehouse_module_1.WarehouseModule,
            product_module_1.ProductModule,
            category_module_1.CategoryModule,
            product_variant_module_1.ProductVariantModule,
            inventory_module_1.InventoryModule,
            sales_module_1.SalesModule,
            returns_module_1.ReturnsModule,
            purchasing_module_1.PurchasingModule,
            customer_module_1.CustomerModule,
            accounting_module_1.AccountingModule,
            reporting_module_1.ReportingModule,
            audit_module_1.AuditModule,
            sync_module_1.SyncModule,
            payment_module_1.PaymentModule,
            notification_module_1.NotificationModule,
        ],
        controllers: [app_controller_1.AppController],
        providers: [
            app_service_1.AppService,
            {
                provide: core_1.APP_INTERCEPTOR,
                useClass: logging_interceptor_1.LoggingInterceptor,
            },
            {
                provide: core_1.APP_INTERCEPTOR,
                useClass: response_interceptor_1.ResponseInterceptor,
            },
            {
                provide: core_1.APP_INTERCEPTOR,
                useClass: cache_interceptor_1.CacheInterceptor,
            },
            {
                provide: core_1.APP_INTERCEPTOR,
                useClass: cache_invalidation_interceptor_1.CacheInvalidationInterceptor,
            },
            {
                provide: core_1.APP_INTERCEPTOR,
                useClass: audit_interceptor_1.AuditInterceptor,
            },
            {
                provide: core_1.APP_FILTER,
                useClass: http_exception_filter_1.HttpExceptionFilter,
            },
            {
                provide: core_1.APP_FILTER,
                useClass: validation_exception_filter_1.ValidationExceptionFilter,
            },
            {
                provide: core_1.APP_PIPE,
                useClass: validation_pipe_1.CustomValidationPipe,
            },
            {
                provide: core_1.APP_GUARD,
                useClass: jwt_auth_guard_1.JwtAuthGuard,
            },
            {
                provide: core_1.APP_GUARD,
                useClass: permission_guard_1.PermissionGuard,
            },
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map