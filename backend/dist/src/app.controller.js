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
exports.AppController = void 0;
const common_1 = require("@nestjs/common");
const app_service_1 = require("./app.service");
const cache_decorator_1 = require("./common/decorators/cache.decorator");
const permissions_decorator_1 = require("./common/decorators/permissions.decorator");
const pagination_dto_1 = require("./common/dto/pagination.dto");
const response_dto_1 = require("./common/dto/response.dto");
let AppController = class AppController {
    appService;
    constructor(appService) {
        this.appService = appService;
    }
    getHello() {
        return this.appService.getHello();
    }
    getHealth() {
        return {
            success: true,
            data: {
                status: 'ok',
                timestamp: new Date().toISOString(),
                uptime: process.uptime(),
                version: '1.0.0',
                services: {
                    database: true,
                    redis: true,
                },
            },
        };
    }
    getTestPagination(query) {
        const items = Array.from({ length: 100 }, (_, i) => ({
            id: i + 1,
            name: `Item ${i + 1}`,
            description: `Description for item ${i + 1}`,
        }));
        const { page = 1, limit = 20 } = query;
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const paginatedItems = items.slice(startIndex, endIndex);
        return {
            data: paginatedItems,
            pagination: {
                page,
                limit,
                total: items.length,
                totalPages: Math.ceil(items.length / limit),
            },
        };
    }
    createTestItem(body) {
        return {
            id: Date.now(),
            ...body,
            createdAt: new Date(),
        };
    }
    testError() {
        throw new Error('This is a test error');
    }
};
exports.AppController = AppController;
__decorate([
    (0, common_1.Get)(),
    (0, permissions_decorator_1.Public)(),
    (0, cache_decorator_1.Cache)({ ttl: 300 }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Object)
], AppController.prototype, "getHello", null);
__decorate([
    (0, common_1.Get)('health'),
    (0, permissions_decorator_1.Public)(),
    (0, cache_decorator_1.Cache)({ ttl: 60 }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", response_dto_1.HealthCheckResponseDto)
], AppController.prototype, "getHealth", null);
__decorate([
    (0, common_1.Get)('test-pagination'),
    (0, permissions_decorator_1.RequireRead)(),
    (0, cache_decorator_1.Cache)({ ttl: 120 }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [pagination_dto_1.PaginationQueryDto]),
    __metadata("design:returntype", void 0)
], AppController.prototype, "getTestPagination", null);
__decorate([
    (0, common_1.Post)('test-invalidation'),
    (0, permissions_decorator_1.Permissions)('create'),
    (0, cache_decorator_1.InvalidateCache)('test:*'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AppController.prototype, "createTestItem", null);
__decorate([
    (0, common_1.Get)('test-error'),
    (0, permissions_decorator_1.Public)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AppController.prototype, "testError", null);
exports.AppController = AppController = __decorate([
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [app_service_1.AppService])
], AppController);
//# sourceMappingURL=app.controller.js.map