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
var ValidationExceptionFilter_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValidationExceptionFilter = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
let ValidationExceptionFilter = ValidationExceptionFilter_1 = class ValidationExceptionFilter {
    configService;
    logger = new common_1.Logger(ValidationExceptionFilter_1.name);
    constructor(configService) {
        this.configService = configService;
    }
    catch(exception, host) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        const request = ctx.getRequest();
        const exceptionResponse = exception.getResponse();
        const validationErrors = this.extractValidationErrors(exceptionResponse);
        const errorResponse = {
            success: false,
            error: {
                code: 'VALIDATION_ERROR',
                message: 'خطأ في التحقق من البيانات',
                details: this.isProduction() ? undefined : validationErrors,
                traceId: this.generateTraceId(),
                timestamp: new Date().toISOString(),
                path: request.path,
                method: request.method,
            },
        };
        this.logger.warn('خطأ في التحقق من البيانات:', {
            path: request.path,
            method: request.method,
            errors: validationErrors,
            traceId: errorResponse.error.traceId,
        });
        response.status(400).json(errorResponse);
    }
    extractValidationErrors(response) {
        if (typeof response === 'string') {
            return [{ field: 'general', reason: response }];
        }
        if (response.message && Array.isArray(response.message)) {
            return response.message.map((error) => this.parseValidationError(error));
        }
        if (response.message && typeof response.message === 'string') {
            return [{ field: 'general', reason: response.message }];
        }
        return [{ field: 'general', reason: 'خطأ في التحقق من البيانات' }];
    }
    parseValidationError(error) {
        if (typeof error === 'string') {
            const fieldMatch = error.match(/^(.*?)\s/);
            const field = fieldMatch ? fieldMatch[1] : 'unknown';
            return {
                field,
                reason: error,
            };
        }
        const field = error.property || 'unknown';
        const constraints = error.constraints || {};
        const firstConstraintKey = Object.keys(constraints)[0];
        const reason = firstConstraintKey ? constraints[firstConstraintKey] : 'خطأ في التحقق';
        return {
            field,
            reason,
            value: error.value,
        };
    }
    generateTraceId() {
        return `trace-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
    isProduction() {
        return this.configService.get('NODE_ENV') === 'production';
    }
};
exports.ValidationExceptionFilter = ValidationExceptionFilter;
exports.ValidationExceptionFilter = ValidationExceptionFilter = ValidationExceptionFilter_1 = __decorate([
    (0, common_1.Catch)(common_1.BadRequestException),
    __metadata("design:paramtypes", [config_1.ConfigService])
], ValidationExceptionFilter);
//# sourceMappingURL=validation-exception.filter.js.map