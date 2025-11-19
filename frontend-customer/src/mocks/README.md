# Mock Data System - نظام البيانات الوهمية

## نظرة عامة

نظام شامل للبيانات الوهمية باستخدام ملفات JSON للتجريب والعرض دون التأثير على النظام الحقيقي.

## الميزات

- ✅ بيانات وهمية واقعية لجميع الوحدات
- ✅ دعم كامل لعمليات CRUD
- ✅ فلترة وترقيم وبحث
- ✅ حفظ التغييرات محلياً (localStorage)
- ✅ تبديل سهل بين البيانات الوهمية والحقيقية
- ✅ مؤشر بصري عند تفعيل الوضع الوهمي

## التفعيل

### طريقة 1: متغير البيئة

أضف إلى ملف `.env`:

```env
VITE_USE_MOCK_DATA=true
```

### طريقة 2: من الإعدادات

1. اذهب إلى **الإعدادات** > **إعدادات النظام**
2. في قسم **وضع البيانات الوهمية**
3. فعّل المفتاح
4. اضغط **تأكيد وإعادة التحميل**

## البيانات المتاحة

### بيانات أساسية
- **المستخدمون**: 5 مستخدمين (admin, manager, cashier, etc.)
- **الفروع**: 4 فروع
- **المخازن**: 5 مخازن

### المنتجات
- **الفئات**: 10 فئات
- **المنتجات**: 15 منتج (يمكن التوسع)

### العملاء والموردين
- **العملاء**: 10 عملاء
- **الموردين**: 5 موردين

### المبيعات
- **الفواتير**: 2 فاتورة نموذجية
- **المدفوعات**: 2 دفعة

### المخزون
- **عناصر المخزون**: 5 عناصر
- **حركات المخزون**: 5 حركات

### التقارير
- تقارير المبيعات
- تقارير المخزون
- التقارير المالية
- بيانات Dashboard

## هيكل الملفات

```
src/mocks/
├── data/                    # ملفات JSON
│   ├── auth.json
│   ├── users.json
│   ├── branches.json
│   ├── products.json
│   ├── categories.json
│   ├── customers.json
│   ├── suppliers.json
│   ├── warehouses.json
│   ├── sales-invoices.json
│   ├── stock-items.json
│   ├── stock-movements.json
│   ├── reports/
│   │   ├── sales-report.json
│   │   ├── inventory-report.json
│   │   ├── financial-report.json
│   │   └── dashboard-data.json
│   └── accounting/
│       ├── gl-accounts.json
│       └── transactions.json
├── services/                # خدمات Mock
│   ├── mock-api.ts
│   ├── mock-utils.ts
│   ├── mock-auth.ts
│   ├── mock-products.ts
│   ├── mock-customers.ts
│   ├── mock-sales.ts
│   ├── mock-inventory.ts
│   ├── mock-reports.ts
│   ├── mock-accounting.ts
│   └── index.ts
└── types.ts
```

## الاستخدام

### تسجيل الدخول

استخدم أي من بيانات المستخدمين التالية:

- **Admin**: `admin` / `admin123`
- **Manager**: `manager` / `manager123`
- **Cashier**: `cashier` / `cashier123`

### إضافة بيانات جديدة

1. افتح الملف المناسب في `src/mocks/data/`
2. أضف البيانات الجديدة بنفس الهيكل
3. البيانات ستُحفظ تلقائياً في localStorage عند التعديل

### إعادة تعيين البيانات

احذف البيانات من localStorage:

```javascript
// في Console المتصفح
localStorage.removeItem('mockData_products');
localStorage.removeItem('mockData_customers');
// ... إلخ
```

ثم أعد تحميل الصفحة.

## الإعدادات

في `src/config/mock.config.ts`:

```typescript
{
  enabled: boolean,        // تفعيل/إلغاء
  delayMin: number,        // أقل تأخير (ms)
  delayMax: number,        // أقصى تأخير (ms)
  errorRate: number,       // معدل الأخطاء (0-1)
  persistData: boolean,    // حفظ التغييرات
}
```

## ملاحظات مهمة

1. **البيانات محلية**: جميع التغييرات محفوظة في localStorage فقط
2. **لا تؤثر على النظام الحقيقي**: البيانات الوهمية منفصلة تماماً
3. **إعادة التحميل**: عند التبديل بين الوضعين، يجب إعادة تحميل الصفحة
4. **العلاقات**: البيانات مرتبطة منطقياً (مثلاً: فواتير مرتبطة بعملاء موجودين)

## استكشاف الأخطاء

### البيانات لا تظهر
- تأكد من تفعيل Mock Mode
- تحقق من Console للأخطاء
- تأكد من وجود البيانات في ملفات JSON

### التغييرات لا تُحفظ
- تحقق من `persistData: true` في الإعدادات
- تأكد من أن localStorage متاح

### الأخطاء في الطلبات
- تحقق من وجود handler للـ endpoint المطلوب
- راجع Console للأخطاء التفصيلية

## التطوير المستقبلي

- [ ] إضافة المزيد من البيانات الوهمية
- [ ] دعم محاكاة الأخطاء المتقدمة
- [ ] واجهة لإدارة البيانات الوهمية
- [ ] تصدير/استيراد البيانات الوهمية

