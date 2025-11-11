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
var ResponseInterceptor_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResponseInterceptor = void 0;
const common_1 = require("@nestjs/common");
const operators_1 = require("rxjs/operators");
const config_1 = require("@nestjs/config");
let ResponseInterceptor = ResponseInterceptor_1 = class ResponseInterceptor {
    configService;
    logger = new common_1.Logger(ResponseInterceptor_1.name);
    constructor(configService) {
        this.configService = configService;
    }
    intercept(context, next) {
        const startTime = Date.now();
        const request = context.switchToHttp().getRequest();
        const response = context.switchToHttp().getResponse();
        if (!request.id) {
            request.id = this.generateRequestId();
        }
        return next.handle().pipe((0, operators_1.map)((data) => {
            const duration = Date.now() - startTime;
            const isPaginated = this.isPaginatedResponse(data);
            const responseData = isPaginated ? data.data : data;
            const pagination = isPaginated ? data.pagination : undefined;
            const apiResponse = {
                success: true,
                data: responseData,
                meta: {
                    timestamp: new Date().toISOString(),
                    requestId: request.id,
                    version: this.configService.get('app.apiVersion', '1.0.0'),
                    path: request.path,
                    method: request.method,
                    duration,
                },
            };
            if (pagination) {
                apiResponse.pagination = pagination;
            }
            this.logger.debug(`✅ ${request.method} ${request.path} - ${response.statusCode} - ${duration}ms`);
            return apiResponse;
        }));
    }
    generateRequestId() {
        return `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
    isPaginatedResponse(data) {
        return (data &&
            typeof data === 'object' &&
            'data' in data &&
            'pagination' in data &&
            data.pagination &&
            typeof data.pagination === 'object' &&
            'page' in data.pagination &&
            'limit' in data.pagination &&
            'total' in data.pagination &&
            'totalPages' in data.pagination);
    }
};
exports.ResponseInterceptor = ResponseInterceptor;
exports.ResponseInterceptor = ResponseInterceptor = ResponseInterceptor_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], ResponseInterceptor);
//# sourceMappingURL=response.interceptor.js.map