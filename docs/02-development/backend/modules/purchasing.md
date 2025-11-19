# 🛒 وحدة المشتريات (Purchasing Module)

## نظرة عامة

وحدة المشتريات مسؤولة عن إدارة الموردين وأوامر الشراء وفواتير المشتريات في النظام. توفر هذه الوحدة نظام مشتريات شامل مع تتبع المدفوعات للموردين.

### الميزات الرئيسية

- **إدارة الموردين**: إنشاء وتحديث وحذف الموردين
- **أوامر الشراء**: إنشاء وتحديث أوامر الشراء
- **فواتير المشتريات**: إنشاء فواتير المشتريات
- **مدفوعات الموردين**: إدارة مدفوعات الموردين
- **الإحصائيات**: إحصائيات شاملة عن المشتريات

---

## API Endpoints

### الموردين

#### POST `/purchasing/suppliers` - إنشاء مورد جديد
**الصلاحيات**: `purchasing.suppliers.create`

#### GET `/purchasing/suppliers` - الحصول على الموردين
**الصلاحيات**: `purchasing.suppliers.read`
- Query: `search`, `isActive`, `limit`

#### GET `/purchasing/suppliers/:id` - الحصول على مورد بالمعرف
**الصلاحيات**: `purchasing.suppliers.read`

#### PATCH `/purchasing/suppliers/:id` - تحديث مورد
**الصلاحيات**: `purchasing.suppliers.update`

#### DELETE `/purchasing/suppliers/:id` - حذف مورد
**الصلاحيات**: `purchasing.suppliers.delete`

### أوامر الشراء

#### POST `/purchasing/orders` - إنشاء أمر شراء
**الصلاحيات**: `purchasing.orders.create`

#### GET `/purchasing/orders` - الحصول على أوامر الشراء
**الصلاحيات**: `purchasing.orders.read`
- Query: `supplierId`, `status`, `limit`

#### PATCH `/purchasing/orders/:id/status` - تحديث حالة أمر الشراء
**الصلاحيات**: `purchasing.orders.update`

### فواتير المشتريات

#### POST `/purchasing/invoices` - إنشاء فاتورة شراء
**الصلاحيات**: `purchasing.invoices.create`

#### POST `/purchasing/invoices/:id/payments` - إنشاء دفعة لفاتورة
**الصلاحيات**: `purchasing.payments.create`

### التقارير

#### GET `/purchasing/stats/overview` - إحصائيات المشتريات
**الصلاحيات**: `purchasing.reports.read`
- Query: `startDate`, `endDate`

---

## DTOs

### CreateSupplierDto
- `name`: string (مطلوب)
- `contactName`: string (اختياري)
- `phone`: string (اختياري)
- `email`: string (اختياري)
- `address`: string (اختياري)
- `taxNumber`: string (اختياري)
- `paymentTerms`: string (اختياري)

### CreatePurchaseOrderDto
- `orderNumber`: string (اختياري)
- `supplierId`: string (مطلوب، UUID)
- `warehouseId`: string (مطلوب، UUID)
- `lines`: PurchaseOrderLineDto[] (مطلوب)
- `expectedDate`: Date (اختياري)
- `notes`: string (اختياري)

### CreatePurchaseInvoiceDto
- `invoiceNumber`: string (مطلوب)
- `supplierId`: string (مطلوب، UUID)
- `warehouseId`: string (مطلوب، UUID)
- `purchaseOrderId`: string (اختياري، UUID)
- `currencyId`: string (مطلوب، UUID)
- `lines`: PurchaseInvoiceLineDto[] (مطلوب)
- `invoiceDate`: Date (افتراضي: الآن)
- `dueDate`: Date (اختياري)
- `notes`: string (اختياري)

---

## العلاقات

- **Warehouse Module**: أوامر الشراء وفواتير المشتريات مرتبطة بالمخازن
- **Product Module**: سطور الأوامر والفواتير مرتبطة بالمنتجات
- **Inventory Module**: استلام المشتريات يزيد من المخزون
- **Payment Module**: مدفوعات الموردين مرتبطة ببوابات الدفع

---

**📅 تاريخ آخر تحديث**: ديسمبر 2025

