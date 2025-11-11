import { ExceptionFilter, ArgumentsHost } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
export interface ApiErrorResponse {
    success: false;
    error: {
        code: string;
        message: string;
        details?: any;
        traceId: string;
        timestamp: string;
        path: string;
        method: string;
    };
}
export declare class HttpExceptionFilter implements ExceptionFilter {
    private readonly configService;
    private readonly logger;
    constructor(configService: ConfigService);
    catch(exception: unknown, host: ArgumentsHost): void;
    private getErrorInfo;
    private getErrorCodeFromStatus;
    private isDatabaseError;
    private isValidationError;
    private generateTraceId;
    private logError;
    private isProduction;
}
