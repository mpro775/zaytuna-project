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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var CacheService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CacheService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const redis_1 = __importDefault(require("redis"));
let CacheService = CacheService_1 = class CacheService {
    redisClient;
    configService;
    logger = new common_1.Logger(CacheService_1.name);
    client;
    stats = {
        hits: 0,
        misses: 0,
        sets: 0,
        deletes: 0,
        totalKeys: 0,
    };
    constructor(redisClient, configService) {
        this.redisClient = redisClient;
        this.configService = configService;
        this.client = redisClient;
    }
    async get(key) {
        try {
            const value = await this.client.get(key);
            if (value) {
                this.stats.hits++;
                return JSON.parse(value);
            }
            this.stats.misses++;
            return null;
        }
        catch (error) {
            this.logger.error(`فشل في قراءة المفتاح ${key} من الكاش:`, error);
            return null;
        }
    }
    async set(key, value, options = {}) {
        try {
            const serializedValue = JSON.stringify(value);
            const ttl = options.ttl || this.configService.get('app.cache.defaultTtl', 300);
            if (ttl && ttl > 0) {
                await this.client.setEx(key, ttl, serializedValue);
            }
            else {
                await this.client.set(key, serializedValue);
            }
            this.stats.sets++;
        }
        catch (error) {
            this.logger.error(`فشل في حفظ المفتاح ${key} في الكاش:`, error);
        }
    }
    async delete(key) {
        try {
            const result = await this.client.del(key);
            if (result > 0) {
                this.stats.deletes++;
                return true;
            }
            return false;
        }
        catch (error) {
            this.logger.error(`فشل في حذف المفتاح ${key} من الكاش:`, error);
            return false;
        }
    }
    async deleteMany(pattern) {
        try {
            const keys = (await this.client.keys(pattern));
            if (keys && keys.length > 0) {
                const result = await this.client.del(keys);
                this.stats.deletes += result;
                return result;
            }
            return 0;
        }
        catch (error) {
            this.logger.error(`فشل في حذف المفاتيح بالنمط ${pattern}:`, error);
            return 0;
        }
    }
    async exists(key) {
        try {
            const result = await this.client.exists(key);
            return result === 1;
        }
        catch (error) {
            this.logger.error(`فشل في التحقق من وجود المفتاح ${key}:`, error);
            return false;
        }
    }
    async ttl(key) {
        try {
            return await this.client.ttl(key);
        }
        catch (error) {
            this.logger.error(`فشل في الحصول على TTL للمفتاح ${key}:`, error);
            return -2;
        }
    }
    async expire(key, ttl) {
        try {
            const result = await this.client.expire(key, ttl);
            return result === 1;
        }
        catch (error) {
            this.logger.error(`فشل في تمديد TTL للمفتاح ${key}:`, error);
            return false;
        }
    }
    async increment(key, amount = 1) {
        try {
            return await this.client.incrBy(key, amount);
        }
        catch (error) {
            this.logger.error(`فشل في زيادة القيمة للمفتاح ${key}:`, error);
            return 0;
        }
    }
    async setObject(key, value, ttl = 300) {
        await this.set(key, value, { ttl });
    }
    async getObject(key) {
        return this.get(key);
    }
    async clear() {
        if (process.env.NODE_ENV === 'production') {
            throw new Error('لا يمكن تنظيف الكاش بالكامل في وضع الإنتاج');
        }
        try {
            await this.client.flushAll();
            this.logger.warn('تم تنظيف الكاش بالكامل');
        }
        catch (error) {
            this.logger.error('فشل في تنظيف الكاش:', error);
        }
    }
    getStats() {
        return { ...this.stats };
    }
    resetStats() {
        this.stats = {
            hits: 0,
            misses: 0,
            sets: 0,
            deletes: 0,
            totalKeys: 0,
        };
    }
    async getInfo() {
        try {
            const info = await this.client.info();
            return this.parseRedisInfo(info);
        }
        catch (error) {
            this.logger.error('فشل في الحصول على معلومات Redis:', error);
            return null;
        }
    }
    parseRedisInfo(info) {
        const lines = info.split('\r\n');
        const parsed = {};
        for (const line of lines) {
            if (line.includes(':')) {
                const [key, value] = line.split(':');
                parsed[key] = value;
            }
        }
        return parsed;
    }
    async getKeys(pattern) {
        try {
            const keys = await this.client.keys(pattern);
            return keys;
        }
        catch (error) {
            this.logger.error(`فشل في الحصول على المفاتيح بالنمط ${pattern}:`, error);
            return [];
        }
    }
    async ping() {
        try {
            const result = await this.client.ping();
            return result === 'PONG';
        }
        catch (error) {
            this.logger.error('فشل في ping Redis:', error);
            return false;
        }
    }
};
exports.CacheService = CacheService;
exports.CacheService = CacheService = CacheService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)('REDIS_CLIENT')),
    __metadata("design:paramtypes", [Object, config_1.ConfigService])
], CacheService);
//# sourceMappingURL=cache.service.js.map