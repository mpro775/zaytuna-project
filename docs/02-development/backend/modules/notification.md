# 📢 وحدة الإشعارات (Notification Module)

## نظرة عامة

وحدة الإشعارات مسؤولة عن إرسال الإشعارات للمستخدمين عبر قنوات متعددة (Email, SMS, WhatsApp, Push). توفر هذه الوحدة نظام إشعارات شامل مع قوالب وترتيبات أولوية.

### الميزات الرئيسية

- **إرسال الإشعارات**: إرسال إشعارات فردية وجماعية
- **قنوات متعددة**: Email, SMS, WhatsApp, Push Notifications
- **القوالب**: قوالب إشعارات قابلة للتخصيص
- **الترتيبات**: تفضيلات المستخدمين للإشعارات

---

## API Endpoints

### إرسال الإشعارات

#### POST `/notifications/send` - إرسال إشعار لمستخدم
**الصلاحيات**: `notifications.send`

#### POST `/notifications/broadcast` - إرسال إشعار جماعي
**الصلاحيات**: `notifications.broadcast`

### إدارة الاشتراكات

#### POST `/notifications/register-device` - تسجيل جهاز
**الصلاحيات**: لا شيء (Public)

#### POST `/notifications/unsubscribe/:subscriptionId` - إلغاء اشتراك
**الصلاحيات**: `notifications.manage`

#### GET `/notifications/vapid-public-key` - مفتاح VAPID
**الصلاحيات**: لا شيء (Public)

### إدارة الإشعارات

#### GET `/notifications/user` - إشعارات المستخدم
**الصلاحيات**: مستخدم مصادق عليه
- Query: `limit`, `offset`, `unreadOnly`, `category`

#### PUT `/notifications/:id/read` - تحديد كمقروء
**الصلاحيات**: مستخدم مصادق عليه

#### DELETE `/notifications/:id` - حذف إشعار
**الصلاحيات**: مستخدم مصادق عليه

#### GET `/notifications/stats` - إحصائيات الإشعارات
**الصلاحيات**: مستخدم مصادق عليه

### الإشعارات الخاصة

#### POST `/notifications/welcome/:userId` - إشعار ترحيب
**الصلاحيات**: `notifications.send`

#### POST `/notifications/alerts/low-stock` - تنبيه مخزون منخفض
**الصلاحيات**: `notifications.send`

#### POST `/notifications/alerts/high-sales` - تنبيه مبيعات عالية
**الصلاحيات**: `notifications.send`

### الإدارة

#### GET `/notifications/admin/stats` - إحصائيات عامة
**الصلاحيات**: `notifications.admin`

#### POST `/notifications/admin/cleanup` - تنظيف الإشعارات
**الصلاحيات**: `notifications.admin`

#### POST `/notifications/admin/test` - إشعار اختباري
**الصلاحيات**: `notifications.admin`

---

## DTOs

### CreateNotificationDto
- `userId`: string (مطلوب)
- `title`: string (مطلوب)
- `body`: string (مطلوب)
- `type`: string (مطلوب: email, sms, whatsapp, push, in_app)
- `category`: string (اختياري)
- `data`: object (اختياري)
- `priority`: string (افتراضي: "normal")

### SendNotificationDto
- `recipientIds`: string[] (مطلوب)
- `title`: string (مطلوب)
- `body`: string (مطلوب)
- `type`: string (مطلوب)
- `category`: string (اختياري)

---

## العلاقات

- **جميع الوحدات**: جميع الوحدات تستخدم Notification Module لإرسال الإشعارات
- **User Module**: تفضيلات المستخدمين للإشعارات
- **Inventory Module**: تنبيهات المخزون المنخفض
- **Sales Module**: إشعارات المبيعات

---

**📅 تاريخ آخر تحديث**: ديسمبر 2025

