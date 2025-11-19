# 💰 وحدة المبيعات (Sales Module)

## نظرة عامة

وحدة المبيعات مسؤولة عن إدارة فواتير المبيعات والمدفوعات في النظام. توفر هذه الوحدة نظام مبيعات شامل مع دعم متعدد العملات والضرائب.

### الميزات الرئيسية

- **إدارة الفواتير**: إنشاء وتحديث وإلغاء فواتير المبيعات
- **إدارة المدفوعات**: إضافة مدفوعات للفواتير
- **البحث والفلترة**: البحث حسب الفرع، العميل، الحالة
- **الإحصائيات**: إحصائيات شاملة عن المبيعات

---

## API Endpoints

### POST `/sales/invoices` - إنشاء فاتورة مبيعات
**الصلاحيات**: `sales.create`

### GET `/sales/invoices` - الحصول على فواتير المبيعات
**الصلاحيات**: `sales.read`
- Query: `branchId`, `customerId`, `status`, `paymentStatus`, `limit`

### GET `/sales/invoices/:id` - الحصول على فاتورة بالمعرف
**الصلاحيات**: `sales.read`

### PATCH `/sales/invoices/:id` - تحديث فاتورة
**الصلاحيات**: `sales.update`

### DELETE `/sales/invoices/:id/cancel` - إلغاء فاتورة
**الصلاحيات**: `sales.update`

### POST `/sales/invoices/:id/payments` - إضافة دفعة
**الصلاحيات**: `sales.update`

### GET `/sales/stats` - إحصائيات المبيعات
**الصلاحيات**: `sales.read`
- Query: `branchId`, `startDate`, `endDate`

### GET `/sales/invoices/:id/print` - طباعة فاتورة
**الصلاحيات**: `sales.read`

### GET `/sales/customers/:customerId/invoices` - فواتير العميل
**الصلاحيات**: `sales.read`

### GET `/sales/branches/:branchId/invoices` - فواتير الفرع
**الصلاحيات**: `sales.read`

---

## DTOs

### CreateSalesInvoiceDto
- `invoiceNumber`: string (اختياري)
- `branchId`: string (مطلوب، UUID)
- `customerId`: string (اختياري، UUID)
- `warehouseId`: string (مطلوب، UUID)
- `currencyId`: string (مطلوب، UUID)
- `taxId`: string (اختياري، UUID)
- `lines`: SalesInvoiceLineDto[] (مطلوب)
- `status`: string (افتراضي: "draft")
- `notes`: string (اختياري)
- `dueDate`: Date (اختياري)

### SalesInvoiceLineDto
- `productVariantId`: string (مطلوب، UUID)
- `quantity`: number (مطلوب)
- `unitPrice`: number (اختياري)
- `discountAmount`: number (اختياري)
- `taxAmount`: number (اختياري)
- `lineTotal`: number (اختياري)

### CreatePaymentDto
- `amount`: number (مطلوب)
- `paymentMethod`: string (مطلوب)
- `referenceNumber`: string (اختياري)
- `notes`: string (اختياري)

---

## العلاقات

- **Customer Module**: الفواتير مرتبطة بالعملاء
- **Branch Module**: الفواتير مرتبطة بالفروع
- **Warehouse Module**: الفواتير مرتبطة بالمخازن
- **Product Variant Module**: سطور الفواتير مرتبطة بمتغيرات المنتجات
- **Payment Module**: الفواتير مرتبطة بالمدفوعات
- **Inventory Module**: البيع يقلل من المخزون

---

**📅 تاريخ آخر تحديث**: ديسمبر 2025

