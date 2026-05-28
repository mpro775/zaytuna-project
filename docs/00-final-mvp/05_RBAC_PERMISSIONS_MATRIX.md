# 05_RBAC_PERMISSIONS_MATRIX.md

## مشروع الزيتون سوفت — Al-Zaytoon Soft SaaS POS & Operations

**الإصدار:** 1.0  
**الحالة:** مسودة اعتماد نهائية للـ MVP  
**آخر تحديث:** 2026-05-28  
**المالك:** فريق الزيتون سوفت  
**نوع الوثيقة:** RBAC Permissions Matrix  
**المرجع المرتبط:** `MVP_SCOPE.md`, `03_SOFTWARE_REQUIREMENTS_SPECIFICATION.md`, `04_BUSINESS_RULES.md`  
**الغرض:** توثيق نموذج الأدوار والصلاحيات الرسمي لنسخة MVP من مشروع الزيتون سوفت، بحيث يكون مرجعًا موحدًا للـ Backend Guards، واجهة المستخدم، Seed Data، الاختبارات، وتدقيق الأمان.

---

## 1. الملخص التنفيذي

تعتمد نسخة MVP من مشروع **الزيتون سوفت** على نموذج صلاحيات قائم على RBAC — Role-Based Access Control، بحيث لا يستطيع أي مستخدم تنفيذ عملية إلا إذا كان يملك الصلاحية المطلوبة مباشرة أو عبر دور مرتبط به.

الهدف من هذه الوثيقة ليس إنشاء صلاحيات لكل زر صغير في النظام، بل ضبط الصلاحيات الحرجة التي تحمي:

1. أموال التاجر.
2. المخزون.
3. الفواتير والمرتجعات.
4. القيود المحاسبية.
5. الإعدادات الحساسة.
6. النسخ الاحتياطي.
7. عمليات المزامنة Offline/Sync.
8. بيانات المستخدمين والعملاء.

> القاعدة الحاكمة: **كل شيء ممنوع افتراضيًا، ويسمح فقط بما يملكه الدور صراحة.**

---

## 2. نطاق الوثيقة

### 2.1 داخل النطاق

تغطي هذه الوثيقة:

- تعريف الأدوار الافتراضية للـ MVP.
- قواعد تسمية الصلاحيات.
- مصفوفة الصلاحيات حسب الدور.
- الصلاحيات الحساسة التي تتطلب حذرًا خاصًا.
- قواعد التحقق في Backend وFrontend.
- صلاحيات التقارير والأرباح والتكلفة.
- صلاحيات Offline/Sync.
- صلاحيات Backup.
- صلاحيات Audit Logs.
- Seed مقترح للأدوار الأساسية.
- معايير القبول والاختبار.

### 2.2 خارج النطاق

لا تغطي هذه الوثيقة في MVP:

- ABAC متقدم — Attribute-Based Access Control.
- سياسات موافقة متعددة المستويات معقدة.
- Workflow طويل للاعتمادات.
- صلاحيات تفصيلية لكل زر صغير في الواجهة.
- صلاحيات SaaS Billing المتقدمة.
- إدارة اشتراكات العملاء داخل المنصة.
- تكامل SSO/SAML.
- سياسات IAM مؤسسية معقدة.

---

## 3. مبادئ RBAC الحاكمة

## RBAC-PR-001 — المنع الافتراضي

أي عملية لا توجد لها صلاحية صريحة يجب رفضها.

```txt
Default = Deny
Explicit Permission = Allow
```

---

## RBAC-PR-002 — التحقق في Backend إجباري

لا يجوز الاعتماد على الواجهة فقط لإخفاء الأزرار أو الصفحات. يجب أن يتحقق Backend من الصلاحية قبل تنفيذ أي عملية.

---

## RBAC-PR-003 — الواجهة تُحسّن التجربة ولا تحمي النظام وحدها

Frontend يستخدم الصلاحيات لإظهار أو إخفاء العناصر، لكن الحماية النهائية تكون في Backend.

---

## RBAC-PR-004 — القراءة لا تعني التعديل

امتلاك صلاحية `read` لا يعني امتلاك صلاحيات `create`, `update`, `delete`, `confirm`, `approve`, أو `post`.

---

## RBAC-PR-005 — العمليات المالية والمخزنية الحساسة مفصولة

يجب فصل صلاحيات:

- البيع.
- إلغاء البيع.
- المرتجع.
- اعتماد المرتجع.
- تعديل المخزون.
- إنشاء قيد محاسبي.
- ترحيل قيد محاسبي.
- النسخ الاحتياطي.
- الاستعادة.

---

## RBAC-PR-006 — أقل صلاحية ممكنة

كل مستخدم يعطى أقل صلاحيات تكفيه لأداء عمله، لا أكثر.

---

## RBAC-PR-007 — دعم Wildcard بحذر

يسمح باستخدام wildcard للأدوار العليا فقط:

```txt
products.*
sales.*
accounting.*
settings.*
```

لكن يجب أن يفسر Backend هذه الصيغة بشكل مضبوط، بحيث تعني امتلاك كل الصلاحيات الفرعية داخل النطاق المحدد.

---

## RBAC-PR-008 — العمليات الحساسة يجب أن تسجل في Audit Log

أي عملية تؤثر على المال أو المخزون أو الصلاحيات أو النسخ الاحتياطي يجب تسجيلها في Audit Log.

---

## RBAC-PR-009 — لا حذف فعلي للبيانات المالية

المستخدمون ذوو الصلاحية لا يحذفون الفواتير أو القيود المنشورة حذفًا نهائيًا. تستخدم حالات مثل:

```txt
VOIDED
CANCELLED
REVERSED
INACTIVE
```

---

## RBAC-PR-010 — صلاحيات الفرع والمخزن

في MVP يمكن تطبيق الصلاحيات على مستوى النظام كاملًا، لكن يجب تصميمها بحيث يمكن لاحقًا تقييد المستخدم بفرع أو مخزن.

---

## 4. اصطلاح تسمية الصلاحيات

تعتمد الصلاحيات النمط التالي:

```txt
module.action
```

أمثلة:

```txt
products.create
sales.confirm
returns.approve
accounting.journals.post
settings.company.update
```

### 4.1 الأفعال القياسية

| الفعل | المعنى |
|---|---|
| `read` | عرض البيانات |
| `create` | إنشاء سجل جديد |
| `update` | تعديل سجل موجود |
| `delete` | حذف أو تعطيل سجل غير مالي |
| `activate` | تفعيل سجل |
| `deactivate` | تعطيل سجل |
| `confirm` | تأكيد عملية |
| `cancel` | إلغاء عملية |
| `void` | إبطال عملية مالية/رسمية |
| `approve` | اعتماد طلب أو عملية حساسة |
| `post` | ترحيل قيد محاسبي |
| `reverse` | عكس قيد أو أثر مالي |
| `export` | تصدير بيانات أو تقارير |
| `import` | استيراد بيانات |
| `upload` | رفع ملف |
| `restore` | استعادة نسخة احتياطية |
| `sync` | تنفيذ أو إدارة مزامنة |
| `manage` | إدارة شاملة ضمن نطاق محدد |

---

## 5. الأدوار الافتراضية في MVP

## 5.1 Owner / صاحب المنشأة

أعلى دور داخل منشأة العميل. يملك صلاحيات شبه كاملة على بيانات منشأته، باستثناء وظائف المنصة الداخلية غير الداخلة في MVP.

**الاستخدام:** صاحب المحل أو المدير العام.

---

## 5.2 Admin / مدير النظام داخل المنشأة

يدير المستخدمين والإعدادات والعمليات، لكنه قد لا يحتاج لبعض صلاحيات الأرباح أو الاستعادة حسب سياسة المنشأة.

**الاستخدام:** مدير عام أو مسؤول تشغيل.

---

## 5.3 Branch Manager / مدير فرع

يدير عمليات فرع محدد: البيع، المخزون، الموظفين التشغيليين، التقارير اليومية، وقد يعتمد مرتجعات ضمن حدود.

**الاستخدام:** مدير محل أو مدير فرع.

---

## 5.4 Cashier / الصراف

ينفذ البيع اليومي من POS، يستعرض المنتجات والعملاء، ينشئ فواتير، ويستقبل المدفوعات ضمن صلاحيات محدودة.

**الاستخدام:** موظف الكاشير.

---

## 5.5 Salesperson / موظف مبيعات

يستعرض المنتجات والعملاء، ينشئ عروض أو فواتير مسودة إن وجدت، لكنه لا يملك صلاحيات نقدية كاملة مثل الصراف إلا إذا منحت له.

**الاستخدام:** بائع داخل المحل.

---

## 5.6 Inventory Manager / مسؤول المخزون

يدير المنتجات، المتغيرات، المخازن، إدخال الكميات، التحويلات، الجرد، وتنبيهات المخزون.

**الاستخدام:** أمين مخزن أو مسؤول مستودع.

---

## 5.7 Accountant / المحاسب

يدير الحسابات، القيود، التقارير المالية، المدفوعات، المشتريات المالية، ومراجعة أثر البيع والمرتجعات.

**الاستخدام:** محاسب المنشأة.

---

## 5.8 Purchasing Officer / مسؤول المشتريات

يدير الموردين وفواتير الشراء واستلام البضاعة ضمن حدود، ولا يملك صلاحيات محاسبية كاملة إلا عند الحاجة.

**الاستخدام:** موظف مشتريات أو مسؤول توريد.

---

## 5.9 Auditor / مراجع قراءة فقط

يستطيع قراءة التقارير والسجلات وAudit Logs دون تعديل.

**الاستخدام:** مراجع داخلي أو صاحب محل يريد متابعة فقط.

---

## 5.10 Support / الدعم الفني

دور اختياري داخلي أو محدود للمساعدة في التشخيص، ويفضل في MVP أن يكون مقيدًا جدًا ولا يملك صلاحيات مالية أو حذف أو استعادة.

**الاستخدام:** فريق الزيتون سوفت للدعم، إن تم تفعيله.

---

## 6. مستويات الحساسية

| المستوى | الوصف | أمثلة |
|---|---|---|
| Low | قراءة أو إعداد بسيط | عرض المنتجات، عرض العملاء |
| Medium | تعديل بيانات تشغيلية | تعديل منتج، إضافة عميل |
| High | أثر مالي أو مخزني | بيع، مرتجع، شراء، تعديل مخزون |
| Critical | صلاحيات أو محاسبة أو Backup | ترحيل قيد، استعادة Backup، تعديل أدوار |

---

## 7. مصفوفة الصلاحيات المختصرة حسب الدور

الرموز:

| الرمز | المعنى |
|---|---|
| ✅ | مسموح |
| ❌ | ممنوع |
| ⚠️ | مسموح بشروط أو حدود |
| 👁️ | قراءة فقط |

| النطاق | Owner | Admin | Branch Manager | Cashier | Salesperson | Inventory Manager | Accountant | Purchasing Officer | Auditor | Support |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| المستخدمون والأدوار | ✅ | ✅ | ⚠️ | ❌ | ❌ | ❌ | ❌ | ❌ | 👁️ | ❌ |
| إعدادات الشركة | ✅ | ✅ | 👁️ | ❌ | ❌ | ❌ | 👁️ | ❌ | 👁️ | 👁️ |
| إعدادات النظام | ✅ | ✅ | ⚠️ | ❌ | ❌ | ❌ | 👁️ | ❌ | 👁️ | 👁️ |
| المنتجات | ✅ | ✅ | ✅ | 👁️ | 👁️ | ✅ | 👁️ | 👁️ | 👁️ | 👁️ |
| صور المنتجات | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ | 👁️ | 👁️ |
| المخزون | ✅ | ✅ | ✅ | 👁️ | 👁️ | ✅ | 👁️ | ⚠️ | 👁️ | 👁️ |
| العملاء | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | 👁️ | ❌ | 👁️ | 👁️ |
| POS | ✅ | ✅ | ✅ | ✅ | ⚠️ | ❌ | 👁️ | ❌ | 👁️ | 👁️ |
| فواتير البيع | ✅ | ✅ | ✅ | ✅ | ⚠️ | 👁️ | 👁️ | ❌ | 👁️ | 👁️ |
| المدفوعات | ✅ | ✅ | ⚠️ | ✅ | ❌ | ❌ | ✅ | ❌ | 👁️ | 👁️ |
| المرتجعات | ✅ | ✅ | ⚠️ | ⚠️ | ❌ | ⚠️ | 👁️ | ❌ | 👁️ | 👁️ |
| الموردون | ✅ | ✅ | 👁️ | ❌ | ❌ | 👁️ | ✅ | ✅ | 👁️ | 👁️ |
| المشتريات | ✅ | ✅ | 👁️ | ❌ | ❌ | ⚠️ | ✅ | ✅ | 👁️ | 👁️ |
| المحاسبة GL | ✅ | ⚠️ | 👁️ | ❌ | ❌ | ❌ | ✅ | 👁️ | 👁️ | 👁️ |
| التقارير التشغيلية | ✅ | ✅ | ✅ | ⚠️ | ⚠️ | ✅ | ✅ | ⚠️ | 👁️ | 👁️ |
| تقارير الأرباح والتكلفة | ✅ | ⚠️ | ⚠️ | ❌ | ❌ | ⚠️ | ✅ | ❌ | 👁️ | ❌ |
| الإشعارات | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 👁️ | 👁️ |
| Offline/Sync | ✅ | ✅ | ✅ | ✅ | ⚠️ | ⚠️ | 👁️ | ❌ | 👁️ | 👁️ |
| Backup | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ⚠️ | ❌ | 👁️ | ❌ |
| Audit Logs | ✅ | ✅ | 👁️ | ❌ | ❌ | ❌ | 👁️ | ❌ | 👁️ | 👁️ |

---

## 8. قائمة الصلاحيات التفصيلية

## 8.1 Auth & Profile

| الكود | الوصف | الحساسية |
|---|---|---|
| `auth.login` | تسجيل الدخول | Low |
| `auth.logout` | تسجيل الخروج | Low |
| `auth.refresh` | تجديد الجلسة | Low |
| `profile.read` | قراءة الملف الشخصي | Low |
| `profile.update` | تعديل الملف الشخصي | Medium |
| `profile.change_password` | تغيير كلمة المرور | Medium |

ملاحظة: صلاحيات `auth.*` غالبًا لا تخزن كصلاحيات عادية، لكنها توثق هنا لأغراض التصميم والاختبار.

---

## 8.2 Users & Roles

| الكود | الوصف | الحساسية |
|---|---|---|
| `users.read` | عرض المستخدمين | Medium |
| `users.create` | إنشاء مستخدم | High |
| `users.update` | تعديل مستخدم | High |
| `users.deactivate` | تعطيل مستخدم | High |
| `users.reset_password` | إعادة تعيين كلمة مرور | Critical |
| `users.assign_roles` | تعيين أدوار لمستخدم | Critical |
| `roles.read` | عرض الأدوار | Medium |
| `roles.create` | إنشاء دور | Critical |
| `roles.update` | تعديل دور | Critical |
| `roles.delete` | حذف/تعطيل دور | Critical |
| `roles.assign_permissions` | تعديل صلاحيات دور | Critical |

---

## 8.3 Settings

| الكود | الوصف | الحساسية |
|---|---|---|
| `settings.read` | عرض الإعدادات العامة | Low |
| `settings.company.read` | عرض بيانات الشركة | Low |
| `settings.company.update` | تعديل بيانات الشركة | High |
| `settings.company.logo.upload` | رفع شعار الشركة | Medium |
| `settings.system.read` | عرض إعدادات النظام | Medium |
| `settings.system.update` | تعديل إعدادات النظام | High |
| `settings.security.read` | عرض إعدادات الأمان | High |
| `settings.security.update` | تعديل إعدادات الأمان | Critical |
| `settings.backup.read` | عرض إعدادات النسخ الاحتياطي | High |
| `settings.backup.update` | تعديل إعدادات النسخ الاحتياطي | Critical |
| `settings.reset` | إعادة ضبط إعدادات | Critical |

---

## 8.4 Branches & Warehouses

| الكود | الوصف | الحساسية |
|---|---|---|
| `branches.read` | عرض الفروع | Low |
| `branches.create` | إنشاء فرع | Medium |
| `branches.update` | تعديل فرع | Medium |
| `branches.deactivate` | تعطيل فرع | High |
| `warehouses.read` | عرض المخازن | Low |
| `warehouses.create` | إنشاء مخزن | Medium |
| `warehouses.update` | تعديل مخزن | Medium |
| `warehouses.deactivate` | تعطيل مخزن | High |

---

## 8.5 Currency & Exchange Rates

| الكود | الوصف | الحساسية |
|---|---|---|
| `currencies.read` | عرض العملات | Low |
| `currencies.create` | إنشاء عملة | High |
| `currencies.update` | تعديل عملة | High |
| `currencies.set_base` | تعيين العملة الأساسية | Critical |
| `currencies.set_default` | تعيين العملة الافتراضية | High |
| `exchange_rates.read` | عرض أسعار الصرف | Low |
| `exchange_rates.create` | إضافة سعر صرف | High |
| `exchange_rates.update` | تعديل سعر صرف | High |
| `exchange_rates.convert` | استخدام تحويل العملات | Low |

ملاحظة: تغيير العملة الأساسية عملية خطيرة جدًا، ويجب تقييدها أو منعها بعد وجود عمليات مالية.

---

## 8.6 Categories, Products, Variants & Images

| الكود | الوصف | الحساسية |
|---|---|---|
| `categories.read` | عرض التصنيفات | Low |
| `categories.create` | إنشاء تصنيف | Medium |
| `categories.update` | تعديل تصنيف | Medium |
| `categories.delete` | حذف/تعطيل تصنيف | Medium |
| `products.read` | عرض المنتجات | Low |
| `products.create` | إنشاء منتج | Medium |
| `products.update` | تعديل منتج | Medium |
| `products.deactivate` | تعطيل منتج | Medium |
| `products.delete` | حذف منتج غير مستخدم | High |
| `product_variants.read` | عرض المتغيرات | Low |
| `product_variants.create` | إنشاء متغير | Medium |
| `product_variants.update` | تعديل متغير | Medium |
| `product_variants.deactivate` | تعطيل متغير | Medium |
| `product_images.read` | عرض صور المنتجات | Low |
| `product_images.upload` | رفع صورة منتج | Medium |
| `product_images.delete` | حذف صورة منتج | Medium |
| `products.cost.read` | عرض تكلفة المنتج | High |
| `products.prices.update` | تعديل الأسعار | High |
| `products.discounts.manage` | إدارة خصومات المنتج | High |

---

## 8.7 Inventory

| الكود | الوصف | الحساسية |
|---|---|---|
| `inventory.read` | عرض المخزون | Low |
| `inventory.movements.read` | عرض حركات المخزون | Medium |
| `inventory.adjust` | تعديل مخزون يدوي | Critical |
| `inventory.transfer` | نقل مخزون بين مخازن | High |
| `inventory.receive` | استلام بضاعة | High |
| `inventory.issue` | صرف/إخراج بضاعة | High |
| `inventory.low_stock.read` | عرض تنبيهات انخفاض المخزون | Low |
| `inventory.valuation.read` | عرض قيمة المخزون | High |
| `inventory.cost.update` | تعديل تكلفة مخزون | Critical |
| `inventory.audit.read` | عرض سجل تدقيق المخزون | High |

---

## 8.8 Customers

| الكود | الوصف | الحساسية |
|---|---|---|
| `customers.read` | عرض العملاء | Low |
| `customers.create` | إنشاء عميل | Medium |
| `customers.update` | تعديل عميل | Medium |
| `customers.deactivate` | تعطيل عميل | Medium |
| `customers.balance.read` | عرض رصيد العميل | High |
| `customers.statement.read` | عرض كشف حساب العميل | High |

---

## 8.9 POS & Sales

| الكود | الوصف | الحساسية |
|---|---|---|
| `pos.access` | الدخول إلى شاشة POS | Medium |
| `pos.products.read` | عرض منتجات POS | Low |
| `pos.sell` | تنفيذ بيع POS | High |
| `pos.discount.apply` | تطبيق خصم عادي | High |
| `pos.discount.override` | تجاوز حد الخصم | Critical |
| `sales.read` | عرض فواتير البيع | Medium |
| `sales.create` | إنشاء فاتورة بيع | High |
| `sales.confirm` | تأكيد فاتورة بيع | High |
| `sales.cancel` | إلغاء فاتورة غير مرحلة | High |
| `sales.void` | إبطال فاتورة مؤكدة | Critical |
| `sales.print` | طباعة فاتورة | Low |
| `sales.export` | تصدير فواتير البيع | High |
| `sales.cost.read` | عرض تكلفة وأرباح الفاتورة | Critical |

---

## 8.10 Payments

| الكود | الوصف | الحساسية |
|---|---|---|
| `payments.read` | عرض المدفوعات | Medium |
| `payments.create` | تسجيل دفعة | High |
| `payments.update` | تعديل دفعة غير مرحلة | Critical |
| `payments.void` | إبطال دفعة | Critical |
| `payments.refund` | رد مبلغ للعميل | Critical |
| `payments.methods.manage` | إدارة طرق الدفع | High |

---

## 8.11 Returns & Credit Notes

| الكود | الوصف | الحساسية |
|---|---|---|
| `returns.read` | عرض المرتجعات | Medium |
| `returns.create` | إنشاء طلب مرتجع | High |
| `returns.approve` | اعتماد مرتجع | Critical |
| `returns.reject` | رفض مرتجع | High |
| `returns.cancel` | إلغاء طلب مرتجع | High |
| `returns.process` | تنفيذ أثر المرتجع | Critical |
| `credit_notes.read` | عرض إشعارات الدائن | Medium |
| `credit_notes.create` | إنشاء Credit Note | Critical |
| `credit_notes.apply` | تطبيق Credit Note على رصيد/فاتورة | Critical |
| `credit_notes.void` | إبطال Credit Note | Critical |

---

## 8.12 Suppliers & Purchasing

| الكود | الوصف | الحساسية |
|---|---|---|
| `suppliers.read` | عرض الموردين | Low |
| `suppliers.create` | إنشاء مورد | Medium |
| `suppliers.update` | تعديل مورد | Medium |
| `suppliers.deactivate` | تعطيل مورد | Medium |
| `suppliers.balance.read` | عرض رصيد مورد | High |
| `purchases.read` | عرض فواتير الشراء | Medium |
| `purchases.create` | إنشاء فاتورة شراء | High |
| `purchases.confirm` | اعتماد فاتورة شراء | Critical |
| `purchases.cancel` | إلغاء فاتورة شراء غير مرحلة | High |
| `purchases.void` | إبطال فاتورة شراء مؤكدة | Critical |
| `purchases.payments.create` | دفع للمورد | Critical |
| `purchases.export` | تصدير المشتريات | High |

---

## 8.13 Accounting / GL

| الكود | الوصف | الحساسية |
|---|---|---|
| `accounting.accounts.read` | عرض شجرة الحسابات | High |
| `accounting.accounts.create` | إنشاء حساب | Critical |
| `accounting.accounts.update` | تعديل حساب | Critical |
| `accounting.accounts.deactivate` | تعطيل حساب | Critical |
| `accounting.journals.read` | عرض القيود | High |
| `accounting.journals.create` | إنشاء قيد يدوي | Critical |
| `accounting.journals.update_draft` | تعديل قيد مسودة | Critical |
| `accounting.journals.post` | ترحيل قيد | Critical |
| `accounting.journals.reverse` | عكس قيد | Critical |
| `accounting.reports.trial_balance.read` | عرض ميزان المراجعة | High |
| `accounting.reports.profit_loss.read` | عرض الأرباح والخسائر | Critical |
| `accounting.reports.ledger.read` | عرض دفتر الأستاذ | High |
| `accounting.reports.export` | تصدير تقارير محاسبية | Critical |
| `accounting.system_accounts.manage` | إدارة الحسابات النظامية | Critical |

---

## 8.14 Reports & Dashboard

| الكود | الوصف | الحساسية |
|---|---|---|
| `dashboard.read` | عرض لوحة المعلومات | Medium |
| `reports.sales.read` | عرض تقرير المبيعات | Medium |
| `reports.sales.export` | تصدير تقرير المبيعات | High |
| `reports.inventory.read` | عرض تقرير المخزون | Medium |
| `reports.inventory_valuation.read` | عرض قيمة المخزون | High |
| `reports.low_stock.read` | عرض انخفاض المخزون | Low |
| `reports.customers.read` | عرض تقارير العملاء | High |
| `reports.suppliers.read` | عرض تقارير الموردين | High |
| `reports.profit.read` | عرض الربحية | Critical |
| `reports.export` | تصدير التقارير | High |

---

## 8.15 Notifications

| الكود | الوصف | الحساسية |
|---|---|---|
| `notifications.read` | عرض الإشعارات | Low |
| `notifications.mark_read` | تعليم كمقروء | Low |
| `notifications.manage` | إدارة إعدادات الإشعارات | Medium |
| `notifications.broadcast` | إرسال إشعار داخلي عام | High |

---

## 8.16 Offline / Sync

| الكود | الوصف | الحساسية |
|---|---|---|
| `sync.status.read` | عرض حالة المزامنة | Low |
| `sync.devices.read` | عرض الأجهزة | Medium |
| `sync.devices.register` | تسجيل جهاز | High |
| `sync.devices.revoke` | إلغاء جهاز | Critical |
| `sync.pull` | سحب تغييرات | Medium |
| `sync.push` | رفع تغييرات | High |
| `sync.conflicts.read` | عرض التعارضات | High |
| `sync.conflicts.resolve` | حل التعارضات | Critical |
| `sync.offline_sales.create` | إنشاء بيع Offline | High |
| `sync.retry` | إعادة محاولة مزامنة | High |

---

## 8.17 Backup

| الكود | الوصف | الحساسية |
|---|---|---|
| `backup.read` | عرض سجل النسخ الاحتياطي | High |
| `backup.create` | إنشاء نسخة احتياطية | Critical |
| `backup.download` | تنزيل نسخة احتياطية | Critical |
| `backup.restore` | استعادة نسخة احتياطية | Critical |
| `backup.delete` | حذف سجل/ملف نسخة احتياطية | Critical |
| `backup.settings.update` | تعديل إعدادات النسخ الاحتياطي | Critical |

---

## 8.18 Storage & Files

| الكود | الوصف | الحساسية |
|---|---|---|
| `storage.files.read` | عرض الملفات | Low |
| `storage.files.upload` | رفع ملف | Medium |
| `storage.files.delete` | حذف ملف | High |
| `storage.product_images.manage` | إدارة صور المنتجات | Medium |
| `storage.company_logo.manage` | إدارة شعار الشركة | Medium |

---

## 8.19 Audit Logs

| الكود | الوصف | الحساسية |
|---|---|---|
| `audit_logs.read` | عرض سجلات التدقيق | High |
| `audit_logs.export` | تصدير سجلات التدقيق | Critical |

لا توجد صلاحية لحذف Audit Logs في MVP.

---

## 9. مصفوفة تفصيلية حسب الدور

## 9.1 Owner

الدور الأعلى داخل المنشأة.

### صلاحيات مقترحة

```txt
users.*
roles.*
settings.*
branches.*
warehouses.*
currencies.*
exchange_rates.*
categories.*
products.*
product_variants.*
product_images.*
inventory.*
customers.*
pos.*
sales.*
payments.*
returns.*
credit_notes.*
suppliers.*
purchases.*
accounting.*
dashboard.read
reports.*
notifications.*
sync.*
backup.*
storage.*
audit_logs.*
```

### قيود

- يفضل حماية العمليات التالية بتأكيد إضافي في الواجهة:
  - `backup.restore`
  - `roles.assign_permissions`
  - `accounting.journals.reverse`
  - `currencies.set_base`

---

## 9.2 Admin

مدير النظام داخل المنشأة.

### صلاحيات مقترحة

```txt
users.read
users.create
users.update
users.deactivate
users.assign_roles
roles.read
settings.read
settings.company.*
settings.system.*
settings.backup.read
branches.*
warehouses.*
currencies.read
currencies.create
currencies.update
currencies.set_default
exchange_rates.*
categories.*
products.*
product_variants.*
product_images.*
inventory.read
inventory.movements.read
inventory.adjust
inventory.transfer
inventory.receive
inventory.low_stock.read
customers.*
pos.*
sales.*
payments.*
returns.*
credit_notes.*
suppliers.*
purchases.*
accounting.accounts.read
accounting.journals.read
accounting.reports.trial_balance.read
accounting.reports.ledger.read
dashboard.read
reports.*
notifications.*
sync.*
backup.read
backup.create
storage.*
audit_logs.read
```

### ممنوع افتراضيًا

```txt
roles.assign_permissions
settings.security.update
currencies.set_base
accounting.system_accounts.manage
accounting.journals.post
accounting.journals.reverse
backup.restore
backup.download
```

يمكن للـ Owner منح بعض هذه الصلاحيات حسب سياسة المنشأة.

---

## 9.3 Branch Manager

مدير فرع أو محل.

### صلاحيات مقترحة

```txt
users.read
settings.read
branches.read
warehouses.read
currencies.read
exchange_rates.read
categories.read
products.read
products.update
product_variants.read
product_images.read
inventory.read
inventory.movements.read
inventory.transfer
inventory.low_stock.read
customers.*
pos.*
sales.read
sales.create
sales.confirm
sales.cancel
sales.print
payments.read
payments.create
returns.read
returns.create
returns.approve
returns.reject
credit_notes.read
suppliers.read
purchases.read
dashboard.read
reports.sales.read
reports.inventory.read
reports.low_stock.read
notifications.*
sync.status.read
sync.pull
sync.push
sync.offline_sales.create
storage.files.read
audit_logs.read
```

### ممنوع افتراضيًا

```txt
settings.security.update
roles.*
users.assign_roles
inventory.adjust
inventory.cost.update
sales.void
payments.void
payments.refund
credit_notes.void
purchases.confirm
purchases.void
accounting.*
backup.*
reports.profit.read
```

---

## 9.4 Cashier

الصراف.

### صلاحيات مقترحة

```txt
profile.read
profile.update
profile.change_password
settings.company.read
branches.read
warehouses.read
currencies.read
exchange_rates.convert
categories.read
products.read
product_variants.read
product_images.read
inventory.read
customers.read
customers.create
customers.update
pos.access
pos.products.read
pos.sell
pos.discount.apply
sales.read
sales.create
sales.confirm
sales.print
payments.read
payments.create
returns.read
returns.create
notifications.read
notifications.mark_read
sync.status.read
sync.pull
sync.push
sync.offline_sales.create
```

### ممنوع افتراضيًا

```txt
pos.discount.override
sales.cancel
sales.void
sales.cost.read
payments.update
payments.void
payments.refund
returns.approve
returns.process
credit_notes.*
inventory.adjust
inventory.transfer
products.cost.read
reports.profit.read
accounting.*
backup.*
settings.*
users.*
roles.*
```

---

## 9.5 Salesperson

موظف مبيعات غير مسؤول عن الصندوق.

### صلاحيات مقترحة

```txt
products.read
product_variants.read
product_images.read
inventory.read
customers.read
customers.create
customers.update
sales.read
sales.create
sales.print
reports.sales.read
notifications.read
notifications.mark_read
sync.status.read
```

### صلاحيات اختيارية حسب سياسة المحل

```txt
pos.access
pos.products.read
pos.sell
sync.offline_sales.create
```

### ممنوع افتراضيًا

```txt
payments.create
returns.approve
sales.confirm
sales.void
products.cost.read
reports.profit.read
accounting.*
inventory.adjust
settings.*
```

---

## 9.6 Inventory Manager

مسؤول المخزون.

### صلاحيات مقترحة

```txt
categories.*
products.read
products.create
products.update
products.deactivate
product_variants.*
product_images.*
warehouses.read
inventory.read
inventory.movements.read
inventory.adjust
inventory.transfer
inventory.receive
inventory.issue
inventory.low_stock.read
inventory.audit.read
reports.inventory.read
reports.low_stock.read
storage.product_images.manage
notifications.read
notifications.mark_read
sync.status.read
```

### صلاحيات اختيارية

```txt
inventory.valuation.read
products.cost.read
products.prices.update
```

### ممنوع افتراضيًا

```txt
sales.confirm
payments.*
returns.approve
accounting.*
reports.profit.read
backup.*
settings.security.*
```

---

## 9.7 Accountant

المحاسب.

### صلاحيات مقترحة

```txt
settings.read
currencies.read
exchange_rates.read
exchange_rates.create
customers.read
customers.balance.read
customers.statement.read
suppliers.read
suppliers.balance.read
sales.read
payments.read
payments.create
returns.read
credit_notes.read
purchases.read
purchases.confirm
purchases.payments.create
accounting.accounts.read
accounting.accounts.create
accounting.accounts.update
accounting.journals.read
accounting.journals.create
accounting.journals.update_draft
accounting.journals.post
accounting.journals.reverse
accounting.reports.trial_balance.read
accounting.reports.profit_loss.read
accounting.reports.ledger.read
reports.sales.read
reports.inventory_valuation.read
reports.customers.read
reports.suppliers.read
reports.profit.read
reports.export
dashboard.read
audit_logs.read
backup.read
```

### ممنوع افتراضيًا

```txt
roles.*
users.assign_roles
settings.security.update
sales.void
inventory.adjust
backup.restore
backup.download
sync.conflicts.resolve
```

---

## 9.8 Purchasing Officer

مسؤول المشتريات.

### صلاحيات مقترحة

```txt
suppliers.read
suppliers.create
suppliers.update
purchases.read
purchases.create
purchases.cancel
products.read
product_variants.read
inventory.read
inventory.receive
reports.inventory.read
notifications.read
notifications.mark_read
```

### صلاحيات اختيارية

```txt
purchases.confirm
purchases.payments.create
suppliers.balance.read
```

### ممنوع افتراضيًا

```txt
accounting.*
payments.refund
sales.*
returns.approve
backup.*
settings.*
roles.*
users.*
```

---

## 9.9 Auditor

مراجع قراءة فقط.

### صلاحيات مقترحة

```txt
settings.read
users.read
roles.read
branches.read
warehouses.read
currencies.read
exchange_rates.read
categories.read
products.read
product_variants.read
inventory.read
inventory.movements.read
customers.read
customers.balance.read
customers.statement.read
suppliers.read
suppliers.balance.read
sales.read
payments.read
returns.read
credit_notes.read
purchases.read
accounting.accounts.read
accounting.journals.read
accounting.reports.trial_balance.read
accounting.reports.profit_loss.read
accounting.reports.ledger.read
dashboard.read
reports.sales.read
reports.inventory.read
reports.inventory_valuation.read
reports.customers.read
reports.suppliers.read
reports.profit.read
backup.read
audit_logs.read
notifications.read
sync.status.read
```

### ممنوع

كل صلاحيات الإنشاء، التعديل، الحذف، الاعتماد، الترحيل، الاستعادة، والتصدير الحساس إلا إذا قرر Owner خلاف ذلك.

---

## 9.10 Support

الدعم الفني.

### صلاحيات مقترحة في MVP

```txt
settings.read
products.read
inventory.read
sales.read
reports.sales.read
sync.status.read
sync.devices.read
notifications.read
audit_logs.read
storage.files.read
```

### ممنوع افتراضيًا

```txt
users.reset_password
users.assign_roles
roles.*
settings.security.update
sales.create
payments.*
returns.*
purchases.*
accounting.*
backup.download
backup.restore
inventory.adjust
```

ملاحظة: إذا احتاج الدعم الفني للدخول إلى بيانات عميل حقيقي، يجب توثيق سياسة واضحة وموافقة من صاحب المنشأة لاحقًا.

---

## 10. صلاحيات شديدة الحساسية

هذه الصلاحيات يجب ألا تمنح إلا لـ Owner أو دور محدد جدًا:

```txt
roles.assign_permissions
settings.security.update
currencies.set_base
inventory.cost.update
inventory.adjust
pos.discount.override
sales.void
payments.void
payments.refund
returns.approve
returns.process
credit_notes.void
purchases.confirm
purchases.void
accounting.journals.post
accounting.journals.reverse
accounting.system_accounts.manage
reports.profit.read
backup.download
backup.restore
sync.conflicts.resolve
audit_logs.export
```

### قواعد إضافية لهذه الصلاحيات

1. يجب تسجيلها في Audit Log.
2. يفضل طلب تأكيد إضافي من المستخدم.
3. يجب أن تظهر في شاشة إدارة الأدوار كمجموعة خطرة.
4. لا تمنح افتراضيًا للأدوار التشغيلية.

---

## 11. صلاحيات التكلفة والربحية

تكلفة المنتج والربحية ليست معلومات عادية، لأنها تكشف هامش الربح.

### صلاحيات مرتبطة

```txt
products.cost.read
sales.cost.read
inventory.valuation.read
reports.profit.read
accounting.reports.profit_loss.read
```

### الأدوار المسموح لها افتراضيًا

| الدور | رؤية التكلفة | رؤية الربحية |
|---|---:|---:|
| Owner | ✅ | ✅ |
| Admin | ⚠️ | ⚠️ |
| Accountant | ✅ | ✅ |
| Branch Manager | ⚠️ | ⚠️ |
| Inventory Manager | ⚠️ | ❌ |
| Cashier | ❌ | ❌ |
| Salesperson | ❌ | ❌ |
| Purchasing Officer | ⚠️ | ❌ |
| Auditor | 👁️ | 👁️ |
| Support | ❌ | ❌ |

---

## 12. قواعد الصلاحيات في Offline/Sync

## RBAC-SYNC-001 — الصلاحية وقت الإنشاء ووقت المزامنة

يجب التحقق من الصلاحية عند إنشاء العملية Offline في الواجهة، ويجب إعادة التحقق عند وصولها إلى Backend أثناء المزامنة.

---

## RBAC-SYNC-002 — فقدان الصلاحية قبل المزامنة

إذا فقد المستخدم الصلاحية قبل مزامنة عملية Offline، يحق للـ Backend رفض العملية أو وضعها في حالة مراجعة حسب نوع العملية.

---

## RBAC-SYNC-003 — العمليات المالية Offline محدودة

في MVP يسمح للـ Cashier بإنشاء بيع Offline فقط إذا كان يملك:

```txt
sync.offline_sales.create
pos.sell
sales.create
payments.create
```

---

## RBAC-SYNC-004 — حل التعارضات ليس للصراف

حل تعارضات المزامنة يجب أن يكون للمدير أو المسؤول فقط:

```txt
sync.conflicts.resolve
```

---

## 13. قواعد الصلاحيات في Backup

## RBAC-BACKUP-001 — إنشاء Backup

يسمح فقط لمن يملك:

```txt
backup.create
```

---

## RBAC-BACKUP-002 — تنزيل Backup

تنزيل النسخة الاحتياطية أكثر خطورة من إنشائها؛ لأنه قد يكشف كل البيانات.

```txt
backup.download
```

يجب حصرها في Owner افتراضيًا.

---

## RBAC-BACKUP-003 — استعادة Backup

الاستعادة قد تمسح أو تغير بيانات قائمة، لذلك لا تنفذ إلا بصلاحية:

```txt
backup.restore
```

ويجب تسجيلها في Audit Log مع تحذير واضح.

---

## 14. قواعد تطبيق الصلاحيات في Backend

## 14.1 Decorator مقترح

```ts
@RequirePermissions('sales.create')
```

أو:

```ts
@RequirePermissions(['sales.create', 'pos.sell'])
```

---

## 14.2 دعم أي/كل الصلاحيات

بعض العمليات تحتاج كل الصلاحيات:

```txt
AND: sales.create + pos.sell + payments.create
```

وبعض العمليات تقبل واحدة من عدة صلاحيات:

```txt
OR: reports.sales.read OR sales.read
```

يجب أن يكون هذا واضحًا في Guards.

---

## 14.3 تفسير Wildcard

إذا امتلك المستخدم:

```txt
products.*
```

فيجب أن يسمح له بـ:

```txt
products.read
products.create
products.update
products.deactivate
products.delete
products.cost.read
products.prices.update
products.discounts.manage
```

لكن لا يجب أن يسمح له بصلاحيات خارج النطاق مثل:

```txt
inventory.adjust
sales.create
```

---

## 14.4 التحقق من الحالة وليس الصلاحية فقط

وجود الصلاحية لا يكفي. يجب التحقق من حالة السجل.

أمثلة:

- لا يمكن تعديل فاتورة Posted حتى لو لدى المستخدم `sales.update`.
- لا يمكن حذف حساب محاسبي عليه قيود حتى لو لدى المستخدم `accounting.accounts.update`.
- لا يمكن بيع منتج غير نشط حتى لو لدى المستخدم `pos.sell`.
- لا يمكن إرجاع كمية أكبر من المباعة حتى لو لدى المستخدم `returns.approve`.

---

## 15. قواعد تطبيق الصلاحيات في Frontend

## 15.1 إخفاء الواجهات غير المصرح بها

إذا لم يملك المستخدم صلاحية صفحة أو زر، يجب إخفاؤه أو تعطيله برسالة واضحة.

---

## 15.2 لا تعتمد الواجهة على نفسها

حتى لو أخفت الواجهة الزر، يجب أن يرفض Backend العملية إذا أرسلت يدويًا.

---

## 15.3 حالات الواجهة

| الحالة | السلوك |
|---|---|
| لا يملك صلاحية الصفحة | عرض 403 أو إخفاء الرابط |
| لا يملك صلاحية الزر | إخفاء أو تعطيل الزر |
| لا يملك صلاحية رؤية التكلفة | إخفاء التكلفة والربح |
| لا يملك صلاحية اعتماد | عرض الحالة فقط دون زر اعتماد |

---

## 16. Seed مقترح للأدوار

## 16.1 roles

```json
[
  {
    "code": "owner",
    "name": "Owner",
    "description": "صاحب المنشأة وصاحب أعلى صلاحية داخل بيانات المنشأة"
  },
  {
    "code": "admin",
    "name": "Admin",
    "description": "مدير النظام داخل المنشأة"
  },
  {
    "code": "branch_manager",
    "name": "Branch Manager",
    "description": "مدير فرع أو محل"
  },
  {
    "code": "cashier",
    "name": "Cashier",
    "description": "الصراف المسؤول عن البيع والتحصيل"
  },
  {
    "code": "salesperson",
    "name": "Salesperson",
    "description": "موظف مبيعات"
  },
  {
    "code": "inventory_manager",
    "name": "Inventory Manager",
    "description": "مسؤول المخزون"
  },
  {
    "code": "accountant",
    "name": "Accountant",
    "description": "المحاسب"
  },
  {
    "code": "purchasing_officer",
    "name": "Purchasing Officer",
    "description": "مسؤول المشتريات"
  },
  {
    "code": "auditor",
    "name": "Auditor",
    "description": "مراجع بصلاحيات قراءة"
  },
  {
    "code": "support",
    "name": "Support",
    "description": "دعم فني محدود"
  }
]
```

---

## 17. صلاحيات مطلوبة حسب أهم سيناريوهات MVP

## 17.1 بيع من POS

المستخدم يحتاج:

```txt
pos.access
pos.products.read
pos.sell
sales.create
sales.confirm
payments.create
inventory.read
customers.read
```

إذا كان سينشئ عميلًا جديدًا:

```txt
customers.create
```

إذا كان يطبق خصمًا خاصًا:

```txt
pos.discount.override
```

---

## 17.2 إضافة منتج وصورة

```txt
products.create
product_variants.create
product_images.upload
storage.files.upload
categories.read
```

---

## 17.3 إدخال مخزون يدوي

```txt
inventory.adjust
inventory.movements.read
products.read
warehouses.read
```

---

## 17.4 إنشاء مرتجع واعتماده

إنشاء طلب مرتجع:

```txt
returns.create
sales.read
```

اعتماد وتنفيذ المرتجع:

```txt
returns.approve
returns.process
credit_notes.create
inventory.receive
```

---

## 17.5 إنشاء فاتورة شراء واعتمادها

```txt
purchases.create
purchases.confirm
suppliers.read
inventory.receive
accounting.journals.read
```

حسب التصميم، قد يحتاج الاعتماد إلى صلاحية محاسبية أو يقوم النظام بإنشاء القيد تلقائيًا دون منح المستخدم صلاحية قيد يدوي.

---

## 17.6 ترحيل قيد محاسبي

```txt
accounting.journals.read
accounting.journals.post
```

---

## 17.7 إنشاء Backup

```txt
backup.create
backup.read
```

---

## 17.8 استعادة Backup

```txt
backup.restore
backup.read
audit_logs.read
```

ويجب أن تكون للـ Owner فقط افتراضيًا.

---

## 18. متطلبات قاعدة البيانات للصلاحيات

الحد الأدنى المقترح:

```txt
User
Role
Permission
UserRole
RolePermission
```

### 18.1 User

```txt
id
name
email
passwordHash
isActive
lastLoginAt
createdAt
updatedAt
```

### 18.2 Role

```txt
id
code
name
description
isSystem
isActive
createdAt
updatedAt
```

### 18.3 Permission

```txt
id
code
module
action
description
sensitivity
isActive
createdAt
updatedAt
```

### 18.4 UserRole

```txt
userId
roleId
assignedBy
assignedAt
```

### 18.5 RolePermission

```txt
roleId
permissionId
assignedBy
assignedAt
```

---

## 19. رسائل الخطأ المرتبطة بالصلاحيات

| الكود | الرسالة | الحالة |
|---|---|---|
| `UNAUTHENTICATED` | يجب تسجيل الدخول أولًا. | 401 |
| `PERMISSION_DENIED` | لا تملك صلاحية تنفيذ هذه العملية. | 403 |
| `ROLE_NOT_FOUND` | الدور غير موجود. | 404 |
| `PERMISSION_NOT_FOUND` | الصلاحية غير موجودة. | 404 |
| `SYSTEM_ROLE_LOCKED` | لا يمكن تعديل دور نظامي محمي. | 409 |
| `SYSTEM_PERMISSION_LOCKED` | لا يمكن تعديل صلاحية نظامية محمية. | 409 |
| `CANNOT_REMOVE_LAST_OWNER` | لا يمكن إزالة آخر صاحب صلاحية عليا. | 409 |
| `SENSITIVE_PERMISSION_REQUIRED` | هذه العملية تتطلب صلاحية حساسة. | 403 |
| `BRANCH_SCOPE_DENIED` | لا تملك صلاحية على هذا الفرع. | 403 |
| `WAREHOUSE_SCOPE_DENIED` | لا تملك صلاحية على هذا المخزن. | 403 |

---

## 20. قواعد حماية الأدوار النظامية

## RBAC-SYS-001 — لا حذف للأدوار النظامية

الأدوار النظامية مثل Owner وAdmin لا تحذف، لكن يمكن تعطيل بعض صلاحياتها فقط إذا لم تكسر النظام.

---

## RBAC-SYS-002 — لا إزالة آخر Owner

يجب منع إزالة آخر مستخدم يملك دور Owner أو صلاحية مكافئة.

---

## RBAC-SYS-003 — لا منح صلاحيات حرجة عشوائيًا

أي منح لصلاحيات حرجة يجب أن يسجل في Audit Log.

---

## 21. Audit Log المطلوب للصلاحيات

يجب تسجيل العمليات التالية:

- إنشاء مستخدم.
- تعطيل مستخدم.
- تغيير دور مستخدم.
- إنشاء دور.
- تعديل دور.
- منح صلاحية.
- سحب صلاحية.
- محاولة وصول مرفوضة لعملية حساسة.
- تنفيذ صلاحية حرجة مثل Backup Restore أو Journal Reverse.

### الحقول المقترحة

```txt
actorUserId
action
resourceType
resourceId
oldValue
newValue
ipAddress
userAgent
createdAt
```

---

## 22. اختبارات القبول للصلاحيات

## 22.1 اختبارات عامة

| رقم | الاختبار | النتيجة المتوقعة |
|---|---|---|
| RBAC-TC-001 | مستخدم بلا صلاحية يحاول فتح صفحة محمية | 403 أو إخفاء الصفحة |
| RBAC-TC-002 | Cashier يحاول تعديل الإعدادات | رفض |
| RBAC-TC-003 | Cashier ينفذ بيع POS | نجاح |
| RBAC-TC-004 | Cashier يحاول رؤية الربح | رفض |
| RBAC-TC-005 | Inventory Manager يعدل مخزون | نجاح إذا لديه `inventory.adjust` |
| RBAC-TC-006 | Salesperson يحاول تسجيل دفعة | رفض |
| RBAC-TC-007 | Accountant يرحل قيدًا | نجاح إذا لديه `accounting.journals.post` |
| RBAC-TC-008 | Branch Manager يحاول Restore Backup | رفض |
| RBAC-TC-009 | Owner يعدل صلاحيات دور | نجاح مع Audit Log |
| RBAC-TC-010 | محاولة إزالة آخر Owner | رفض |

---

## 22.2 اختبارات Wildcard

| رقم | الاختبار | النتيجة المتوقعة |
|---|---|---|
| RBAC-WC-001 | مستخدم لديه `products.*` ينشئ منتجًا | نجاح |
| RBAC-WC-002 | مستخدم لديه `products.*` يعدل مخزونًا | رفض |
| RBAC-WC-003 | مستخدم لديه `sales.*` ينشئ فاتورة | نجاح |
| RBAC-WC-004 | مستخدم لديه `sales.*` يرحل قيدًا | رفض |

---

## 22.3 اختبارات العمليات الحساسة

| رقم | الاختبار | النتيجة المتوقعة |
|---|---|---|
| RBAC-SEN-001 | محاولة `backup.restore` بدون صلاحية | رفض |
| RBAC-SEN-002 | محاولة `sales.void` من Cashier | رفض |
| RBAC-SEN-003 | محاولة `returns.approve` من Cashier | رفض |
| RBAC-SEN-004 | محاولة `accounting.journals.reverse` من غير محاسب/Owner | رفض |
| RBAC-SEN-005 | محاولة `currencies.set_base` بعد وجود عمليات مالية | رفض أو تحذير وسياسة واضحة |

---

## 23. قواعد واجهة إدارة الصلاحيات

في MVP يمكن أن تكون شاشة إدارة الأدوار بسيطة، لكن يجب أن تراعي:

1. عرض الصلاحيات مجمعة حسب الموديول.
2. تمييز الصلاحيات الحساسة بلون أو تحذير.
3. منع تعديل أدوار النظام الحرجة إلا من Owner.
4. إظهار عدد المستخدمين المرتبطين بكل دور.
5. تسجيل كل تغيير في Audit Log.
6. منع حفظ دور بلا اسم أو بلا صلاحيات واضحة.

---

## 24. ما لا يجب فعله في MVP

لا تفعلوا الآتي في نسخة MVP:

1. صلاحيات معقدة جدًا لكل زر صغير.
2. Workflow موافقات متعدد المستويات لكل عملية.
3. ABAC متقدم قبل استقرار النظام.
4. صلاحيات مبنية على شروط كثيرة يصعب اختبارها.
5. إعطاء Admin كل صلاحيات Owner تلقائيًا دون قرار واعٍ.
6. السماح للصراف برؤية الربحية أو التكلفة.
7. السماح بحذف فواتير أو قيود منشورة.
8. السماح باستعادة Backup دون Audit وتحذير.
9. الاعتماد على Frontend فقط لحماية العمليات.
10. ترك endpoints بدون Guards بحجة أنها مخفية في الواجهة.

---

## 25. توصية تنفيذية للـ MVP

لإغلاق MVP بسرعة وبأمان، اعتمدوا التالي:

1. إنشاء جدول Permissions بكل الأكواد المذكورة في هذه الوثيقة.
2. إنشاء الأدوار العشرة الافتراضية.
3. ربط Owner بكل الصلاحيات.
4. ربط Admin بمعظم الصلاحيات عدا الحرجة جدًا.
5. تقييد Cashier ببيع POS فقط وما يلزمه.
6. تقييد Accountant بالمحاسبة والتقارير المالية.
7. تقييد Inventory Manager بالمخزون والمنتجات.
8. تفعيل Backend Guards قبل أي ربط Frontend نهائي.
9. استخدام نفس permission codes في الواجهة لإخفاء الأزرار.
10. كتابة اختبارات RBAC للعمليات الحرجة فقط في البداية.

---

## 26. تعريف النجاح لهذه الوثيقة

تعتبر هذه الوثيقة منفذة بنجاح إذا تحقق الآتي:

1. كل endpoint حساس لديه صلاحية واضحة.
2. لا يستطيع Cashier تنفيذ عمليات إدارية أو محاسبية.
3. لا يستطيع أي مستخدم رؤية الأرباح إلا بصلاحية صريحة.
4. لا يمكن تنفيذ بيع أو مرتجع أو تعديل مخزون دون صلاحية.
5. لا يمكن ترحيل أو عكس قيد دون صلاحية محاسبية.
6. لا يمكن إنشاء أو استعادة Backup دون صلاحية حرجة.
7. Wildcard يعمل بطريقة صحيحة ومحدودة.
8. كل تغيير في المستخدمين والأدوار والصلاحيات يسجل في Audit Log.
9. Frontend يخفي غير المصرح به، وBackend يرفضه إن أرسل يدويًا.
10. اختبارات RBAC الأساسية ناجحة.

---

## 27. القرار النهائي للـ MVP

يعتمد مشروع **الزيتون سوفت** في نسخة MVP على RBAC بسيط وقوي، لا على نموذج صلاحيات معقد. الهدف هو حماية العمليات الحساسة مع إبقاء النظام قابلًا للفهم والتنفيذ والاختبار.

القاعدة النهائية:

```txt
الصلاحيات تحمي المال، المخزون، المحاسبة، والإعدادات.
ما عدا ذلك يبقى بسيطًا قدر الإمكان في MVP.
```

---

**نهاية الوثيقة**
