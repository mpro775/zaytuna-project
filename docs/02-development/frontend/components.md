# وثائق مكونات الواجهة (UI Components Documentation)

## نظرة عامة

هذا الملف يحتوي على توثيق شامل لجميع مكونات الواجهة المستخدمة في تطبيق زيتونة SaaS. المكونات منظمة في فئات مختلفة حسب الاستخدام والوظيفة.

**تاريخ آخر تحديث**: ديسمبر 2025  
**حالة الإكمال**: 85%

---

## هيكل المكونات

```
src/components/
├── common/          # مكونات عامة قابلة لإعادة الاستخدام
├── layout/          # مكونات التخطيط (Layout)
├── ui/              # مكونات واجهة المستخدم المتخصصة
├── landing/         # مكونات صفحة الهبوط
├── sync/            # مكونات المزامنة والتنبيهات
└── inventory/       # مكونات إدارة المخزون
```

---

## 1. المكونات العامة (Common Components)

### 1.1 Button

**الموقع**: `src/components/ui/Button/Button.tsx`

**الوصف**: مكون زر مخصص مبني على Material-UI مع دعم حالات التحميل والألوان المختلفة.

**الخصائص (Props)**:

```typescript
interface ButtonProps extends Omit<MuiButtonProps, 'variant'> {
  variant?: 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info';
  loading?: boolean;
  loadingText?: string;
}
```

**الأمثلة**:

```tsx
// زر أساسي
<Button variant="primary" onClick={handleClick}>
  حفظ
</Button>

// زر مع حالة تحميل
<Button variant="primary" loading={isSubmitting} loadingText="جاري الحفظ...">
  حفظ
</Button>

// زر مع أيقونة
<Button variant="success" startIcon={<SaveIcon />}>
  حفظ التغييرات
</Button>
```

**حالات الاستخدام**:
- أزرار النماذج (حفظ، إلغاء، إرسال)
- أزرار الإجراءات في الجداول
- أزرار التنقل

---

### 1.2 Input

**الموقع**: `src/components/ui/Input/Input.tsx`

**الوصف**: مكون إدخال نصي محسّن مع دعم الأيقونات وإظهار/إخفاء كلمة المرور.

**الخصائص (Props)**:

```typescript
interface InputProps extends Omit<TextFieldProps, 'variant'> {
  variant?: 'outlined' | 'filled' | 'standard';
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
  showPasswordToggle?: boolean;
  helperText?: string;
  error?: boolean;
}
```

**الأمثلة**:

```tsx
// إدخال نصي عادي
<Input
  label="اسم المستخدم"
  value={username}
  onChange={(e) => setUsername(e.target.value)}
/>

// إدخال مع أيقونة
<Input
  label="البريد الإلكتروني"
  startIcon={<EmailIcon />}
  type="email"
/>

// إدخال كلمة مرور مع إظهار/إخفاء
<Input
  label="كلمة المرور"
  type="password"
  showPasswordToggle
  value={password}
  onChange={(e) => setPassword(e.target.value)}
/>

// إدخال مع رسالة خطأ
<Input
  label="البريد الإلكتروني"
  error={!!errors.email}
  helperText={errors.email?.message}
/>
```

**حالات الاستخدام**:
- حقول النماذج
- حقول البحث
- حقول كلمات المرور

---

### 1.3 Table

**الموقع**: `src/components/ui/Table/Table.tsx`

**الوصف**: مكون جدول متقدم مع دعم الترقيم، الفرز، الاختيار، والإجراءات.

**الخصائص (Props)**:

```typescript
interface TableProps<T = Record<string, unknown>> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  emptyMessage?: string;
  selectable?: boolean;
  actions?: Action<T>[];
  pagination?: {
    page: number;
    rowsPerPage: number;
    total: number;
    onPageChange: (page: number) => void;
    onRowsPerPageChange: (rowsPerPage: number) => void;
    rowsPerPageOptions?: number[];
  };
  sorting?: {
    orderBy: string;
    order: SortDirection;
    onSort: (property: string) => void;
  };
  onRowClick?: (row: T, index: number) => void;
  onSelectionChange?: (selectedRows: T[]) => void;
  selectedRows?: T[];
  stickyHeader?: boolean;
  maxHeight?: number | string;
  size?: 'small' | 'medium';
}
```

**الأمثلة**:

```tsx
// جدول بسيط
<Table
  columns={[
    { id: 'name', label: 'الاسم' },
    { id: 'email', label: 'البريد الإلكتروني' },
    { id: 'role', label: 'الدور' },
  ]}
  data={users}
/>

// جدول مع ترقيم وفرز
<Table
  columns={columns}
  data={products}
  pagination={{
    page: currentPage,
    rowsPerPage: pageSize,
    total: totalProducts,
    onPageChange: setCurrentPage,
    onRowsPerPageChange: setPageSize,
  }}
  sorting={{
    orderBy: sortBy,
    order: sortOrder,
    onSort: handleSort,
  }}
/>

// جدول مع إجراءات
<Table
  columns={columns}
  data={items}
  actions={[
    {
      id: 'edit',
      label: 'تعديل',
      icon: <EditIcon />,
      onClick: (row) => handleEdit(row),
    },
    {
      id: 'delete',
      label: 'حذف',
      icon: <DeleteIcon />,
      onClick: (row) => handleDelete(row),
      color: 'error',
    },
  ]}
/>

// جدول قابل للاختيار
<Table
  columns={columns}
  data={items}
  selectable
  onSelectionChange={setSelectedItems}
  selectedRows={selectedItems}
/>
```

**حالات الاستخدام**:
- عرض قوائم البيانات
- الجداول القابلة للترقيم
- الجداول مع إجراءات متعددة

---

### 1.4 Modal

**الموقع**: `src/components/ui/Modal/Modal.tsx`

**الوصف**: مكون نافذة منبثقة (Dialog) مخصص مع دعم RTL والأحجام المختلفة.

**الخصائص (Props)**:

```typescript
interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | false;
  fullWidth?: boolean;
  fullScreen?: boolean;
  showCloseButton?: boolean;
  disableBackdropClick?: boolean;
  disableEscapeKeyDown?: boolean;
}
```

**الأمثلة**:

```tsx
// نافذة منبثقة بسيطة
<Modal
  open={isOpen}
  onClose={handleClose}
  title="تأكيد الحذف"
>
  <Typography>هل أنت متأكد من حذف هذا العنصر؟</Typography>
  <Modal.Actions>
    <Button onClick={handleClose}>إلغاء</Button>
    <Button variant="error" onClick={handleDelete}>حذف</Button>
  </Modal.Actions>
</Modal>

// نافذة منبثقة كبيرة
<Modal
  open={isOpen}
  onClose={handleClose}
  title="تفاصيل المنتج"
  maxWidth="lg"
>
  <ProductDetails product={product} />
</Modal>
```

**حالات الاستخدام**:
- تأكيد الإجراءات
- عرض التفاصيل
- النماذج في نوافذ منبثقة

---

### 1.5 Loading

**الموقع**: `src/components/ui/Loading/Loading.tsx`

**الوصف**: مكونات تحميل متعددة الأنواع (Spinner, Linear, Skeleton, Backdrop).

**الخصائص (Props)**:

```typescript
interface LoadingProps {
  type?: 'spinner' | 'linear' | 'skeleton' | 'backdrop';
  size?: 'small' | 'medium' | 'large';
  color?: 'primary' | 'secondary' | 'inherit';
  message?: string;
  fullScreen?: boolean;
}
```

**الأمثلة**:

```tsx
// Spinner عادي
<Loading type="spinner" message="جاري التحميل..." />

// Linear Progress
<Loading type="linear" message="جاري تحميل البيانات..." />

// Skeleton للهيكل
<Loading type="skeleton" />

// Backdrop للشاشة الكاملة
<Loading type="backdrop" fullScreen message="جاري المعالجة..." />
```

**حالات الاستخدام**:
- حالات التحميل في الصفحات
- حالات التحميل في الجداول
- حالات التحميل في النماذج

---

## 2. مكونات التخطيط (Layout Components)

### 2.1 MainLayout

**الموقع**: `src/components/layout/MainLayout/MainLayout.tsx`

**الوصف**: التخطيط الرئيسي للتطبيق مع Header وSidebar وFooter.

**الخصائص (Props)**:

```typescript
interface MainLayoutProps {
  children: React.ReactNode;
}
```

**الميزات**:
- Header مع معلومات المستخدم والإشعارات
- Sidebar قابل للطي مع القوائم
- Breadcrumb navigation
- Footer
- Responsive design

**الأمثلة**:

```tsx
<MainLayout>
  <Dashboard />
</MainLayout>
```

---

### 2.2 Breadcrumb

**الموقع**: `src/components/layout/Breadcrumb/Breadcrumb.tsx`

**الوصف**: مكون مسار التنقل (Breadcrumb) لعرض موقع المستخدم الحالي.

**الأمثلة**:

```tsx
<Breadcrumb
  items={[
    { label: 'الرئيسية', path: '/dashboard' },
    { label: 'المنتجات', path: '/products' },
    { label: 'تفاصيل المنتج' },
  ]}
/>
```

---

### 2.3 Footer

**الموقع**: `src/components/layout/Footer/Footer.tsx`

**الوصف**: تذييل الصفحة مع معلومات الشركة والروابط.

---

## 3. مكونات واجهة المستخدم المتخصصة (UI Components)

### 3.1 Card

**الموقع**: `src/components/ui/Card/Card.tsx`

**الوصف**: مكون بطاقة مخصص مع دعم العنوان والعنوان الفرعي والإجراءات.

**الخصائص (Props)**:

```typescript
interface CardProps extends MuiCardProps {
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
  contentPadding?: number;
  hover?: boolean;
  compact?: boolean;
}
```

**الأمثلة**:

```tsx
<Card
  title="إحصائيات المبيعات"
  subtitle="آخر 30 يوم"
  action={<IconButton><MoreIcon /></IconButton>}
  hover
>
  <SalesChart data={salesData} />
</Card>
```

---

### 3.2 KPICard

**الموقع**: `src/components/ui/Dashboard/KPICard.tsx`

**الوصف**: بطاقة مؤشر أداء رئيسي (KPI) مع دعم الاتجاهات والأيقونات.

**الخصائص (Props)**:

```typescript
interface KPICardProps {
  title: string;
  value: number | string;
  icon?: React.ReactNode;
  color?: 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info';
  trend?: {
    value: number;
    label?: string;
    direction?: 'up' | 'down' | 'flat';
  };
  format?: 'currency' | 'number' | 'percentage';
  loading?: boolean;
  size?: 'small' | 'medium' | 'large';
}
```

**الأمثلة**:

```tsx
<KPICard
  title="إجمالي المبيعات"
  value={125000}
  icon={<AttachMoneyIcon />}
  color="primary"
  format="currency"
  trend={{
    value: 12.5,
    direction: 'up',
    label: 'من الشهر الماضي',
  }}
/>
```

---

### 3.3 CategoryManager

**الموقع**: `src/components/ui/CategoryManager/CategoryManager.tsx`

**الوصف**: مدير الفئات مع شجرة هرمية لإدارة فئات المنتجات.

**الخصائص (Props)**:

```typescript
interface CategoryManagerProps {
  open: boolean;
  onClose: () => void;
}
```

**الميزات**:
- عرض شجرة الفئات
- إضافة فئات جديدة
- تعديل الفئات
- حذف الفئات
- دعم الفئات الفرعية

---

### 3.4 LanguageSwitcher

**الموقع**: `src/components/ui/LanguageSwitcher/LanguageSwitcher.tsx`

**الوصف**: مكون تبديل اللغة بين العربية والإنجليزية.

---

## 4. مكونات صفحة الهبوط (Landing Components)

### 4.1 Hero

**الموقع**: `src/components/landing/Hero/Hero.tsx`

**الوصف**: قسم البطل (Hero Section) في صفحة الهبوط.

---

### 4.2 Features

**الموقع**: `src/components/landing/Features/Features.tsx`

**الوصف**: قسم الميزات الرئيسية.

---

### 4.3 Benefits

**الموقع**: `src/components/landing/Benefits/Benefits.tsx`

**الوصف**: قسم الفوائد والمميزات.

---

### 4.4 Pricing

**الموقع**: `src/components/landing/Pricing/Pricing.tsx`

**الوصف**: قسم خطط الأسعار.

---

### 4.5 Testimonials

**الموقع**: `src/components/landing/Testimonials/Testimonials.tsx`

**الوصف**: قسم شهادات العملاء.

---

### 4.6 FAQ

**الموقع**: `src/components/landing/FAQ/FAQ.tsx`

**الوصف**: قسم الأسئلة الشائعة.

---

### 4.7 CTA

**الموقع**: `src/components/landing/CTA/CTA.tsx`

**الوصف**: قسم دعوة للعمل (Call to Action).

---

## 5. مكونات المزامنة (Sync Components)

### 5.1 SyncStatusIndicator

**الموقع**: `src/components/sync/SyncStatusIndicator.tsx`

**الوصف**: مؤشر حالة المزامنة مع تفاصيل الاتصال والمزامنة.

**الخصائص (Props)**:

```typescript
interface SyncStatusIndicatorProps {
  compact?: boolean;
  showDetails?: boolean;
}
```

**الميزات**:
- عرض حالة المزامنة (متصل، غير متصل، جاري المزامنة)
- عرض حالة WebSocket
- عدد العمليات المعلقة
- آخر وقت مزامنة
- أزرار المزامنة اليدوية

**الأمثلة**:

```tsx
// مؤشر مضغوط
<SyncStatusIndicator compact />

// مؤشر كامل مع التفاصيل
<SyncStatusIndicator showDetails />
```

---

### 5.2 OfflineBanner

**الموقع**: `src/components/sync/OfflineBanner.tsx`

**الوصف**: لافتة تنبيه عند عدم الاتصال بالإنترنت.

---

### 5.3 ConflictResolutionDialog

**الموقع**: `src/components/sync/ConflictResolutionDialog.tsx`

**الوصف**: حوار حل تضارب البيانات عند المزامنة.

---

### 5.4 NotificationList

**الموقع**: `src/components/sync/NotificationList.tsx`

**الوصف**: قائمة الإشعارات المتعلقة بالمزامنة.

---

## 6. مكونات إدارة المخزون (Inventory Components)

### 6.1 InventoryTable

**الموقع**: `src/components/inventory/InventoryTable.tsx`

**الوصف**: جدول متخصص لعرض بيانات المخزون مع تنبيهات النقص.

**الخصائص (Props)**:

```typescript
interface InventoryTableProps {
  data: StockItem[];
  loading?: boolean;
  onEdit?: (stockItem: StockItem) => void;
  onDelete?: (stockItem: StockItem) => void;
  onAdjustStock?: (stockItem: StockItem) => void;
  onViewMovements?: (stockItem: StockItem) => void;
  onTransfer?: (stockItem: StockItem) => void;
  showActions?: boolean;
}
```

**الميزات**:
- عرض معلومات المنتج والمخزن
- عرض الكمية مع تنبيهات النقص
- عرض نقطة إعادة الطلب
- إجراءات: تعديل، حذف، تعديل المخزون، عرض الحركات، تحويل

---

### 6.2 StockItemForm

**الموقع**: `src/components/inventory/StockItemForm.tsx`

**الوصف**: نموذج إضافة/تعديل عنصر مخزون.

---

### 6.3 WarehouseTransferForm

**الموقع**: `src/components/inventory/WarehouseTransferForm.tsx`

**الوصف**: نموذج تحويل المخزون بين المخازن.

---

## 7. مكونات النماذج (Form Components)

### 7.1 Select

**الموقع**: `src/components/ui/Form/Select.tsx`

**الوصف**: مكون اختيار محسّن.

---

### 7.2 Checkbox

**الموقع**: `src/components/ui/Form/Checkbox.tsx`

**الوصف**: مكون مربع اختيار محسّن.

---

### 7.3 Radio

**الموقع**: `src/components/ui/Form/Radio.tsx`

**الوصف**: مكون زر اختيار محسّن.

---

### 7.4 TextArea

**الموقع**: `src/components/ui/Form/TextArea.tsx`

**الوصف**: مكون منطقة نص محسّنة.

---

## 8. دليل إعادة الاستخدام

### 8.1 مبادئ التصميم

1. **الاستقلالية**: كل مكون يجب أن يكون مستقلاً وقابلاً لإعادة الاستخدام
2. **المرونة**: دعم Props متعددة للاستخدامات المختلفة
3. **الاتساق**: استخدام نفس الأنماط والألوان في جميع المكونات
4. **إمكانية الوصول**: دعم ARIA labels وkeyboard navigation

### 8.2 أفضل الممارسات

1. **استخدام TypeScript**: جميع المكونات يجب أن تكون مكتوبة بـ TypeScript
2. **Documentation**: إضافة JSDoc comments للمكونات المعقدة
3. **Testing**: كتابة اختبارات للمكونات الأساسية
4. **Performance**: استخدام React.memo للمكونات الثقيلة
5. **Accessibility**: دعم screen readers وkeyboard navigation

### 8.3 إرشادات الاستخدام

1. **استيراد المكونات**: استخدم paths aliases (`@/components`)
2. **التنسيق**: اتبع نفس نمط التنسيق في جميع المكونات
3. **الأخطاء**: عالج الأخطاء بشكل مناسب في المكونات
4. **Loading States**: أضف حالات تحميل للمكونات غير المتزامنة

---

## 9. أمثلة متقدمة

### 9.1 نموذج كامل مع Table وModal

```tsx
const ProductsPage = () => {
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <Table
        columns={productColumns}
        data={products}
        actions={[
          {
            id: 'edit',
            label: 'تعديل',
            icon: <EditIcon />,
            onClick: (product) => {
              setSelectedProduct(product);
              setIsModalOpen(true);
            },
          },
        ]}
      />

      <Modal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="تعديل المنتج"
        maxWidth="md"
      >
        <ProductForm
          product={selectedProduct}
          onSubmit={handleSubmit}
        />
      </Modal>
    </>
  );
};
```

### 9.2 Dashboard مع KPICards

```tsx
const Dashboard = () => {
  return (
    <Grid container spacing={3}>
      <Grid item xs={12} sm={6} md={3}>
        <KPICard
          title="إجمالي المبيعات"
          value={salesTotal}
          icon={<AttachMoneyIcon />}
          format="currency"
          trend={{ value: 12.5, direction: 'up' }}
        />
      </Grid>
      {/* المزيد من KPICards */}
    </Grid>
  );
};
```

---

## 10. المراجع

- [Material-UI Documentation](https://mui.com/)
- [React TypeScript Cheatsheet](https://react-typescript-cheatsheet.netlify.app/)
- [Component Design Patterns](https://reactpatterns.com/)

---

**ملاحظة**: هذا الملف يتم تحديثه باستمرار مع إضافة مكونات جديدة. يُرجى مراجعة الكود المصدري للحصول على أحدث المعلومات.

