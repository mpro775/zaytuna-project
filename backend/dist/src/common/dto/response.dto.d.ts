export declare class SuccessResponseDto<T = any> {
    success: true;
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
export declare class ErrorResponseDto {
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
export declare class BaseResponseDto {
    success: boolean;
    message?: string;
}
export declare class HealthCheckResponseDto extends BaseResponseDto {
    success: true;
    data: {
        status: 'ok';
        timestamp: string;
        uptime: number;
        version: string;
        services: {
            database: boolean;
            redis: boolean;
        };
    };
}
