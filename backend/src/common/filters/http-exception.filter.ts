import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request, Response } from 'express';

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

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  constructor(private readonly configService: ConfigService) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // تحديد نوع الخطأ ورمزه
    const errorInfo = this.getErrorInfo(exception);

    // إنشاء trace ID
    const traceId = this.generateTraceId();

    const errorResponse: ApiErrorResponse = {
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

    // تسجيل الخطأ
    this.logError(exception, errorInfo, request, traceId);

    // إرسال الاستجابة
    response.status(errorInfo.statusCode).json(errorResponse);
  }

  private getErrorInfo(exception: unknown): {
    statusCode: number;
    code: string;
    message: string;
    details?: any;
  } {
    // التحقق من أنواع الأخطاء المعروفة
    if (exception instanceof HttpException) {
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
        const errorResponse = response as any;
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

    // خطأ قاعدة البيانات
    if (this.isDatabaseError(exception)) {
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        code: 'DATABASE_ERROR',
        message: 'خطأ في قاعدة البيانات',
        details: this.isProduction() ? undefined : (exception as Error).message,
      };
    }

    // خطأ التحقق من البيانات
    if (this.isValidationError(exception)) {
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        code: 'VALIDATION_ERROR',
        message: 'خطأ في التحقق من البيانات',
        details: this.isProduction() ? undefined : (exception as Error).message,
      };
    }

    // خطأ عام
    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      code: 'SYSTEM_ERROR',
      message: 'حدث خطأ غير متوقع',
      details: this.isProduction() ? undefined : (exception as Error).message,
    };
  }

  private getErrorCodeFromStatus(status: number): string {
    const statusMap: Record<number, string> = {
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

  private isDatabaseError(exception: unknown): boolean {
    return (
      exception instanceof Error &&
      (exception.name === 'PrismaClientKnownRequestError' ||
       exception.name === 'PrismaClientUnknownRequestError' ||
       exception.name === 'PrismaClientValidationError' ||
       exception.message.toLowerCase().includes('database'))
    );
  }

  private isValidationError(exception: unknown): boolean {
    return (
      exception instanceof Error &&
      (exception.name === 'ValidationError' ||
       exception.name === 'BadRequestException' ||
       exception.message.toLowerCase().includes('validation'))
    );
  }

  private generateTraceId(): string {
    return `trace-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private logError(
    exception: unknown,
    errorInfo: any,
    request: Request,
    traceId: string,
  ): void {
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
        stack: this.isProduction() ? undefined : (exception as Error).stack,
        details: errorInfo.details,
      });
    } else {
      this.logger.warn('خطأ في الطلب:', logData);
    }
  }

  private isProduction(): boolean {
    return this.configService.get('NODE_ENV') === 'production';
  }
}
