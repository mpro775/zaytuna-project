import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../shared/database/prisma.service';
import { AuditService } from '../audit/audit.service';

export interface TemplateVariables {
  [key: string]: string | number | boolean;
}

export interface CreateTemplateData {
  name: string;
  description?: string;
  type: 'email' | 'sms' | 'whatsapp' | 'push' | 'in_app';
  subject?: string;
  content: string;
  htmlContent?: string;
  variables?: Record<string, any>;
  language?: string;
  locale?: string;
  event: string;
  module: string;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  channels?: string[];
  isDefault?: boolean;
}

export interface UpdateTemplateData extends Partial<CreateTemplateData> {
  isActive?: boolean;
}

@Injectable()
export class NotificationTemplateService {
  private readonly logger = new Logger(NotificationTemplateService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  /**
   * إنشاء قالب جديد
   */
  async createTemplate(
    templateData: CreateTemplateData,
    createdBy?: string,
  ): Promise<any> {
    try {
      this.logger.log(`إنشاء قالب إشعار جديد: ${templateData.name}`);

      // التحقق من عدم وجود قالب بنفس الاسم
      const existing = await this.prisma.notificationTemplate.findUnique({
        where: { name: templateData.name },
      });

      if (existing) {
        throw new Error(`القالب موجود بالفعل: ${templateData.name}`);
      }

      // إذا كان هذا القالب الافتراضي، إلغاء الافتراضي السابق
      if (templateData.isDefault) {
        await this.prisma.notificationTemplate.updateMany({
          where: {
            event: templateData.event,
            type: templateData.type,
            isDefault: true,
          },
          data: { isDefault: false },
        });
      }

      const template = await this.prisma.notificationTemplate.create({
        data: {
          name: templateData.name,
          description: templateData.description,
          type: templateData.type,
          subject: templateData.subject,
          content: templateData.content,
          htmlContent: templateData.htmlContent,
          variables: templateData.variables as any,
          language: templateData.language || 'ar',
          locale: templateData.locale || 'ar-SA',
          event: templateData.event,
          module: templateData.module,
          priority: templateData.priority || 'normal',
          channels: templateData.channels as any,
          isDefault: templateData.isDefault || false,
          createdBy,
        },
      });

      // تسجيل في سجل التدقيق
      await this.auditService.log({
        action: 'TEMPLATE_CREATED',
        entity: 'NotificationTemplate',
        entityId: template.id,
        details: templateData,
        module: 'notification',
        category: 'configuration',
      });

      this.logger.log(`تم إنشاء القالب بنجاح: ${template.id}`);
      return template;
    } catch (error) {
      this.logger.error(`فشل في إنشاء القالب: ${templateData.name}`, error);
      throw error;
    }
  }

  /**
   * تحديث قالب موجود
   */
  async updateTemplate(
    templateId: string,
    updateData: UpdateTemplateData,
    updatedBy?: string,
  ): Promise<any> {
    try {
      this.logger.log(`تحديث القالب: ${templateId}`);

      const existing = await this.prisma.notificationTemplate.findUnique({
        where: { id: templateId },
      });

      if (!existing) {
        throw new Error(`القالب غير موجود: ${templateId}`);
      }

      // إذا كان التحديث يجعل هذا القالب الافتراضي، إلغاء الافتراضي السابق
      if (updateData.isDefault) {
        await this.prisma.notificationTemplate.updateMany({
          where: {
            event: existing.event,
            type: existing.type,
            isDefault: true,
            id: { not: templateId },
          },
          data: { isDefault: false },
        });
      }

      const template = await this.prisma.notificationTemplate.update({
        where: { id: templateId },
        data: {
          ...updateData,
          variables: updateData.variables as any,
          channels: updateData.channels as any,
          updatedAt: new Date(),
        },
      });

      // تسجيل في سجل التدقيق
      await this.auditService.log({
        action: 'TEMPLATE_UPDATED',
        entity: 'NotificationTemplate',
        entityId: templateId,
        details: updateData,
        oldValues: existing,
        newValues: template,
        module: 'notification',
        category: 'configuration',
      });

      this.logger.log(`تم تحديث القالب بنجاح: ${templateId}`);
      return template;
    } catch (error) {
      this.logger.error(`فشل في تحديث القالب: ${templateId}`, error);
      throw error;
    }
  }

  /**
   * حذف قالب
   */
  async deleteTemplate(templateId: string, deletedBy?: string): Promise<void> {
    try {
      this.logger.log(`حذف القالب: ${templateId}`);

      const existing = await this.prisma.notificationTemplate.findUnique({
        where: { id: templateId },
      });

      if (!existing) {
        throw new Error(`القالب غير موجود: ${templateId}`);
      }

      // حذف القالب
      await this.prisma.notificationTemplate.delete({
        where: { id: templateId },
      });

      // تسجيل في سجل التدقيق
      await this.auditService.log({
        action: 'TEMPLATE_DELETED',
        entity: 'NotificationTemplate',
        entityId: templateId,
        details: { template: existing },
        module: 'notification',
        category: 'configuration',
      });

      this.logger.log(`تم حذف القالب بنجاح: ${templateId}`);
    } catch (error) {
      this.logger.error(`فشل في حذف القالب: ${templateId}`, error);
      throw error;
    }
  }

  /**
   * الحصول على قالب بالمعرف
   */
  async getTemplate(templateId: string): Promise<any | null> {
    try {
      return await this.prisma.notificationTemplate.findUnique({
        where: { id: templateId },
      });
    } catch (error) {
      this.logger.error(`فشل في الحصول على القالب: ${templateId}`, error);
      return null;
    }
  }

  /**
   * الحصول على قالب بالاسم
   */
  async getTemplateByName(name: string): Promise<any | null> {
    try {
      return await this.prisma.notificationTemplate.findUnique({
        where: { name },
      });
    } catch (error) {
      this.logger.error(`فشل في الحصول على القالب بالاسم: ${name}`, error);
      return null;
    }
  }

  /**
   * الحصول على القالب الافتراضي لحدث معين
   */
  async getDefaultTemplate(event: string, type: string): Promise<any | null> {
    try {
      return await this.prisma.notificationTemplate.findFirst({
        where: {
          event,
          type,
          isDefault: true,
          isActive: true,
        },
      });
    } catch (error) {
      this.logger.error(
        `فشل في الحصول على القالب الافتراضي: ${event} - ${type}`,
        error,
      );
      return null;
    }
  }

  /**
   * البحث في القوالب
   */
  async searchTemplates(filters: {
    type?: string;
    event?: string;
    module?: string;
    language?: string;
    isActive?: boolean;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    templates: any[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    try {
      const {
        type,
        event,
        module,
        language,
        isActive,
        search,
        page = 1,
        limit = 20,
      } = filters;

      const where: any = {};

      if (type) where.type = type;
      if (event) where.event = event;
      if (module) where.module = module;
      if (language) where.language = language;
      if (isActive !== undefined) where.isActive = isActive;

      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { content: { contains: search, mode: 'insensitive' } },
        ];
      }

      const [templates, total] = await Promise.all([
        this.prisma.notificationTemplate.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * limit,
          take: limit,
        }),
        this.prisma.notificationTemplate.count({ where }),
      ]);

      const totalPages = Math.ceil(total / limit);

      return {
        templates,
        total,
        page,
        limit,
        totalPages,
      };
    } catch (error) {
      this.logger.error('فشل في البحث في القوالب', error);
      throw error;
    }
  }

  /**
   * الحصول على قائمة الأحداث المتاحة
   */
  async getAvailableEvents(): Promise<
    Array<{
      event: string;
      module: string;
      description: string;
    }>
  > {
    return [
      // أحداث المبيعات
      {
        event: 'sale_created',
        module: 'sales',
        description: 'إنشاء فاتورة مبيعات',
      },
      {
        event: 'sale_updated',
        module: 'sales',
        description: 'تحديث فاتورة مبيعات',
      },
      {
        event: 'sale_cancelled',
        module: 'sales',
        description: 'إلغاء فاتورة مبيعات',
      },
      {
        event: 'payment_received',
        module: 'sales',
        description: 'استلام دفعة',
      },
      { event: 'payment_failed', module: 'sales', description: 'فشل في الدفع' },

      // أحداث المرتجعات
      {
        event: 'return_created',
        module: 'returns',
        description: 'إنشاء مرتجع',
      },
      {
        event: 'return_processed',
        module: 'returns',
        description: 'معالجة مرتجع',
      },
      {
        event: 'credit_note_issued',
        module: 'returns',
        description: 'إصدار إشعار دائن',
      },

      // أحداث المخزون
      { event: 'stock_low', module: 'inventory', description: 'مخزون منخفض' },
      { event: 'stock_out', module: 'inventory', description: 'نفاد المخزون' },
      {
        event: 'stock_adjusted',
        module: 'inventory',
        description: 'تعديل المخزون',
      },

      // أحداث المشتريات
      {
        event: 'purchase_order_created',
        module: 'purchasing',
        description: 'إنشاء أمر شراء',
      },
      {
        event: 'purchase_invoice_received',
        module: 'purchasing',
        description: 'استلام فاتورة شراء',
      },
      {
        event: 'supplier_payment_due',
        module: 'purchasing',
        description: 'استحقاق دفع لمورد',
      },

      // أحداث العملاء
      {
        event: 'customer_registered',
        module: 'customer',
        description: 'تسجيل عميل جديد',
      },
      {
        event: 'customer_birthday',
        module: 'customer',
        description: 'عيد ميلاد العميل',
      },
      {
        event: 'loyalty_points_earned',
        module: 'customer',
        description: 'كسب نقاط ولاء',
      },
      {
        event: 'loyalty_tier_upgraded',
        module: 'customer',
        description: 'ترقية درجة الولاء',
      },

      // أحداث المحاسبة
      {
        event: 'journal_entry_posted',
        module: 'accounting',
        description: 'ترحيل قيد يومي',
      },
      {
        event: 'period_closed',
        module: 'accounting',
        description: 'إغلاق فترة محاسبية',
      },
      {
        event: 'budget_exceeded',
        module: 'accounting',
        description: 'تجاوز الميزانية',
      },

      // أحداث النظام
      {
        event: 'user_login_failed',
        module: 'auth',
        description: 'فشل في تسجيل الدخول',
      },
      {
        event: 'password_reset',
        module: 'auth',
        description: 'إعادة تعيين كلمة المرور',
      },
      { event: 'admin_action', module: 'admin', description: 'إجراء إداري' },

      // أحداث التقارير
      {
        event: 'report_generated',
        module: 'reporting',
        description: 'توليد تقرير',
      },
      {
        event: 'alert_triggered',
        module: 'reporting',
        description: 'تشغيل تنبيه',
      },
    ];
  }

  /**
   * الحصول على المتغيرات المتاحة لقالب معين
   */
  async getTemplateVariables(
    event: string,
    module: string,
  ): Promise<Record<string, any>> {
    const variables: Record<string, any> = {
      // متغيرات عامة
      app_name: {
        type: 'string',
        description: 'اسم التطبيق',
        example: 'نظام زيتونة',
      },
      current_date: {
        type: 'date',
        description: 'التاريخ الحالي',
        example: '2025-01-11',
      },
      current_time: {
        type: 'time',
        description: 'الوقت الحالي',
        example: '14:30:00',
      },

      // متغيرات المستخدم
      user_name: {
        type: 'string',
        description: 'اسم المستخدم',
        example: 'أحمد محمد',
      },
      user_email: {
        type: 'email',
        description: 'بريد المستخدم',
        example: 'ahmed@example.com',
      },
      user_phone: {
        type: 'phone',
        description: 'هاتف المستخدم',
        example: '+966501234567',
      },
    };

    // إضافة متغيرات محددة حسب الوحدة والحدث
    switch (module) {
      case 'sales':
        Object.assign(variables, {
          invoice_number: {
            type: 'string',
            description: 'رقم الفاتورة',
            example: 'INV-001',
          },
          invoice_amount: {
            type: 'number',
            description: 'مبلغ الفاتورة',
            example: '299.99',
          },
          invoice_date: {
            type: 'date',
            description: 'تاريخ الفاتورة',
            example: '2025-01-11',
          },
          customer_name: {
            type: 'string',
            description: 'اسم العميل',
            example: 'شركة أبو بكر',
          },
          payment_status: {
            type: 'string',
            description: 'حالة الدفع',
            example: 'مدفوع',
          },
        });
        break;

      case 'inventory':
        Object.assign(variables, {
          product_name: {
            type: 'string',
            description: 'اسم المنتج',
            example: 'زيت زيتون بكر',
          },
          product_sku: {
            type: 'string',
            description: 'رمز المنتج',
            example: 'OLIVE-OIL-001',
          },
          current_stock: {
            type: 'number',
            description: 'المخزون الحالي',
            example: '15',
          },
          minimum_stock: {
            type: 'number',
            description: 'الحد الأدنى',
            example: '10',
          },
          warehouse_name: {
            type: 'string',
            description: 'اسم المخزن',
            example: 'المخزن الرئيسي',
          },
        });
        break;

      case 'customer':
        Object.assign(variables, {
          customer_name: {
            type: 'string',
            description: 'اسم العميل',
            example: 'أحمد محمد',
          },
          customer_email: {
            type: 'email',
            description: 'بريد العميل',
            example: 'ahmed@example.com',
          },
          loyalty_points: {
            type: 'number',
            description: 'نقاط الولاء',
            example: '150',
          },
          loyalty_tier: {
            type: 'string',
            description: 'درجة الولاء',
            example: 'ذهبي',
          },
          total_purchases: {
            type: 'number',
            description: 'إجمالي المشتريات',
            example: '2500.00',
          },
        });
        break;

      case 'accounting':
        Object.assign(variables, {
          journal_number: {
            type: 'string',
            description: 'رقم القيد',
            example: 'JRN-001',
          },
          account_name: {
            type: 'string',
            description: 'اسم الحساب',
            example: 'الصندوق',
          },
          debit_amount: {
            type: 'number',
            description: 'مبلغ المدين',
            example: '1000.00',
          },
          credit_amount: {
            type: 'number',
            description: 'مبلغ الدائن',
            example: '1000.00',
          },
          period_name: {
            type: 'string',
            description: 'اسم الفترة',
            example: 'يناير 2025',
          },
        });
        break;
    }

    return variables;
  }

  /**
   * معاينة القالب مع المتغيرات
   */
  async previewTemplate(
    templateId: string,
    variables: TemplateVariables,
  ): Promise<{
    subject?: string;
    content: string;
    htmlContent?: string;
  }> {
    try {
      const template = await this.getTemplate(templateId);
      if (!template) {
        throw new Error(`القالب غير موجود: ${templateId}`);
      }

      return {
        subject: template.subject
          ? this.processTemplate(template.subject, variables)
          : undefined,
        content: this.processTemplate(template.content, variables),
        htmlContent: template.htmlContent
          ? this.processTemplate(template.htmlContent, variables)
          : undefined,
      };
    } catch (error) {
      this.logger.error(`فشل في معاينة القالب: ${templateId}`, error);
      throw error;
    }
  }

  /**
   * استنساخ قالب
   */
  async cloneTemplate(
    templateId: string,
    newName: string,
    clonedBy?: string,
  ): Promise<any> {
    try {
      const original = await this.getTemplate(templateId);
      if (!original) {
        throw new Error(`القالب غير موجود: ${templateId}`);
      }

      // التحقق من عدم وجود قالب بنفس الاسم الجديد
      const existing = await this.getTemplateByName(newName);
      if (existing) {
        throw new Error(`القالب موجود بالفعل: ${newName}`);
      }

      const cloned = await this.prisma.notificationTemplate.create({
        data: {
          name: newName,
          description: original.description
            ? `${original.description} (نسخة)`
            : 'نسخة من قالب',
          type: original.type,
          subject: original.subject,
          content: original.content,
          htmlContent: original.htmlContent,
          variables: original.variables,
          language: original.language,
          locale: original.locale,
          event: original.event,
          module: original.module,
          priority: original.priority,
          channels: original.channels,
          isDefault: false, // النسخة ليست افتراضية
          createdBy: clonedBy,
        },
      });

      // تسجيل في سجل التدقيق
      await this.auditService.log({
        action: 'TEMPLATE_CLONED',
        entity: 'NotificationTemplate',
        entityId: cloned.id,
        details: {
          originalTemplateId: templateId,
          newName,
        },
        module: 'notification',
        category: 'configuration',
      });

      this.logger.log(`تم استنساخ القالب بنجاح: ${templateId} -> ${cloned.id}`);
      return cloned;
    } catch (error) {
      this.logger.error(`فشل في استنساخ القالب: ${templateId}`, error);
      throw error;
    }
  }

  /**
   * إنشاء قوالب افتراضية
   */
  async createDefaultTemplates(): Promise<void> {
    try {
      this.logger.log('إنشاء القوالب الافتراضية...');

      const defaultTemplates = [
        // قالب إيميل للفاتورة الجديدة
        {
          name: 'sale_invoice_created_email',
          description: 'قالب إيميل لإشعار إنشاء فاتورة مبيعات',
          type: 'email',
          subject: 'فاتورة جديدة رقم ${invoice_number}',
          content: `مرحباً \${customer_name}،

تم إنشاء فاتورة جديدة لك:

رقم الفاتورة: \${invoice_number}
المبلغ: \${invoice_amount} ريال
التاريخ: \${invoice_date}

يمكنك مراجعة الفاتورة من خلال النظام.

شكراً لتعاملك معنا!
\${app_name}`,
          htmlContent: `<p>مرحباً <strong>\${customer_name}</strong>،</p>

<p>تم إنشاء فاتورة جديدة لك:</p>

<ul>
<li><strong>رقم الفاتورة:</strong> \${invoice_number}</li>
<li><strong>المبلغ:</strong> \${invoice_amount} ريال</li>
<li><strong>التاريخ:</strong> \${invoice_date}</li>
</ul>

<p>يمكنك مراجعة الفاتورة من خلال <a href="#">النظام</a>.</p>

<p>شكراً لتعاملك معنا!<br>
<strong>\${app_name}</strong></p>`,
          event: 'sale_created',
          module: 'sales',
          isDefault: true,
        },

        // قالب SMS للفاتورة الجديدة
        {
          name: 'sale_invoice_created_sms',
          description: 'قالب SMS لإشعار إنشاء فاتورة مبيعات',
          type: 'sms',
          content: `مرحباً \${customer_name}، تم إنشاء فاتورة رقم \${invoice_number} بمبلغ \${invoice_amount} ريال. \${app_name}`,
          event: 'sale_created',
          module: 'sales',
          isDefault: true,
        },

        // قالب إيميل لمخزون منخفض
        {
          name: 'inventory_stock_low_email',
          description: 'قالب إيميل لإشعار مخزون منخفض',
          type: 'email',
          subject: 'تنبيه: مخزون منخفض للمنتج \${product_name}',
          content: `مرحباً،

يُرجى ملاحظة أن مخزون المنتج \${product_name} منخفض:

المنتج: \${product_name}
الرمز: \${product_sku}
المخزون الحالي: \${current_stock}
الحد الأدنى: \${minimum_stock}
المخزن: \${warehouse_name}

يرجى إعادة التزويد في أقرب وقت ممكن.

\${app_name}`,
          event: 'stock_low',
          module: 'inventory',
          isDefault: true,
        },

        // قالب دفع لمخزون منخفض
        {
          name: 'inventory_stock_low_push',
          description: 'قالب دفع لإشعار مخزون منخفض',
          type: 'push',
          subject: 'مخزون منخفض',
          content: `مخزون \${product_name} منخفض: \${current_stock} قطعة متبقية`,
          event: 'stock_low',
          module: 'inventory',
          isDefault: true,
        },

        // قالب WhatsApp لتذكير عيد ميلاد
        {
          name: 'customer_birthday_whatsapp',
          description: 'قالب WhatsApp لتذكير عيد ميلاد العميل',
          type: 'whatsapp',
          content: `🎉 كل عام وأنت بخير \${customer_name}! 🎉

نتمنى لك عيداً ميلاداً سعيداً مليئاً بالفرح والسعادة.

شكراً لثقتك بنا!
\${app_name}`,
          event: 'customer_birthday',
          module: 'customer',
          isDefault: true,
        },

        // قالب إيميل لترقية درجة الولاء
        {
          name: 'customer_loyalty_upgrade_email',
          description: 'قالب إيميل لترقية درجة ولاء العميل',
          type: 'email',
          subject: 'تهانينا! تم ترقية درجة ولائك',
          content: `مرحباً \${customer_name}،

تهانينا! لقد تم ترقية درجة ولائك إلى \${loyalty_tier}.

مع تحياتنا،

\${app_name}`,
          event: 'loyalty_tier_upgraded',
          module: 'customer',
          isDefault: true,
        },
      ];

      for (const templateData of defaultTemplates) {
        try {
          await this.createTemplate(
            templateData as CreateTemplateData,
            'system',
          );
          this.logger.log(`تم إنشاء القالب الافتراضي: ${templateData.name}`);
        } catch (error) {
          // إذا كان القالب موجود بالفعل، تخطيه
          if (error.message.includes('القالب موجود بالفعل')) {
            this.logger.log(
              `القالب موجود بالفعل، تم تخطيه: ${templateData.name}`,
            );
          } else {
            throw error;
          }
        }
      }

      this.logger.log('تم إنشاء جميع القوالب الافتراضية بنجاح');
    } catch (error) {
      this.logger.error('فشل في إنشاء القوالب الافتراضية', error);
      throw error;
    }
  }

  // ========== PRIVATE METHODS ==========

  /**
   * معالجة محتوى القالب
   */
  private processTemplate(
    template: string,
    variables: TemplateVariables,
  ): string {
    let processed = template;

    // استبدال المتغيرات
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`\\$\\{${key}\\}`, 'g');
      processed = processed.replace(regex, String(value));
    }

    return processed;
  }
}
