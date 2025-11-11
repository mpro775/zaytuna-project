import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  constructor(private readonly configService: ConfigService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const startTime = Date.now();
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();

    const { method, url, ip, headers } = request;
    const userAgent = headers['user-agent'] || 'Unknown';
    const requestId = request.id || 'unknown';

    // تسجيل بداية الطلب
    this.logger.log(
      `➡️  ${method} ${url} - IP: ${ip} - UA: ${userAgent.substring(0, 50)}... - ID: ${requestId}`,
    );

    // تسجيل تفاصيل إضافية في وضع التطوير
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

    return next.handle().pipe(
      tap((data) => {
        const duration = Date.now() - startTime;
        const statusCode = response.statusCode;

        // تحديد لون التسجيل حسب رمز الحالة
        const logLevel = this.getLogLevel(statusCode);
        const emoji = this.getStatusEmoji(statusCode);

        this.logger[logLevel](
          `${emoji} ${method} ${url} - ${statusCode} - ${duration}ms - ID: ${requestId}`,
        );

        // تسجيل معلومات إضافية للطلبات البطيئة
        if (duration > 1000) {
          this.logger.warn(`🐌 طلب بطيء: ${method} ${url} - ${duration}ms`);
        }

        // تسجيل معلومات الأمان للطلبات الحساسة
        if (this.isSensitiveRequest(url)) {
          this.logger.log(`🔒 طلب حساس: ${method} ${url} - IP: ${ip}`);
        }
      }),
    );
  }

  private sanitizeRequestBody(body: any): any {
    if (!body || typeof body !== 'object') return body;

    const sanitized = { ...body };

    // إزالة الحقول الحساسة
    const sensitiveFields = ['password', 'passwordHash', 'token', 'refreshToken', 'secret'];
    sensitiveFields.forEach((field) => {
      if (field in sanitized) {
        sanitized[field] = '[REDACTED]';
      }
    });

    return sanitized;
  }

  private getLogLevel(statusCode: number): 'log' | 'warn' | 'error' {
    if (statusCode >= 500) return 'error';
    if (statusCode >= 400) return 'warn';
    return 'log';
  }

  private getStatusEmoji(statusCode: number): string {
    if (statusCode >= 500) return '💥';
    if (statusCode >= 400) return '⚠️';
    if (statusCode >= 300) return '➡️';
    return '✅';
  }

  private isSensitiveRequest(url: string): boolean {
    const sensitivePaths = [
      '/auth/login',
      '/auth/register',
      '/users/password',
      '/admin',
    ];

    return sensitivePaths.some((path) => url.includes(path));
  }
}
