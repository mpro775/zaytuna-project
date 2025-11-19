# 🗄️ مخطط قاعدة البيانات (Database Schema)

## نظرة عامة

نظام إدارة نقاط البيع الشامل لشركة BThwani مبني باستخدام **PostgreSQL** و **Prisma ORM**. يتكون النظام من **5 فئات رئيسية** من الجداول تغطي جميع جوانب إدارة الأعمال التجارية.

### 📊 إحصائيات قاعدة البيانات
- **عدد الجداول**: 35 جدول رئيسي
- **قاعدة البيانات**: PostgreSQL
- **ORM**: Prisma
- **اللغة**: الإنجليزية (مع تعليقات عربية)
- **الترميز**: UTF-8

---

## 📁 فئات الجداول

### 1. 🏢 البنية الأساسية (Infrastructure Models)
| الجدول | الغرض | العلاقات الرئيسية |
|---------|--------|-------------------|
| `companies` | معلومات الشركة | branches |
| `branches` | الفروع | users, warehouses, sales_invoices, audit_logs |
| `warehouses` | المخازن | stock_items, sales_invoices, purchase_orders |

### 2. 👥 المستخدمون والأمان (Users & Security)
| الجدول | الغرض | العلاقات الرئيسية |
|---------|--------|-------------------|
| `roles` | الأدوار والصلاحيات | users |
| `users` | المستخدمون | branches, roles, sales_invoices, audit_logs |
| `audit_logs` | سجلات التدقيق | users, branches, warehouses |

### 3. 📦 المنتجات والمخزون (Products & Inventory)
| الجدول | الغرض | العلاقات الرئيسية |
|---------|--------|-------------------|
| `categories` | فئات المنتجات | products |
| `products` | المنتجات الأساسية | categories, product_variants |
| `product_variants` | متغيرات المنتجات | products, stock_items |
| `stock_items` | عناصر المخزون | warehouses, product_variants |
| `stock_movements` | حركات المخزون | warehouses, product_variants |

### 4. 💰 المبيعات والمشتريات (Sales & Purchasing)
| الجدول | الغرض | العلاقات الرئيسية |
|---------|--------|-------------------|
| `customers` | العملاء | sales_invoices, payments |
| `suppliers` | الموردين | purchase_orders, purchase_invoices |
| `currencies` | العملات | sales_invoices, payments |
| `taxes` | الضرائب | products, sales_invoices |

### 5. 🧾 الفواتير والمدفوعات (Invoices & Payments)
| الجدول | الغرض | العلاقات الرئيسية |
|---------|--------|-------------------|
| `sales_invoices` | فواتير المبيعات | customers, cashiers, warehouses |
| `sales_invoice_lines` | تفاصيل فاتورة المبيعات | sales_invoices, product_variants |
| `payments` | المدفوعات | sales_invoices, customers |
| `returns` | المرتجعات | sales_invoices, customers |
| `credit_notes` | إشعارات الدائن | returns, customers |

### 6. 📋 أوامر وفواتير المشتريات (Purchase Orders & Invoices)
| الجدول | الغرض | العلاقات الرئيسية |
|---------|--------|-------------------|
| `purchase_orders` | أوامر الشراء | suppliers, warehouses |
| `purchase_order_lines` | تفاصيل أمر الشراء | purchase_orders, products |
| `purchase_invoices` | فواتير المشتريات | suppliers, warehouses |
| `purchase_invoice_lines` | تفاصيل فاتورة المشتريات | purchase_invoices, product_variants |
| `purchase_payments` | مدفوعات المشتريات | purchase_invoices, suppliers |

### 7. 💼 النظام المحاسبي (Accounting System)
| الجدول | الغرض | العلاقات الرئيسية |
|---------|--------|-------------------|
| `gl_accounts` | الحسابات العامة | journal_entries |
| `journal_entries` | القيود اليومية | gl_accounts |
| `journal_entry_lines` | تفاصيل القيود | journal_entries, gl_accounts |

### 8. 🔄 التكاملات والمزامنة (Integration & Sync)
| الجدول | الغرض | العلاقات الرئيسية |
|---------|--------|-------------------|
| `sync_batches` | دفعات المزامنة | branches, users |
| `payment_transactions` | معاملات الدفع | customers, suppliers, branches |

### 9. 📢 الإشعارات (Notifications)
| الجدول | الغرض | العلاقات الرئيسية |
|---------|--------|-------------------|
| `notifications` | الإشعارات | users, branches, templates |
| `notification_templates` | قوالب الإشعارات | notifications |
| `notification_preferences` | تفضيلات الإشعارات | users |

### 10. 📁 نظام التخزين (Storage System)
| الجدول | الغرض | العلاقات الرئيسية |
|---------|--------|-------------------|
| `files` | الملفات | users, branches |
| `file_versions` | إصدارات الملفات | files, users |
| `file_access_logs` | سجل الوصول للملفات | files |
| `storage_buckets` | حاويات التخزين | users |

### 11. 🔒 النسخ الاحتياطي (Backup System)
| الجدول | الغرض | العلاقات الرئيسية |
|---------|--------|-------------------|
| `backup_metadata` | بيانات النسخ الاحتياطي | users, branches |

---

## 📋 تفاصيل الجداول الرئيسية

### 🏢 الشركة والفروع (Company & Branches)

#### جدول الشركات (`companies`)
```sql
CREATE TABLE companies (
  id VARCHAR(50) PRIMARY KEY DEFAULT cuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  address TEXT,
  phone VARCHAR(50),
  email VARCHAR(255),
  tax_number VARCHAR(100),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### جدول الفروع (`branches`)
```sql
CREATE TABLE branches (
  id VARCHAR(50) PRIMARY KEY DEFAULT cuid(),
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) UNIQUE NOT NULL,
  address TEXT,
  phone VARCHAR(50),
  email VARCHAR(255),
  manager_id VARCHAR(50),
  company_id VARCHAR(50) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);

-- الفهرسة
CREATE INDEX idx_branches_company_id ON branches(company_id);
```

### 👥 المستخدمون والأدوار (Users & Roles)

#### جدول الأدوار (`roles`)
```sql
CREATE TABLE roles (
  id VARCHAR(50) PRIMARY KEY DEFAULT cuid(),
  name VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  permissions JSON DEFAULT '[]',
  is_system_role BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### جدول المستخدمين (`users`)
```sql
CREATE TABLE users (
  id VARCHAR(50) PRIMARY KEY DEFAULT cuid(),
  username VARCHAR(100) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(50),
  password_hash VARCHAR(255) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  last_login_at TIMESTAMP,
  branch_id VARCHAR(50),
  role_id VARCHAR(50) NOT NULL,
  two_factor_enabled BOOLEAN DEFAULT false,
  two_factor_secret VARCHAR(255),
  biometric_enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  FOREIGN KEY (branch_id) REFERENCES branches(id),
  FOREIGN KEY (role_id) REFERENCES roles(id)
);

-- الفهرسة
CREATE INDEX idx_users_branch_id ON users(branch_id);
CREATE INDEX idx_users_role_id ON users(role_id);
CREATE INDEX idx_users_email ON users(email);
```

### 📦 المنتجات والمخزون (Products & Inventory)

#### جدول الفئات (`categories`)
```sql
CREATE TABLE categories (
  id VARCHAR(50) PRIMARY KEY DEFAULT cuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  parent_id VARCHAR(50),
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  FOREIGN KEY (parent_id) REFERENCES categories(id)
);

-- الفهرسة
CREATE INDEX idx_categories_parent_id ON categories(parent_id);
```

#### جدول المنتجات (`products`)
```sql
CREATE TABLE products (
  id VARCHAR(50) PRIMARY KEY DEFAULT cuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  barcode VARCHAR(100) UNIQUE,
  sku VARCHAR(100) UNIQUE,
  category_id VARCHAR(50) NOT NULL,
  base_price DECIMAL(10,2) NOT NULL,
  cost_price DECIMAL(10,2),
  tax_id VARCHAR(50),
  is_active BOOLEAN DEFAULT true,
  track_inventory BOOLEAN DEFAULT true,
  reorder_point INTEGER DEFAULT 0,
  image_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  FOREIGN KEY (category_id) REFERENCES categories(id),
  FOREIGN KEY (tax_id) REFERENCES taxes(id)
);

-- الفهرسة
CREATE INDEX idx_products_category_id ON products(category_id);
CREATE INDEX idx_products_barcode ON products(barcode);
CREATE INDEX idx_products_sku ON products(sku);
```

#### جدول متغيرات المنتجات (`product_variants`)
```sql
CREATE TABLE product_variants (
  id VARCHAR(50) PRIMARY KEY DEFAULT cuid(),
  product_id VARCHAR(50) NOT NULL,
  name VARCHAR(255) NOT NULL,
  sku VARCHAR(100) UNIQUE,
  barcode VARCHAR(100) UNIQUE,
  price DECIMAL(10,2),
  cost_price DECIMAL(10,2),
  weight DECIMAL(8,3),
  dimensions JSON,
  attributes JSON,
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- الفهرسة
CREATE INDEX idx_product_variants_product_id ON product_variants(product_id);
CREATE INDEX idx_product_variants_sku ON product_variants(sku);
CREATE INDEX idx_product_variants_barcode ON product_variants(barcode);
```

#### جدول عناصر المخزون (`stock_items`)
```sql
CREATE TABLE stock_items (
  id VARCHAR(50) PRIMARY KEY DEFAULT cuid(),
  warehouse_id VARCHAR(50) NOT NULL,
  product_variant_id VARCHAR(50) NOT NULL,
  quantity DECIMAL(10,3) NOT NULL,
  min_stock DECIMAL(10,3) DEFAULT 0,
  max_stock DECIMAL(10,3) DEFAULT 1000,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  FOREIGN KEY (warehouse_id) REFERENCES warehouses(id) ON DELETE CASCADE,
  FOREIGN KEY (product_variant_id) REFERENCES product_variants(id) ON DELETE CASCADE,

  UNIQUE(warehouse_id, product_variant_id)
);

-- الفهرسة
CREATE INDEX idx_stock_items_warehouse_id ON stock_items(warehouse_id);
CREATE INDEX idx_stock_items_product_variant_id ON stock_items(product_variant_id);
CREATE INDEX idx_stock_items_warehouse_product_variant ON stock_items(warehouse_id, product_variant_id);
CREATE INDEX idx_stock_items_quantity ON stock_items(quantity);
CREATE INDEX idx_stock_items_min_stock ON stock_items(min_stock);
CREATE INDEX idx_stock_items_warehouse_quantity ON stock_items(warehouse_id, quantity);
CREATE INDEX idx_stock_items_product_variant_warehouse_quantity ON stock_items(product_variant_id, warehouse_id, quantity);
```

### 💰 المبيعات (Sales)

#### جدول فواتير المبيعات (`sales_invoices`)
```sql
CREATE TABLE sales_invoices (
  id VARCHAR(50) PRIMARY KEY DEFAULT cuid(),
  invoice_number VARCHAR(50) UNIQUE NOT NULL,
  branch_id VARCHAR(50) NOT NULL,
  customer_id VARCHAR(50),
  cashier_id VARCHAR(50) NOT NULL,
  warehouse_id VARCHAR(50) NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  tax_amount DECIMAL(10,2) DEFAULT 0,
  discount_amount DECIMAL(10,2) DEFAULT 0,
  total_amount DECIMAL(10,2) NOT NULL,
  currency_id VARCHAR(50) NOT NULL,
  tax_id VARCHAR(50),
  status VARCHAR(50) DEFAULT 'draft',
  payment_status VARCHAR(50) DEFAULT 'pending',
  notes TEXT,
  due_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  FOREIGN KEY (branch_id) REFERENCES branches(id),
  FOREIGN KEY (customer_id) REFERENCES customers(id),
  FOREIGN KEY (cashier_id) REFERENCES users(id),
  FOREIGN KEY (warehouse_id) REFERENCES warehouses(id),
  FOREIGN KEY (currency_id) REFERENCES currencies(id),
  FOREIGN KEY (tax_id) REFERENCES taxes(id)
);

-- الفهرسة
CREATE INDEX idx_sales_invoices_branch_id ON sales_invoices(branch_id);
CREATE INDEX idx_sales_invoices_customer_id ON sales_invoices(customer_id);
CREATE INDEX idx_sales_invoices_cashier_id ON sales_invoices(cashier_id);
CREATE INDEX idx_sales_invoices_warehouse_id ON sales_invoices(warehouse_id);
CREATE INDEX idx_sales_invoices_status ON sales_invoices(status);
CREATE INDEX idx_sales_invoices_payment_status ON sales_invoices(payment_status);
CREATE INDEX idx_sales_invoices_invoice_number ON sales_invoices(invoice_number);
CREATE INDEX idx_sales_invoices_branch_status ON sales_invoices(branch_id, status);
CREATE INDEX idx_sales_invoices_customer_created_at ON sales_invoices(customer_id, created_at);
CREATE INDEX idx_sales_invoices_created_at_status ON sales_invoices(created_at, status);
CREATE INDEX idx_sales_invoices_branch_created_at ON sales_invoices(branch_id, created_at);
CREATE INDEX idx_sales_invoices_invoice_number_branch ON sales_invoices(invoice_number, branch_id);
```

#### جدول تفاصيل فاتورة المبيعات (`sales_invoice_lines`)
```sql
CREATE TABLE sales_invoice_lines (
  id VARCHAR(50) PRIMARY KEY DEFAULT cuid(),
  sales_invoice_id VARCHAR(50) NOT NULL,
  product_variant_id VARCHAR(50) NOT NULL,
  warehouse_id VARCHAR(50) NOT NULL,
  quantity DECIMAL(10,3) NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  discount_amount DECIMAL(10,2) DEFAULT 0,
  tax_amount DECIMAL(10,2) DEFAULT 0,
  line_total DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),

  FOREIGN KEY (sales_invoice_id) REFERENCES sales_invoices(id) ON DELETE CASCADE,
  FOREIGN KEY (product_variant_id) REFERENCES product_variants(id),
  FOREIGN KEY (warehouse_id) REFERENCES warehouses(id)
);

-- الفهرسة
CREATE INDEX idx_sales_invoice_lines_sales_invoice_id ON sales_invoice_lines(sales_invoice_id);
CREATE INDEX idx_sales_invoice_lines_product_variant_id ON sales_invoice_lines(product_variant_id);
CREATE INDEX idx_sales_invoice_lines_warehouse_id ON sales_invoice_lines(warehouse_id);
```

#### جدول المدفوعات (`payments`)
```sql
CREATE TABLE payments (
  id VARCHAR(50) PRIMARY KEY DEFAULT cuid(),
  sales_invoice_id VARCHAR(50),
  customer_id VARCHAR(50),
  currency_id VARCHAR(50) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  payment_method VARCHAR(50) NOT NULL,
  reference_number VARCHAR(100),
  notes TEXT,
  payment_date TIMESTAMP DEFAULT NOW(),
  processed_by VARCHAR(50),

  FOREIGN KEY (sales_invoice_id) REFERENCES sales_invoices(id),
  FOREIGN KEY (customer_id) REFERENCES customers(id),
  FOREIGN KEY (currency_id) REFERENCES currencies(id),
  FOREIGN KEY (processed_by) REFERENCES users(id)
);

-- الفهرسة
CREATE INDEX idx_payments_sales_invoice_id ON payments(sales_invoice_id);
CREATE INDEX idx_payments_customer_id ON payments(customer_id);
CREATE INDEX idx_payments_currency_id ON payments(currency_id);
CREATE INDEX idx_payments_payment_method ON payments(payment_method);
```

### 📋 أوامر المشتريات (Purchase Orders)

#### جدول أوامر الشراء (`purchase_orders`)
```sql
CREATE TABLE purchase_orders (
  id VARCHAR(50) PRIMARY KEY DEFAULT cuid(),
  order_number VARCHAR(50) UNIQUE NOT NULL,
  supplier_id VARCHAR(50) NOT NULL,
  warehouse_id VARCHAR(50) NOT NULL,
  requested_by VARCHAR(50) NOT NULL,
  expected_date TIMESTAMP,
  notes TEXT,
  status VARCHAR(50) DEFAULT 'draft',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  FOREIGN KEY (supplier_id) REFERENCES suppliers(id),
  FOREIGN KEY (warehouse_id) REFERENCES warehouses(id),
  FOREIGN KEY (requested_by) REFERENCES users(id)
);

-- الفهرسة
CREATE INDEX idx_purchase_orders_supplier_id ON purchase_orders(supplier_id);
CREATE INDEX idx_purchase_orders_warehouse_id ON purchase_orders(warehouse_id);
CREATE INDEX idx_purchase_orders_status ON purchase_orders(status);
CREATE INDEX idx_purchase_orders_order_number ON purchase_orders(order_number);
```

#### جدول فواتير المشتريات (`purchase_invoices`)
```sql
CREATE TABLE purchase_invoices (
  id VARCHAR(50) PRIMARY KEY DEFAULT cuid(),
  invoice_number VARCHAR(50) UNIQUE NOT NULL,
  supplier_id VARCHAR(50) NOT NULL,
  warehouse_id VARCHAR(50) NOT NULL,
  received_by VARCHAR(50) NOT NULL,
  purchase_order_id VARCHAR(50),
  subtotal DECIMAL(10,2) NOT NULL,
  tax_amount DECIMAL(10,2) DEFAULT 0,
  discount_amount DECIMAL(10,2) DEFAULT 0,
  total_amount DECIMAL(10,2) NOT NULL,
  currency_id VARCHAR(50) NOT NULL,
  invoice_date TIMESTAMP DEFAULT NOW(),
  due_date TIMESTAMP,
  status VARCHAR(50) DEFAULT 'draft',
  payment_status VARCHAR(50) DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  FOREIGN KEY (supplier_id) REFERENCES suppliers(id),
  FOREIGN KEY (warehouse_id) REFERENCES warehouses(id),
  FOREIGN KEY (received_by) REFERENCES users(id),
  FOREIGN KEY (purchase_order_id) REFERENCES purchase_orders(id),
  FOREIGN KEY (currency_id) REFERENCES currencies(id)
);

-- الفهرسة
CREATE INDEX idx_purchase_invoices_supplier_id ON purchase_invoices(supplier_id);
CREATE INDEX idx_purchase_invoices_warehouse_id ON purchase_invoices(warehouse_id);
CREATE INDEX idx_purchase_invoices_purchase_order_id ON purchase_invoices(purchase_order_id);
CREATE INDEX idx_purchase_invoices_status ON purchase_invoices(status);
CREATE INDEX idx_purchase_invoices_payment_status ON purchase_invoices(payment_status);
CREATE INDEX idx_purchase_invoices_invoice_number ON purchase_invoices(invoice_number);
```

### 💼 النظام المحاسبي (Accounting System)

#### جدول الحسابات العامة (`gl_accounts`)
```sql
CREATE TABLE gl_accounts (
  id VARCHAR(50) PRIMARY KEY DEFAULT cuid(),
  account_code VARCHAR(20) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  account_type VARCHAR(50) NOT NULL,
  parent_id VARCHAR(50),
  is_active BOOLEAN DEFAULT true,
  is_system BOOLEAN DEFAULT false,
  debit_balance DECIMAL(15,2) DEFAULT 0,
  credit_balance DECIMAL(15,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  FOREIGN KEY (parent_id) REFERENCES gl_accounts(id)
);

-- الفهرسة
CREATE INDEX idx_gl_accounts_account_code ON gl_accounts(account_code);
CREATE INDEX idx_gl_accounts_account_type ON gl_accounts(account_type);
CREATE INDEX idx_gl_accounts_parent_id ON gl_accounts(parent_id);
```

#### جدول القيود اليومية (`journal_entries`)
```sql
CREATE TABLE journal_entries (
  id VARCHAR(50) PRIMARY KEY DEFAULT cuid(),
  entry_number VARCHAR(20) UNIQUE NOT NULL,
  entry_date TIMESTAMP DEFAULT NOW(),
  description TEXT NOT NULL,
  reference_type VARCHAR(50),
  reference_id VARCHAR(50),
  source_module VARCHAR(50),
  status VARCHAR(20) DEFAULT 'draft',
  is_system BOOLEAN DEFAULT false,
  total_debit DECIMAL(15,2) DEFAULT 0,
  total_credit DECIMAL(15,2) DEFAULT 0,
  created_by VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- الفهرسة
CREATE INDEX idx_journal_entries_entry_number ON journal_entries(entry_number);
CREATE INDEX idx_journal_entries_entry_date ON journal_entries(entry_date);
CREATE INDEX idx_journal_entries_reference_type ON journal_entries(reference_type);
CREATE INDEX idx_journal_entries_reference_id ON journal_entries(reference_id);
CREATE INDEX idx_journal_entries_status ON journal_entries(status);
CREATE INDEX idx_journal_entries_source_module ON journal_entries(source_module);
```

---

## 🔗 العلاقات الرئيسية (Key Relationships)

### 1. التسلسل الهرمي للفئات
```
categories (parent-child hierarchy)
├── parent_id → categories.id
└── children → categories (one-to-many)
```

### 2. علاقات المنتجات والمخزون
```
products
├── category_id → categories.id
├── tax_id → taxes.id
└── variants → product_variants (one-to-many)

product_variants
├── product_id → products.id
└── stock_items → stock_items (one-to-many)

stock_items
├── warehouse_id → warehouses.id
└── product_variant_id → product_variants.id
```

### 3. علاقات المبيعات
```
sales_invoices
├── branch_id → branches.id
├── customer_id → customers.id
├── cashier_id → users.id
├── warehouse_id → warehouses.id
├── currency_id → currencies.id
├── tax_id → taxes.id
├── lines → sales_invoice_lines (one-to-many)
└── payments → payments (one-to-many)

sales_invoice_lines
├── sales_invoice_id → sales_invoices.id
├── product_variant_id → product_variants.id
└── warehouse_id → warehouses.id
```

### 4. علاقات المشتريات
```
purchase_orders
├── supplier_id → suppliers.id
├── warehouse_id → warehouses.id
├── requested_by → users.id
└── lines → purchase_order_lines (one-to-many)

purchase_invoices
├── supplier_id → suppliers.id
├── warehouse_id → warehouses.id
├── received_by → users.id
├── purchase_order_id → purchase_orders.id
├── currency_id → currencies.id
└── lines → purchase_invoice_lines (one-to-many)
```

### 5. علاقات المستخدمين والأدوار
```
users
├── branch_id → branches.id
├── role_id → roles.id
└── managed_warehouses → warehouses (one-to-many)

roles
└── users → users (one-to-many)
```

---

## 📊 الفهارس والأداء (Indexes & Performance)

### فهارس الأداء الرئيسية

#### فهارس البحث السريع
- `users.email` - تسجيل الدخول
- `products.barcode` - مسح الباركود
- `products.sku` - البحث بالكود
- `sales_invoices.invoice_number` - البحث برقم الفاتورة
- `stock_items.quantity` - تقارير المخزون

#### فهارس التجميع والتقارير
- `sales_invoices.branch_id + created_at` - مبيعات الفرع حسب التاريخ
- `sales_invoices.customer_id + created_at` - سلوك العملاء
- `audit_logs.user_id + timestamp` - نشاط المستخدمين
- `stock_movements.warehouse_id + created_at` - حركة المخزون

#### فهارس الحالة والفلترة
- `sales_invoices.status + payment_status` - الفواتير المعلقة
- `purchase_orders.status` - حالة أوامر الشراء
- `notifications.status + type` - الإشعارات المرسلة

---

## 🔒 القيود والتحقق (Constraints & Validation)

### القيود الفريدة (Unique Constraints)
- `branches.code` - كود الفرع فريد
- `users.username` - اسم المستخدم فريد
- `users.email` - البريد الإلكتروني فريد
- `products.barcode` - الباركود فريد
- `products.sku` - كود الصنف فريد
- `sales_invoices.invoice_number` - رقم الفاتورة فريد
- `purchase_orders.order_number` - رقم أمر الشراء فريد
- `gl_accounts.account_code` - رقم الحساب فريد

### القيود المرجعية (Foreign Key Constraints)
- **ON DELETE CASCADE**: حذف تلقائي للعناصر التابعة
- **ON DELETE SET NULL**: تعيين قيمة فارغة عند حذف المرجع
- **ON DELETE RESTRICT**: منع الحذف إذا كان هناك مراجع

### قيود البيانات (Data Constraints)
- **Decimal precision**: أسعار بدقة 2 منازل، كميات بدقة 3 منازل
- **String lengths**: حدود قصوى للحقول النصية
- **Boolean defaults**: قيم افتراضية للحقول المنطقية
- **Timestamp defaults**: تسجيل تلقائي لتواريخ الإنشاء والتحديث

---

## 📈 إحصائيات الاستخدام (Usage Statistics)

### أكثر الجداول استخداماً
1. `sales_invoices` - الفواتير اليومية
2. `sales_invoice_lines` - تفاصيل المبيعات
3. `stock_movements` - حركات المخزون
4. `audit_logs` - سجلات التدقيق
5. `users` - إدارة المستخدمين

### أحجام البيانات المتوقعة
- **العملاء**: 10,000 - 100,000 سجل
- **المنتجات**: 1,000 - 10,000 سجل
- **الفواتير**: 100,000 - 1,000,000 سجل شهرياً
- **سجلات التدقيق**: 500,000 - 5,000,000 سجل شهرياً

---

## 🛠️ الصيانة والنسخ الاحتياطي (Maintenance & Backup)

### النسخ الاحتياطي المنتظم
- **يومي**: بيانات المبيعات والمدفوعات
- **أسبوعي**: بيانات المخزون والعملاء
- **شهري**: البيانات التاريخية والتقارير

### تنظيف البيانات
- **سجلات التدقيق**: حذف بعد 2 سنة
- **إشعارات**: حذف بعد 6 أشهر
- **ملفات مؤقتة**: حذف بعد 30 يوم

---

## 🔄 الهجرة والتحديثات (Migrations & Updates)

### إستراتيجية الهجرة
1. **نسخ احتياطي كامل** قبل أي تغيير
2. **اختبار الهجرة** على بيئة التطوير
3. **هجرة تدريجية** مع إمكانية التراجع
4. **تحقق من البيانات** بعد الهجرة

### أدوات الهجرة
- **Prisma Migrate**: للهجرات التلقائية
- **Custom Scripts**: للهجرات المعقدة
- **Data Transformation**: لتحويل البيانات

---

## 📝 ملاحظات مهمة

### 🔐 الأمان
- جميع كلمات المرور مشفرة باستخدام bcrypt
- البيانات الحساسة مشفرة في قاعدة البيانات
- سجلات التدقيق شاملة لجميع العمليات

### 🌐 الأداء
- فهارس محسنة للاستعلامات الشائعة
- استخدام Connection Pooling
- استعلامات محسنة مع eager loading

### 🔄 التزامن
- معالجة التزامن في المخزون
- منع التعارض في المدفوعات
- مزامنة البيانات عبر الفروع

---

**📅 تاريخ آخر تحديث**: ديسمبر 2025
**👨‍💻 المطور**: فريق تطوير BThwani
**📊 إصدار الـ Schema**: v1.0.0
