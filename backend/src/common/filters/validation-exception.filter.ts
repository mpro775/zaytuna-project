import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ValidationError } from 'class-validator';

interface ValidationErrorDetail {
  field: string;
  reason: string;
  value?: any;
}

@Catch(BadRequestException)
export class ValidationExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(ValidationExceptionFilter.name);

  constructor(private readonly configService: ConfigService) {}

  catch(exception: BadRequestException, host: ArgumentsHost): void {
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

  private extractValidationErrors(response: any): ValidationErrorDetail[] {
    if (typeof response === 'string') {
      return [{ field: 'general', reason: response }];
    }

    if (response.message && Array.isArray(response.message)) {
      return response.message.map((error: any) => this.parseValidationError(error));
    }

    if (response.message && typeof response.message === 'string') {
      return [{ field: 'general', reason: response.message }];
    }

    return [{ field: 'general', reason: 'خطأ في التحقق من البيانات' }];
  }

  private parseValidationError(error: ValidationError | string): ValidationErrorDetail {
    if (typeof error === 'string') {
      // محاولة استخراج اسم الحقل من الرسالة
      const fieldMatch = error.match(/^(.*?)\s/);
      const field = fieldMatch ? fieldMatch[1] : 'unknown';
      return {
        field,
        reason: error,
      };
    }

    // معالجة ValidationError من class-validator
    const field = error.property || 'unknown';
    const constraints = error.constraints || {};

    // الحصول على أول constraint
    const firstConstraintKey = Object.keys(constraints)[0];
    const reason = firstConstraintKey ? constraints[firstConstraintKey] : 'خطأ في التحقق';

    return {
      field,
      reason,
      value: error.value,
    };
  }

  private generateTraceId(): string {
    return `trace-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private isProduction(): boolean {
    return this.configService.get('NODE_ENV') === 'production';
  }
}
