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
var LoggingInterceptor_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoggingInterceptor = void 0;
const common_1 = require("@nestjs/common");
const operators_1 = require("rxjs/operators");
const config_1 = require("@nestjs/config");
let LoggingInterceptor = LoggingInterceptor_1 = class LoggingInterceptor {
    configService;
    logger = new common_1.Logger(LoggingInterceptor_1.name);
    constructor(configService) {
        this.configService = configService;
    }
    intercept(context, next) {
        const startTime = Date.now();
        const request = context.switchToHttp().getRequest();
        const response = context.switchToHttp().getResponse();
        const { method, url, ip, headers } = request;
        const userAgent = headers['user-agent'] || 'Unknown';
        const requestId = request.id || 'unknown';
        this.logger.log(`➡️  ${method} ${url} - IP: ${ip} - UA: ${userAgent.substring(0, 50)}... - ID: ${requestId}`);
        if (this.configService.get('NODE_ENV') !== 'production') {
            const body = this.sanitizeRequestBody(request.body);
            const query = request.query;
            const params = request.params;
            if (Object.keys(body).length > 0) {
                this.logger.debug(`📦 Body:`, body);
            }
            if (Object.keys(query).length > 0) {
                this.logger.debug(`🔍 Query:`, query);
            }
            if (Object.keys(params).length > 0) {
                this.logger.debug(`📍 Params:`, params);
            }
        }
        return next.handle().pipe((0, operators_1.tap)((data) => {
            const duration = Date.now() - startTime;
            const statusCode = response.statusCode;
            const logLevel = this.getLogLevel(statusCode);
            const emoji = this.getStatusEmoji(statusCode);
            this.logger[logLevel](`${emoji} ${method} ${url} - ${statusCode} - ${duration}ms - ID: ${requestId}`);
            if (duration > 1000) {
                this.logger.warn(`🐌 طلب بطيء: ${method} ${url} - ${duration}ms`);
            }
            if (this.isSensitiveRequest(url)) {
                this.logger.log(`🔒 طلب حساس: ${method} ${url} - IP: ${ip}`);
            }
        }));
    }
    sanitizeRequestBody(body) {
        if (!body || typeof body !== 'object')
            return body;
        const sanitized = { ...body };
        const sensitiveFields = ['password', 'passwordHash', 'token', 'refreshToken', 'secret'];
        sensitiveFields.forEach((field) => {
            if (field in sanitized) {
                sanitized[field] = '[REDACTED]';
            }
        });
        return sanitized;
    }
    getLogLevel(statusCode) {
        if (statusCode >= 500)
            return 'error';
        if (statusCode >= 400)
            return 'warn';
        return 'log';
    }
    getStatusEmoji(statusCode) {
        if (statusCode >= 500)
            return '💥';
        if (statusCode >= 400)
            return '⚠️';
        if (statusCode >= 300)
            return '➡️';
        return '✅';
    }
    isSensitiveRequest(url) {
        const sensitivePaths = [
            '/auth/login',
            '/auth/register',
            '/users/password',
            '/admin',
        ];
        return sensitivePaths.some((path) => url.includes(path));
    }
};
exports.LoggingInterceptor = LoggingInterceptor;
exports.LoggingInterceptor = LoggingInterceptor = LoggingInterceptor_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], LoggingInterceptor);
//# sourceMappingURL=logging.interceptor.js.map