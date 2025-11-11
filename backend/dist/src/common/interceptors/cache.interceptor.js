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
var CacheInterceptor_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CacheInterceptor = void 0;
const common_1 = require("@nestjs/common");
const rxjs_1 = require("rxjs");
const operators_1 = require("rxjs/operators");
const cache_service_1 = require("../../shared/cache/cache.service");
const core_1 = require("@nestjs/core");
let CacheInterceptor = CacheInterceptor_1 = class CacheInterceptor {
    cacheService;
    reflector;
    logger = new common_1.Logger(CacheInterceptor_1.name);
    constructor(cacheService, reflector) {
        this.cacheService = cacheService;
        this.reflector = reflector;
    }
    async intercept(context, next) {
        const cacheOptions = this.reflector.get('cache', context.getHandler());
        if (!cacheOptions) {
            return next.handle();
        }
        if (cacheOptions.condition && !cacheOptions.condition(context)) {
            return next.handle();
        }
        const request = context.switchToHttp().getRequest();
        const cacheKey = this.generateCacheKey(request, cacheOptions.key);
        try {
            const cachedData = await this.cacheService.get(cacheKey);
            if (cachedData !== null) {
                this.logger.debug(`تم استرجاع البيانات من الكاش: ${cacheKey}`);
                return (0, rxjs_1.of)(cachedData);
            }
        }
        catch (error) {
            this.logger.error(`فشل في استرجاع البيانات من الكاش: ${cacheKey}`, error);
        }
        return next.handle().pipe((0, operators_1.tap)((data) => {
            if (data !== undefined && data !== null) {
                this.setCacheData(cacheKey, data, cacheOptions.ttl).catch((error) => {
                    this.logger.error(`فشل في حفظ البيانات في الكاش: ${cacheKey}`, error);
                });
            }
        }));
    }
    async setCacheData(cacheKey, data, ttl) {
        try {
            await this.cacheService.set(cacheKey, data, { ttl });
            this.logger.debug(`تم حفظ البيانات في الكاش: ${cacheKey}`);
        }
        catch (error) {
            this.logger.error(`فشل في حفظ البيانات في الكاش: ${cacheKey}`, error);
        }
    }
    generateCacheKey(request, customKey) {
        if (customKey) {
            return `http:${customKey}`;
        }
        const { method, url, user, query, params, body } = request;
        const userId = user?.id || 'anonymous';
        const queryString = this.serializeObject(query);
        const paramsString = this.serializeObject(params);
        const bodyString = this.getBodyFingerprint(body);
        return `http:${method}:${url}:${userId}:${queryString}:${paramsString}:${bodyString}`;
    }
    serializeObject(obj) {
        if (!obj || typeof obj !== 'object')
            return '';
        const sortedKeys = Object.keys(obj).sort();
        const sortedObj = {};
        for (const key of sortedKeys) {
            sortedObj[key] = obj[key];
        }
        return JSON.stringify(sortedObj);
    }
    getBodyFingerprint(body) {
        if (!body || typeof body !== 'object')
            return '';
        const safeBody = { ...body };
        delete safeBody.password;
        delete safeBody.passwordHash;
        delete safeBody.token;
        delete safeBody.refreshToken;
        return this.serializeObject(safeBody);
    }
};
exports.CacheInterceptor = CacheInterceptor;
exports.CacheInterceptor = CacheInterceptor = CacheInterceptor_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [cache_service_1.CacheService,
        core_1.Reflector])
], CacheInterceptor);
//# sourceMappingURL=cache.interceptor.js.map