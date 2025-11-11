import {
  Injectable,
  ArgumentMetadata,
  BadRequestException,
  ValidationPipe,
  ValidationError,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class CustomValidationPipe extends ValidationPipe {
  constructor(private readonly configService: ConfigService) {
    super({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      forbidUnknownValues: false,
      disableErrorMessages: false,
      validationError: {
        target: false,
        value: false,
      },
    });
  }

  protected mapChildrenToValidationErrors(
    error: ValidationError,
    parentPath?: string,
  ): ValidationError[] {
    const errors = super.mapChildrenToValidationErrors(error, parentPath);

    // تخصيص رسائل الخطأ العربية
    errors.forEach((err) => {
      if (err.constraints) {
        Object.keys(err.constraints).forEach((key) => {
          err.constraints![key] = this.translateValidationMessage(
            err.constraints![key],
            err.property,
            err.value,
          );
        });
      }
    });

    return errors;
  }

  private translateValidationMessage(
    message: string,
    property: string,
    value: any,
  ): string {
    // قاموس الترجمة للرسائل الشائعة
    const translations: Record<string, string> = {
      'should not be empty': `الحقل ${property} مطلوب`,
      'must be a string': `الحقل ${property} يجب أن يكون نص`,
      'must be a number': `الحقل ${property} يجب أن يكون رقم`,
      'must be an integer number': `الحقل ${property} يجب أن يكون رقم صحيح`,
      'must be a boolean': `الحقل ${property} يجب أن يكون قيمة منطقية`,
      'must be an email': `الحقل ${property} يجب أن يكون بريد إلكتروني صحيح`,
      'must be longer than or equal to': `الحقل ${property} يجب أن يكون طوله على الأقل`,
      'must be shorter than or equal to': `الحقل ${property} يجب أن يكون طوله على الأكثر`,
      'must match': `الحقل ${property} يجب أن يطابق النمط المطلوب`,
    };

    // البحث عن الترجمة المناسبة
    for (const [english, arabic] of Object.entries(translations)) {
      if (message.includes(english)) {
        return arabic;
      }
    }

    // إرجاع الرسالة الأصلية إذا لم توجد ترجمة
    return message;
  }

  protected flattenValidationErrors(errors: ValidationError[]): string[] {
    const messages = super.flattenValidationErrors(errors);

    // إضافة تفاصيل إضافية في وضع التطوير
    if (this.configService.get('NODE_ENV') !== 'production') {
      return messages.map((message, index) => {
        const error = errors[index];
        if (error && error.constraints) {
          const constraintKeys = Object.keys(error.constraints);
          if (constraintKeys.length > 0) {
            return `${message} (${constraintKeys[0]})`;
          }
        }
        return message;
      });
    }

    return messages;
  }
}
