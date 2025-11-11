import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
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

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, ApiResponse<T>> {
  private readonly logger = new Logger(ResponseInterceptor.name);

  constructor(private readonly configService: ConfigService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<ApiResponse<T>> {
    const startTime = Date.now();
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();

    // إضافة request ID إذا لم يكن موجوداً
    if (!request.id) {
      request.id = this.generateRequestId();
    }

    return next.handle().pipe(
      map((data) => {
        const duration = Date.now() - startTime;

        // تحديد نوع البيانات (مع pagination أو بدون)
        const isPaginated = this.isPaginatedResponse(data);
        const responseData = isPaginated ? data.data : data;
        const pagination = isPaginated ? data.pagination : undefined;

        const apiResponse: ApiResponse<T> = {
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

        // تسجيل الاستجابة الناجحة
        this.logger.debug(
          `✅ ${request.method} ${request.path} - ${response.statusCode} - ${duration}ms`,
        );

        return apiResponse;
      }),
    );
  }

  private generateRequestId(): string {
    return `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private isPaginatedResponse(data: any): boolean {
    return (
      data &&
      typeof data === 'object' &&
      'data' in data &&
      'pagination' in data &&
      data.pagination &&
      typeof data.pagination === 'object' &&
      'page' in data.pagination &&
      'limit' in data.pagination &&
      'total' in data.pagination &&
      'totalPages' in data.pagination
    );
  }
}
