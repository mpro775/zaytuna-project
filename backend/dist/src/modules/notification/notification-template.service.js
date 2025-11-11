"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var NotificationTemplateService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationTemplateService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../shared/database/prisma.service");
const audit_service_1 = require("../audit/audit.service");
let NotificationTemplateService = NotificationTemplateService_1 = class NotificationTemplateService {
    prisma;
    auditService;
    logger = new common_1.Logger(NotificationTemplateService_1.name);
    constructor(prisma, auditService) {
        this.prisma = prisma;
        this.auditService = auditService;
    }
    async createTemplate(templateData, createdBy) {
        try {
            this.logger.log(`إنشاء قالب إشعار جديد: ${templateData.name}`);
            const existing = await this.prisma.notificationTemplate.findUnique({
                where: { name: templateData.name },
            });
            if (existing) {
                throw new Error(`القالب موجود بالفعل: ${templateData.name}`);
            }
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
                    variables: templateData.variables,
                    language: templateData.language || 'ar',
                    locale: templateData.locale || 'ar-SA',
                    event: templateData.event,
                    module: templateData.module,
                    priority: templateData.priority || 'normal',
                    channels: templateData.channels,
                    isDefault: templateData.isDefault || false,
                    createdBy,
                },
            });
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
        }
        catch (error) {
            this.logger.error(`فشل في إنشاء القالب: ${templateData.name}`, error);
            throw error;
        }
    }
    async updateTemplate(templateId, updateData, updatedBy) {
        try {
            this.logger.log(`تحديث القالب: ${templateId}`);
            const existing = await this.prisma.notificationTemplate.findUnique({
                where: { id: templateId },
            });
            if (!existing) {
                throw new Error(`القالب غير موجود: ${templateId}`);
            }
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
                    variables: updateData.variables,
                    channels: updateData.channels,
                    updatedAt: new Date(),
                },
            });
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
        }
        catch (error) {
            this.logger.error(`فشل في تحديث القالب: ${templateId}`, error);
            throw error;
        }
    }
    async deleteTemplate(templateId, deletedBy) {
        try {
            this.logger.log(`حذف القالب: ${templateId}`);
            const existing = await this.prisma.notificationTemplate.findUnique({
                where: { id: templateId },
            });
            if (!existing) {
                throw new Error(`القالب غير موجود: ${templateId}`);
            }
            await this.prisma.notificationTemplate.delete({
                where: { id: templateId },
            });
            await this.auditService.log({
                action: 'TEMPLATE_DELETED',
                entity: 'NotificationTemplate',
                entityId: templateId,
                details: { template: existing },
                module: 'notification',
                category: 'configuration',
            });
            this.logger.log(`تم حذف القالب بنجاح: ${templateId}`);
        }
        catch (error) {
            this.logger.error(`فشل في حذف القالب: ${templateId}`, error);
            throw error;
        }
    }
    async getTemplate(templateId) {
        try {
            return await this.prisma.notificationTemplate.findUnique({
                where: { id: templateId },
            });
        }
        catch (error) {
            this.logger.error(`فشل في الحصول على القالب: ${templateId}`, error);
            return null;
        }
    }
    async getTemplateByName(name) {
        try {
            return await this.prisma.notificationTemplate.findUnique({
                where: { name },
            });
        }
        catch (error) {
            this.logger.error(`فشل في الحصول على القالب بالاسم: ${name}`, error);
            return null;
        }
    }
    async getDefaultTemplate(event, type) {
        try {
            return await this.prisma.notificationTemplate.findFirst({
                where: {
                    event,
                    type,
                    isDefault: true,
                    isActive: true,
                },
            });
        }
        catch (error) {
            this.logger.error(`فشل في الحصول على القالب الافتراضي: ${event} - ${type}`, error);
            return null;
        }
    }
    async searchTemplates(filters) {
        try {
            const { type, event, module, language, isActive, search, page = 1, limit = 20, } = filters;
            const where = {};
            if (type)
                where.type = type;
            if (event)
                where.event = event;
            if (module)
                where.module = module;
            if (language)
                where.language = language;
            if (isActive !== undefined)
                where.isActive = isActive;
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
        }
        catch (error) {
            this.logger.error('فشل في البحث في القوالب', error);
            throw error;
        }
    }
    async getAvailableEvents() {
        return [
            { event: 'sale_created', module: 'sales', description: 'إنشاء فاتورة مبيعات' },
            { event: 'sale_updated', module: 'sales', description: 'تحديث فاتورة مبيعات' },
            { event: 'sale_cancelled', module: 'sales', description: 'إلغاء فاتورة مبيعات' },
            { event: 'payment_received', module: 'sales', description: 'استلام دفعة' },
            { event: 'payment_failed', module: 'sales', description: 'فشل في الدفع' },
            { event: 'return_created', module: 'returns', description: 'إنشاء مرتجع' },
            { event: 'return_processed', module: 'returns', description: 'معالجة مرتجع' },
            { event: 'credit_note_issued', module: 'returns', description: 'إصدار إشعار دائن' },
            { event: 'stock_low', module: 'inventory', description: 'مخزون منخفض' },
            { event: 'stock_out', module: 'inventory', description: 'نفاد المخزون' },
            { event: 'stock_adjusted', module: 'inventory', description: 'تعديل المخزون' },
            { event: 'purchase_order_created', module: 'purchasing', description: 'إنشاء أمر شراء' },
            { event: 'purchase_invoice_received', module: 'purchasing', description: 'استلام فاتورة شراء' },
            { event: 'supplier_payment_due', module: 'purchasing', description: 'استحقاق دفع لمورد' },
            { event: 'customer_registered', module: 'customer', description: 'تسجيل عميل جديد' },
            { event: 'customer_birthday', module: 'customer', description: 'عيد ميلاد العميل' },
            { event: 'loyalty_points_earned', module: 'customer', description: 'كسب نقاط ولاء' },
            { event: 'loyalty_tier_upgraded', module: 'customer', description: 'ترقية درجة الولاء' },
            { event: 'journal_entry_posted', module: 'accounting', description: 'ترحيل قيد يومي' },
            { event: 'period_closed', module: 'accounting', description: 'إغلاق فترة محاسبية' },
            { event: 'budget_exceeded', module: 'accounting', description: 'تجاوز الميزانية' },
            { event: 'user_login_failed', module: 'auth', description: 'فشل في تسجيل الدخول' },
            { event: 'password_reset', module: 'auth', description: 'إعادة تعيين كلمة المرور' },
            { event: 'admin_action', module: 'admin', description: 'إجراء إداري' },
            { event: 'report_generated', module: 'reporting', description: 'توليد تقرير' },
            { event: 'alert_triggered', module: 'reporting', description: 'تشغيل تنبيه' },
        ];
    }
    async getTemplateVariables(event, module) {
        const variables = {
            app_name: { type: 'string', description: 'اسم التطبيق', example: 'نظام زيتونة' },
            current_date: { type: 'date', description: 'التاريخ الحالي', example: '2025-01-11' },
            current_time: { type: 'time', description: 'الوقت الحالي', example: '14:30:00' },
            user_name: { type: 'string', description: 'اسم المستخدم', example: 'أحمد محمد' },
            user_email: { type: 'email', description: 'بريد المستخدم', example: 'ahmed@example.com' },
            user_phone: { type: 'phone', description: 'هاتف المستخدم', example: '+966501234567' },
        };
        switch (module) {
            case 'sales':
                Object.assign(variables, {
                    invoice_number: { type: 'string', description: 'رقم الفاتورة', example: 'INV-001' },
                    invoice_amount: { type: 'number', description: 'مبلغ الفاتورة', example: '299.99' },
                    invoice_date: { type: 'date', description: 'تاريخ الفاتورة', example: '2025-01-11' },
                    customer_name: { type: 'string', description: 'اسم العميل', example: 'شركة أبو بكر' },
                    payment_status: { type: 'string', description: 'حالة الدفع', example: 'مدفوع' },
                });
                break;
            case 'inventory':
                Object.assign(variables, {
                    product_name: { type: 'string', description: 'اسم المنتج', example: 'زيت زيتون بكر' },
                    product_sku: { type: 'string', description: 'رمز المنتج', example: 'OLIVE-OIL-001' },
                    current_stock: { type: 'number', description: 'المخزون الحالي', example: '15' },
                    minimum_stock: { type: 'number', description: 'الحد الأدنى', example: '10' },
                    warehouse_name: { type: 'string', description: 'اسم المخزن', example: 'المخزن الرئيسي' },
                });
                break;
            case 'customer':
                Object.assign(variables, {
                    customer_name: { type: 'string', description: 'اسم العميل', example: 'أحمد محمد' },
                    customer_email: { type: 'email', description: 'بريد العميل', example: 'ahmed@example.com' },
                    loyalty_points: { type: 'number', description: 'نقاط الولاء', example: '150' },
                    loyalty_tier: { type: 'string', description: 'درجة الولاء', example: 'ذهبي' },
                    total_purchases: { type: 'number', description: 'إجمالي المشتريات', example: '2500.00' },
                });
                break;
            case 'accounting':
                Object.assign(variables, {
                    journal_number: { type: 'string', description: 'رقم القيد', example: 'JRN-001' },
                    account_name: { type: 'string', description: 'اسم الحساب', example: 'الصندوق' },
                    debit_amount: { type: 'number', description: 'مبلغ المدين', example: '1000.00' },
                    credit_amount: { type: 'number', description: 'مبلغ الدائن', example: '1000.00' },
                    period_name: { type: 'string', description: 'اسم الفترة', example: 'يناير 2025' },
                });
                break;
        }
        return variables;
    }
    async previewTemplate(templateId, variables) {
        try {
            const template = await this.getTemplate(templateId);
            if (!template) {
                throw new Error(`القالب غير موجود: ${templateId}`);
            }
            return {
                subject: template.subject ? this.processTemplate(template.subject, variables) : undefined,
                content: this.processTemplate(template.content, variables),
                htmlContent: template.htmlContent ? this.processTemplate(template.htmlContent, variables) : undefined,
            };
        }
        catch (error) {
            this.logger.error(`فشل في معاينة القالب: ${templateId}`, error);
            throw error;
        }
    }
    async cloneTemplate(templateId, newName, clonedBy) {
        try {
            const original = await this.getTemplate(templateId);
            if (!original) {
                throw new Error(`القالب غير موجود: ${templateId}`);
            }
            const existing = await this.getTemplateByName(newName);
            if (existing) {
                throw new Error(`القالب موجود بالفعل: ${newName}`);
            }
            const cloned = await this.prisma.notificationTemplate.create({
                data: {
                    name: newName,
                    description: original.description ? `${original.description} (نسخة)` : 'نسخة من قالب',
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
                    isDefault: false,
                    createdBy: clonedBy,
                },
            });
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
        }
        catch (error) {
            this.logger.error(`فشل في استنساخ القالب: ${templateId}`, error);
            throw error;
        }
    }
    async createDefaultTemplates() {
        try {
            this.logger.log('إنشاء القوالب الافتراضية...');
            const defaultTemplates = [
                {
                    name: 'sale_invoice_created_email',
                    description: 'قالب إيميل لإشعار إنشاء فاتورة مبيعات',
                    type: 'email',
                    subject: 'فاتورة جديدة رقم ${invoice_number}',
                    content: `مرحباً ${customer_name}،

تم إنشاء فاتورة جديدة لك:

رقم الفاتورة: ${invoice_number}
المبلغ: ${invoice_amount} ريال
التاريخ: ${invoice_date}

يمكنك مراجعة الفاتورة من خلال النظام.

شكراً لتعاملك معنا!
${app_name}`,
                    htmlContent: `<p>مرحباً <strong>${customer_name}</strong>،</p>

<p>تم إنشاء فاتورة جديدة لك:</p>

<ul>
<li><strong>رقم الفاتورة:</strong> ${invoice_number}</li>
<li><strong>المبلغ:</strong> ${invoice_amount} ريال</li>
<li><strong>التاريخ:</strong> ${invoice_date}</li>
</ul>

<p>يمكنك مراجعة الفاتورة من خلال <a href="#">النظام</a>.</p>

<p>شكراً لتعاملك معنا!<br>
<strong>${app_name}</strong></p>`,
                    event: 'sale_created',
                    module: 'sales',
                    isDefault: true,
                },
                {
                    name: 'sale_invoice_created_sms',
                    description: 'قالب SMS لإشعار إنشاء فاتورة مبيعات',
                    type: 'sms',
                    content: `مرحباً ${customer_name}، تم إنشاء فاتورة رقم ${invoice_number} بمبلغ ${invoice_amount} ريال. ${app_name}`,
                    event: 'sale_created',
                    module: 'sales',
                    isDefault: true,
                },
                {
                    name: 'inventory_stock_low_email',
                    description: 'قالب إيميل لإشعار مخزون منخفض',
                    type: 'email',
                    subject: 'تنبيه: مخزون منخفض للمنتج ${product_name}',
                    content: `مرحباً،

يُرجى ملاحظة أن مخزون المنتج ${product_name} منخفض:

المنتج: ${product_name}
الرمز: ${product_sku}
المخزون الحالي: ${current_stock}
الحد الأدنى: ${minimum_stock}
المخزن: ${warehouse_name}

يرجى إعادة التزويد في أقرب وقت ممكن.

${app_name}`,
                    event: 'stock_low',
                    module: 'inventory',
                    isDefault: true,
                },
                {
                    name: 'inventory_stock_low_push',
                    description: 'قالب دفع لإشعار مخزون منخفض',
                    type: 'push',
                    subject: 'مخزون منخفض',
                    content: `مخزون ${product_name} منخفض: ${current_stock} قطعة متبقية`,
                    event: 'stock_low',
                    module: 'inventory',
                    isDefault: true,
                },
                {
                    name: 'customer_birthday_whatsapp',
                    description: 'قالب WhatsApp لتذكير عيد ميلاد العميل',
                    type: 'whatsapp',
                    content: `🎉 كل عام وأنت بخير ${customer_name}! 🎉

نتمنى لك عيداً ميلاداً سعيداً مليئاً بالفرح والسعادة.

شكراً لثقتك بنا! 
${app_name}`,
                    event: 'customer_birthday',
                    module: 'customer',
                    isDefault: true,
                },
                {
                    name: 'customer_loyalty_upgrade_email',
                    description: 'قالب إيميل لترقية درجة ولاء العميل',
                    type: 'email',
                    subject: 'تهانينا! تم ترقية درجة ولائك',
                    content: `مرحباً ${customer_name}،

تهانينا! لقد تم ترقية درجة ولائك إلى ${loyalty_tier}.

مع تحياتنا،
${app_name}`,
                    event: 'loyalty_tier_upgraded',
                    module: 'customer',
                    isDefault: true,
                },
            ];
            for (const templateData of defaultTemplates) {
                try {
                    await this.createTemplate(templateData, 'system');
                    this.logger.log(`تم إنشاء القالب الافتراضي: ${templateData.name}`);
                }
                catch (error) {
                    if (error.message.includes('القالب موجود بالفعل')) {
                        this.logger.log(`القالب موجود بالفعل، تم تخطيه: ${templateData.name}`);
                    }
                    else {
                        throw error;
                    }
                }
            }
            this.logger.log('تم إنشاء جميع القوالب الافتراضية بنجاح');
        }
        catch (error) {
            this.logger.error('فشل في إنشاء القوالب الافتراضية', error);
            throw error;
        }
    }
    processTemplate(template, variables) {
        let processed = template;
        for (const [key, value] of Object.entries(variables)) {
            const regex = new RegExp(`\\$\\{${key}\\}`, 'g');
            processed = processed.replace(regex, String(value));
        }
        return processed;
    }
};
exports.NotificationTemplateService = NotificationTemplateService;
exports.NotificationTemplateService = NotificationTemplateService = NotificationTemplateService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_service_1.AuditService])
], NotificationTemplateService);
//# sourceMappingURL=notification-template.service.js.map