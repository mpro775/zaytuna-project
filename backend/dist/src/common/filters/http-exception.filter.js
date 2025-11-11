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
var HttpExceptionFilter_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.HttpExceptionFilter = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
let HttpExceptionFilter = HttpExceptionFilter_1 = class HttpExceptionFilter {
    configService;
    logger = new common_1.Logger(HttpExceptionFilter_1.name);
    constructor(configService) {
        this.configService = configService;
    }
    catch(exception, host) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        const request = ctx.getRequest();
        const errorInfo = this.getErrorInfo(exception);
        const traceId = this.generateTraceId();
        const errorResponse = {
            success: false,
            error: {
                code: errorInfo.code,
                message: errorInfo.message,
                details: errorInfo.details,
                traceId,
                timestamp: new Date().toISOString(),
                path: request.path,
                method: request.method,
            },
        };
        this.logError(exception, errorInfo, request, traceId);
        response.status(errorInfo.statusCode).json(errorResponse);
    }
    getErrorInfo(exception) {
        if (exception instanceof common_1.HttpException) {
            const status = exception.getStatus();
            const response = exception.getResponse();
            if (typeof response === 'string') {
                return {
                    statusCode: status,
                    code: this.getErrorCodeFromStatus(status),
                    message: response,
                };
            }
            if (typeof response === 'object' && response !== null) {
                const errorResponse = response;
                return {
                    statusCode: status,
                    code: errorResponse.code || this.getErrorCodeFromStatus(status),
                    message: errorResponse.message || errorResponse.error || 'خطأ غير معروف',
                    details: errorResponse.details,
                };
            }
            return {
                statusCode: status,
                code: this.getErrorCodeFromStatus(status),
                message: exception.message,
            };
        }
        if (this.isDatabaseError(exception)) {
            return {
                statusCode: common_1.HttpStatus.INTERNAL_SERVER_ERROR,
                code: 'DATABASE_ERROR',
                message: 'خطأ في قاعدة البيانات',
                details: this.isProduction() ? undefined : exception.message,
            };
        }
        if (this.isValidationError(exception)) {
            return {
                statusCode: common_1.HttpStatus.BAD_REQUEST,
                code: 'VALIDATION_ERROR',
                message: 'خطأ في التحقق من البيانات',
                details: this.isProduction() ? undefined : exception.message,
            };
        }
        return {
            statusCode: common_1.HttpStatus.INTERNAL_SERVER_ERROR,
            code: 'SYSTEM_ERROR',
            message: 'حدث خطأ غير متوقع',
            details: this.isProduction() ? undefined : exception.message,
        };
    }
    getErrorCodeFromStatus(status) {
        const statusMap = {
            400: 'VALIDATION_ERROR',
            401: 'AUTHENTICATION_ERROR',
            403: 'AUTHORIZATION_ERROR',
            404: 'NOT_FOUND_ERROR',
            409: 'CONFLICT_ERROR',
            422: 'VALIDATION_ERROR',
            429: 'RATE_LIMIT_ERROR',
            500: 'SYSTEM_ERROR',
            502: 'EXTERNAL_ERROR',
            503: 'SERVICE_UNAVAILABLE',
        };
        return statusMap[status] || 'SYSTEM_ERROR';
    }
    isDatabaseError(exception) {
        return (exception instanceof Error &&
            (exception.name === 'PrismaClientKnownRequestError' ||
                exception.name === 'PrismaClientUnknownRequestError' ||
                exception.name === 'PrismaClientValidationError' ||
                exception.message.toLowerCase().includes('database')));
    }
    isValidationError(exception) {
        return (exception instanceof Error &&
            (exception.name === 'ValidationError' ||
                exception.name === 'BadRequestException' ||
                exception.message.toLowerCase().includes('validation')));
    }
    generateTraceId() {
        return `trace-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
    logError(exception, errorInfo, request, traceId) {
        const logData = {
            traceId,
            path: request.path,
            method: request.method,
            ip: request.ip,
            userAgent: request.get('User-Agent'),
            error: {
                code: errorInfo.code,
                message: errorInfo.message,
                statusCode: errorInfo.statusCode,
            },
        };
        if (errorInfo.statusCode >= 500) {
            this.logger.error('خطأ في الخادم:', {
                ...logData,
                stack: this.isProduction() ? undefined : exception.stack,
                details: errorInfo.details,
            });
        }
        else {
            this.logger.warn('خطأ في الطلب:', logData);
        }
    }
    isProduction() {
        return this.configService.get('NODE_ENV') === 'production';
    }
};
exports.HttpExceptionFilter = HttpExceptionFilter;
exports.HttpExceptionFilter = HttpExceptionFilter = HttpExceptionFilter_1 = __decorate([
    (0, common_1.Catch)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], HttpExceptionFilter);
//# sourceMappingURL=http-exception.filter.js.map