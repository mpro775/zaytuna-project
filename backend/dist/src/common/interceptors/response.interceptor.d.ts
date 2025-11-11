import { NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { ConfigService } from '@nestjs/config';
export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    meta?: {
        timestamp: string;
        requestId: string;
        version: string;
        path: string;
        method: string;
        duration: number;
    };
    pagination?: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
    message?: string;
}
export declare class ResponseInterceptor<T> implements NestInterceptor<T, ApiResponse<T>> {
    private readonly configService;
    private readonly logger;
    constructor(configService: ConfigService);
    intercept(context: ExecutionContext, next: CallHandler): Observable<ApiResponse<T>>;
    private generateRequestId;
    private isPaginatedResponse;
}
