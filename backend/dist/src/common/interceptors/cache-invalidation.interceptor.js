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
var CacheInvalidationInterceptor_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CacheInvalidationInterceptor = void 0;
const common_1 = require("@nestjs/common");
const operators_1 = require("rxjs/operators");
const cache_service_1 = require("../../shared/cache/cache.service");
const core_1 = require("@nestjs/core");
let CacheInvalidationInterceptor = CacheInvalidationInterceptor_1 = class CacheInvalidationInterceptor {
    cacheService;
    reflector;
    logger = new common_1.Logger(CacheInvalidationInterceptor_1.name);
    constructor(cacheService, reflector) {
        this.cacheService = cacheService;
        this.reflector = reflector;
    }
    intercept(context, next) {
        const patterns = this.reflector.get('invalidate_cache', context.getHandler());
        if (!patterns || patterns.length === 0) {
            return next.handle();
        }
        return next.handle().pipe((0, operators_1.tap)(() => {
            this.invalidateCache(patterns).catch((error) => {
                this.logger.error('فشل في إبطال الكاش:', error);
            });
        }));
    }
    async invalidateCache(patterns) {
        try {
            for (const pattern of patterns) {
                const deletedCount = await this.cacheService.deleteMany(pattern);
                if (deletedCount > 0) {
                    this.logger.debug(`تم إبطال ${deletedCount} مفتاح كاش بالنمط: ${pattern}`);
                }
            }
        }
        catch (error) {
            this.logger.error('فشل في إبطال الكاش:', error);
        }
    }
};
exports.CacheInvalidationInterceptor = CacheInvalidationInterceptor;
exports.CacheInvalidationInterceptor = CacheInvalidationInterceptor = CacheInvalidationInterceptor_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [cache_service_1.CacheService,
        core_1.Reflector])
], CacheInvalidationInterceptor);
//# sourceMappingURL=cache-invalidation.interceptor.js.map