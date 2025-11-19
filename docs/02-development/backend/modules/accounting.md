# 💼 وحدة المحاسبة (Accounting Module)

## نظرة عامة

وحدة المحاسبة مسؤولة عن إدارة النظام المحاسبي الكامل في النظام. توفر هذه الوحدة دليل حسابات هرمي، قيود يومية، وتقارير مالية شاملة.

### الميزات الرئيسية

- **دليل الحسابات**: إدارة حسابات GL هرمية
- **القيود اليومية**: إنشاء واعتماد القيود
- **القيود التلقائية**: قيود تلقائية للمبيعات والمشتريات
- **التقارير المالية**: ميزانية عمومية، قائمة دخل، حركة حسابات

---

## API Endpoints

### حسابات GL

#### POST `/accounting/gl-accounts` - إنشاء حساب GL
**الصلاحيات**: `accounting.gl_accounts.create`

#### GET `/accounting/gl-accounts` - الحصول على حسابات GL
**الصلاحيات**: `accounting.gl_accounts.read`
- Query: `includeInactive`, `accountType`

#### GET `/accounting/gl-accounts/:id` - الحصول على حساب بالمعرف
**الصلاحيات**: `accounting.gl_accounts.read`

#### PATCH `/accounting/gl-accounts/:id` - تحديث حساب
**الصلاحيات**: `accounting.gl_accounts.update`

#### DELETE `/accounting/gl-accounts/:id` - حذف حساب
**الصلاحيات**: `accounting.gl_accounts.delete`

### القيود اليومية

#### POST `/accounting/journal-entries` - إنشاء قيد يومي
**الصلاحيات**: `accounting.journal_entries.create`

#### GET `/accounting/journal-entries` - الحصول على القيود
**الصلاحيات**: `accounting.journal_entries.read`
- Query: `status`, `sourceModule`, `startDate`, `endDate`, `limit`

#### GET `/accounting/journal-entries/:id` - الحصول على قيد بالمعرف
**الصلاحيات**: `accounting.journal_entries.read`

#### PATCH `/accounting/journal-entries/:id/post` - اعتماد قيد
**الصلاحيات**: `accounting.journal_entries.post`

#### PATCH `/accounting/journal-entries/:id/unpost` - إلغاء اعتماد
**الصلاحيات**: `accounting.journal_entries.unpost`

### القيود التلقائية

#### POST `/accounting/auto/sales/:salesInvoiceId` - قيد تلقائي للمبيعات
**الصلاحيات**: `accounting.auto_entries`

#### POST `/accounting/auto/purchase/:purchaseInvoiceId` - قيد تلقائي للمشتريات
**الصلاحيات**: `accounting.auto_entries`

### الإعدادات والإحصائيات

#### POST `/accounting/setup/system-accounts` - إنشاء حسابات النظام
**الصلاحيات**: `accounting.setup`

#### GET `/accounting/stats/overview` - إحصائيات المحاسبة
**الصلاحيات**: `accounting.reports`
- Query: `startDate`, `endDate`

### التقارير

#### GET `/accounting/reports/balance-sheet` - الميزانية العمومية
**الصلاحيات**: `accounting.reports`

#### GET `/accounting/reports/profit-loss` - قائمة الدخل
**الصلاحيات**: `accounting.reports`

#### GET `/accounting/reports/account-movement/:accountId` - حركة الحسابات
**الصلاحيات**: `accounting.reports`

---

## DTOs

### CreateGLAccountDto
- `accountCode`: string (مطلوب، فريد)
- `name`: string (مطلوب)
- `description`: string (اختياري)
- `accountType`: string (مطلوب: asset, liability, equity, revenue, expense)
- `parentId`: string (اختياري، UUID)

### CreateJournalEntryDto
- `entryNumber`: string (اختياري)
- `entryDate`: Date (افتراضي: الآن)
- `description`: string (مطلوب)
- `lines`: JournalEntryLineDto[] (مطلوب)
- `referenceType`: string (اختياري)
- `referenceId`: string (اختياري)
- `sourceModule`: string (اختياري)

---

## العلاقات

- **Sales Module**: القيود التلقائية للمبيعات
- **Purchasing Module**: القيود التلقائية للمشتريات
- **Payment Module**: القيود التلقائية للمدفوعات

---

**📅 تاريخ آخر تحديث**: ديسمبر 2025

