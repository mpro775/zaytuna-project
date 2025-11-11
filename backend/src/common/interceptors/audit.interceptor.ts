import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, tap, catchError } from 'rxjs';
import { AuditService } from '../../modules/audit/audit.service';
import {
  AUDIT_LOG,
  AuditLogOptions,
  getNestedValue,
  sanitizeObject,
  createSearchableText,
} from '../decorators/audit.decorators';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditInterceptor.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly auditService: AuditService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const auditOptions = this.reflector.get<AuditLogOptions>(
      AUDIT_LOG,
      context.getHandler()
    );

    if (!auditOptions) {
      // لا يوجد decorator للتدقيق، نمرر الطلب كما هو
      return next.handle();
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const startTime = Date.now();

    return next.handle().pipe(
      tap(async (result) => {
        // تسجيل العملية الناجحة
        if (auditOptions.logOnSuccess !== false) {
          await this.logOperation(auditOptions, context, result, null, startTime);
        }
      }),
      catchError(async (error) => {
        // تسجيل العملية الفاشلة
        if (auditOptions.logOnError !== false) {
          await this.logOperation(auditOptions, context, null, error, startTime);
        }

        // إعادة رمي الخطأ
        throw error;
      })
    );
  }

  /**
   * تسجيل العملية في سجل التدقيق
   */
  private async logOperation(
    options: AuditLogOptions,
    context: ExecutionContext,
    result: any,
    error: any,
    startTime: number,
  ): Promise<void> {
    try {
      const request = context.switchToHttp().getRequest();
      const user = request.user;
      const params = request.params;
      const query = request.query;
      const body = request.body;

      // تحديد نوع العملية
      let action: string = options.action || 'CUSTOM';
      if (options.customAction) {
        action = options.customAction;
      } else if (!options.action) {
        // استنتاج نوع العملية من اسم الـ method
        const method = context.getHandler().name.toLowerCase();
        if (method.includes('create')) action = 'CREATE';
        else if (method.includes('update')) action = 'UPDATE';
        else if (method.includes('delete')) action = 'DELETE';
        else if (method.includes('get') || method.includes('find')) action = 'READ';
      }

      // تحديد الكيان
      let entity = options.entity;
      if (!entity) {
        // استنتاج الكيان من اسم الـ controller
        const controllerName = context.getClass().name.toLowerCase();
        if (controllerName.includes('user')) entity = 'User';
        else if (controllerName.includes('product')) entity = 'Product';
        else if (controllerName.includes('sale')) entity = 'SalesInvoice';
        else if (controllerName.includes('inventory')) entity = 'StockItem';
        else if (controllerName.includes('customer')) entity = 'Customer';
        else if (controllerName.includes('supplier')) entity = 'Supplier';
        else if (controllerName.includes('account')) entity = 'GLAccount';
        else entity = context.getClass().name.replace('Controller', '');
      }

      // تحديد معرف الكيان
      let entityId = '';
      if (options.entityIdParam) {
        entityId = params[options.entityIdParam] || query[options.entityIdParam] || '';
      } else if (options.entityIdProperty && result) {
        entityId = getNestedValue(result, options.entityIdProperty) || '';
      } else {
        // محاولة العثور على id في النتيجة أو المعاملات
        entityId = result?.id || result?.data?.id || params.id || params.entityId || '';
      }

      // تحديد المرجع
      let referenceType = options.referenceType;
      let referenceId = '';

      if (options.referenceIdParam) {
        referenceId = params[options.referenceIdParam] || query[options.referenceIdParam] || '';
      } else if (options.referenceIdProperty && result) {
        referenceId = getNestedValue(result, options.referenceIdProperty) || '';
      }

      // تحديد الوحدة
      let module = options.module;
      if (!module) {
        const controllerName = context.getClass().name.toLowerCase();
        if (controllerName.includes('user') || controllerName.includes('auth')) module = 'auth';
        else if (controllerName.includes('product') || controllerName.includes('category')) module = 'products';
        else if (controllerName.includes('sale')) module = 'sales';
        else if (controllerName.includes('inventory') || controllerName.includes('stock')) module = 'inventory';
        else if (controllerName.includes('customer')) module = 'customer';
        else if (controllerName.includes('supplier') || controllerName.includes('purchase')) module = 'purchasing';
        else if (controllerName.includes('account')) module = 'accounting';
        else if (controllerName.includes('report')) module = 'reporting';
        else if (controllerName.includes('audit')) module = 'audit';
      }

      // تحضير البيانات
      let oldValues = {};
      let newValues = {};

      if (options.includeRequestBody && body) {
        newValues = sanitizeObject(body, options.excludeFields);
      }

      if (options.includeResponseBody && result) {
        if (action === 'UPDATE' && body) {
          // للتحديث، نفترض أن body يحتوي على القيم الجديدة
          newValues = sanitizeObject(body, options.excludeFields);
          // oldValues يمكن أن يتم تحديده لاحقاً من خلال middleware آخر
        } else if (action === 'CREATE' && result) {
          newValues = sanitizeObject(result, options.excludeFields);
        }
      }

      // التحقق من الشرط
      if (options.condition && !options.condition(result, error)) {
        return; // لا نسجل العملية
      }

      // تحديد الخطورة والفئة
      let severity = options.severity || 'info';
      let category = options.category || 'business';

      if (error) {
        severity = 'error';
        category = 'system';
      }

      // إنشاء النص القابل للبحث
      const searchableText = createSearchableText({
        action,
        entity,
        entityId,
        user: user?.username || user?.email,
        module,
        ...newValues,
      });

      // تحديد التفاصيل الإضافية
      const details: Record<string, any> = {
        method: request.method,
        url: request.url,
        duration: Date.now() - startTime,
        userAgent: request.get('User-Agent'),
      };

      if (error) {
        details.error = {
          message: error.message,
          stack: error.stack?.substring(0, 500), // اقتصار الـ stack trace
        };
      }

      // تسجيل العملية
      await this.auditService.log({
        action: action as any,
        entity,
        entityId,
        details,
        oldValues,
        newValues,
        referenceType,
        referenceId,
        module,
        severity,
        category,
        success: !error,
        errorMessage: error?.message,
        searchableText,
      });

    } catch (auditError) {
      // لا نرمي خطأ هنا لأن فشل التدقيق لا يجب أن يوقف العملية الأساسية
      this.logger.error('فشل في تسجيل عملية التدقيق', auditError);
    }
  }
}
