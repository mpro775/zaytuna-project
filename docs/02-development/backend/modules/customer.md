# 👥 وحدة العملاء (Customer Module)

## نظرة عامة

وحدة العملاء مسؤولة عن إدارة بيانات العملاء في النظام. توفر هذه الوحدة نظام ولاء متقدم مع تتبع نقاط الولاء والمستويات.

### الميزات الرئيسية

- **إدارة العملاء**: إنشاء وتحديث وحذف العملاء
- **نظام الولاء**: تتبع نقاط الولاء والمستويات (bronze, silver, gold, platinum)
- **البحث المتقدم**: بحث متقدم مع فلاتر متعددة
- **الإحصائيات**: إحصائيات شاملة عن العملاء والولاء

---

## API Endpoints

### POST `/customers` - إنشاء عميل جديد
**الصلاحيات**: `customers.create`

### GET `/customers` - الحصول على العملاء
**الصلاحيات**: `customers.read`
- Query: `search`, `isActive`, `loyaltyTier`, `limit`

### GET `/customers/search` - البحث المتقدم
**الصلاحيات**: `customers.read`
- Query: `query`, `loyaltyTier`, `minPurchases`, `maxPurchases`, `hasMarketingConsent`, `gender`, `limit`

### GET `/customers/:id` - الحصول على عميل بالمعرف
**الصلاحيات**: `customers.read`

### PATCH `/customers/:id` - تحديث عميل
**الصلاحيات**: `customers.update`

### DELETE `/customers/:id` - حذف عميل
**الصلاحيات**: `customers.delete`

### GET `/customers/:id/loyalty` - إحصائيات الولاء
**الصلاحيات**: `customers.read`

### PATCH `/customers/:id/loyalty-points` - تحديث نقاط الولاء
**الصلاحيات**: `customers.update`

### GET `/customers/stats/overview` - إحصائيات العملاء
**الصلاحيات**: `customers.reports`

### GET `/customers/stats/top-customers` - أفضل العملاء
**الصلاحيات**: `customers.reports`

---

## DTOs

### CreateCustomerDto
- `name`: string (مطلوب)
- `phone`: string (اختياري)
- `email`: string (اختياري)
- `address`: string (اختياري)
- `taxNumber`: string (اختياري)
- `creditLimit`: number (اختياري)
- `loyaltyPoints`: number (افتراضي: 0)
- `loyaltyTier`: string (افتراضي: "bronze")
- `birthday`: Date (اختياري)
- `gender`: string (اختياري)
- `marketingConsent`: boolean (افتراضي: false)

---

## العلاقات

- **Sales Module**: العملاء مرتبطون بفواتير المبيعات
- **Payment Module**: العملاء مرتبطون بالمدفوعات
- **Returns Module**: العملاء مرتبطون بالمرتجعات

---

**📅 تاريخ آخر تحديث**: ديسمبر 2025

