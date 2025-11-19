# دليل التصميم والتجربة (UI/UX Guide)

## نظرة عامة

هذا الدليل يحدد معايير التصميم والتجربة المستخدمة في تطبيق زيتونة SaaS. يهدف إلى ضمان تجربة مستخدم متسقة وحديثة عبر جميع صفحات التطبيق.

**تاريخ آخر تحديث**: ديسمبر 2025  
**حالة الإكمال**: 75%

---

## 1. مبادئ التصميم العامة

### 1.1 البساطة
- واجهات نظيفة وواضحة
- تقليل العناصر غير الضرورية
- التركيز على المحتوى الأساسي

### 1.2 الكفاءة
- تقليل عدد النقرات لإتمام المهام
- اختصارات لوحة المفاتيح
- إجراءات سريعة

### 1.3 الاتساق
- نفس الأنماط في جميع الشاشات
- نفس الألوان والأيقونات
- نفس سلوك المكونات

### 1.4 الاستجابة
- ردود فعل فورية للإجراءات
- حالات تحميل واضحة
- رسائل خطأ مفيدة

### 1.5 إمكانية الوصول
- دعم screen readers
- التنقل بالكيبورد
- نسب تباين مناسبة

---

## 2. نظام الألوان (Color Palette)

### 2.1 الألوان الأساسية

```typescript
// Primary Color - زيتونة (أخضر)
primary: {
  main: '#2e7d32',      // الأخضر الرئيسي
  light: '#60ad5e',      // أخضر فاتح
  dark: '#005005',       // أخضر داكن
  contrastText: '#ffffff' // نص على الخلفية
}

// Secondary Color - برتقالي
secondary: {
  main: '#f57c00',
  light: '#ffad42',
  dark: '#bb4d00',
  contrastText: '#000000'
}

// Success - نجاح
success: {
  main: '#4caf50',
  light: '#81c784',
  dark: '#388e3c',
  contrastText: '#ffffff'
}

// Error - خطأ
error: {
  main: '#f44336',
  light: '#ef5350',
  dark: '#c62828',
  contrastText: '#ffffff'
}

// Warning - تحذير
warning: {
  main: '#ff9800',
  light: '#ffb74d',
  dark: '#f57c00',
  contrastText: '#000000'
}

// Info - معلومات
info: {
  main: '#2196f3',
  light: '#64b5f6',
  dark: '#1976d2',
  contrastText: '#ffffff'
}
```

### 2.2 الألوان المحايدة

```typescript
grey: {
  50: '#fafafa',
  100: '#f5f5f5',
  200: '#eeeeee',
  300: '#e0e0e0',
  400: '#bdbdbd',
  500: '#9e9e9e',
  600: '#757575',
  700: '#616161',
  800: '#424242',
  900: '#212121'
}

background: {
  default: '#f5f5f5',  // خلفية الصفحة
  paper: '#ffffff'     // خلفية البطاقات
}

text: {
  primary: '#212121',   // النص الرئيسي
  secondary: '#757575'  // النص الثانوي
}
```

### 2.3 استخدام الألوان

#### الألوان الأساسية
- **Primary**: للأزرار الرئيسية، الروابط، العناصر المهمة
- **Secondary**: للأزرار الثانوية، العناصر التكميلية

#### ألوان الحالة
- **Success**: للنجاح، التأكيد، الحفظ
- **Error**: للأخطاء، الحذف، التحذيرات الخطيرة
- **Warning**: للتحذيرات، التنبيهات
- **Info**: للمعلومات، التعليمات

---

## 3. Typography (الخطوط)

### 3.1 الخط الأساسي

**Cairo** - خط عربي حديث وواضح

```css
font-family: "Cairo", "CairoLocal", "CairoFallback", 
             "Segoe UI", "Tahoma", "Arial Unicode MS", 
             "Arial", sans-serif;
```

### 3.2 أحجام الخطوط

```typescript
h1: {
  fontSize: '2.5rem',    // 40px
  fontWeight: 700,
  lineHeight: 1.2
}

h2: {
  fontSize: '2rem',      // 32px
  fontWeight: 600,
  lineHeight: 1.3
}

h3: {
  fontSize: '1.75rem',   // 28px
  fontWeight: 600,
  lineHeight: 1.3
}

h4: {
  fontSize: '1.5rem',    // 24px
  fontWeight: 600,
  lineHeight: 1.4
}

h5: {
  fontSize: '1.25rem',   // 20px
  fontWeight: 600,
  lineHeight: 1.4
}

h6: {
  fontSize: '1.125rem',  // 18px
  fontWeight: 600,
  lineHeight: 1.5
}

body1: {
  fontSize: '1rem',      // 16px
  lineHeight: 1.6
}

body2: {
  fontSize: '0.875rem',  // 14px
  lineHeight: 1.5
}

caption: {
  fontSize: '0.75rem',   // 12px
  lineHeight: 1.4
}
```

### 3.3 أوزان الخطوط

- **700 (Bold)**: العناوين الرئيسية
- **600 (Semi-Bold)**: العناوين الفرعية، الأزرار
- **500 (Medium)**: النصوص المهمة
- **400 (Regular)**: النصوص العادية

---

## 4. Spacing & Layout

### 4.1 نظام المسافات

نستخدم نظام 8px للمسافات:

```typescript
spacing: {
  0: '0px',
  1: '8px',
  2: '16px',
  3: '24px',
  4: '32px',
  5: '40px',
  6: '48px',
  8: '64px',
  10: '80px'
}
```

### 4.2 Breakpoints

```typescript
xs: 0px      // الهواتف الصغيرة
sm: 600px    // الهواتف الكبيرة
md: 900px    // الأجهزة اللوحية
lg: 1200px   // الشاشات الصغيرة
xl: 1536px   // الشاشات الكبيرة
```

### 4.3 Grid System

نستخدم Material-UI Grid System:

```tsx
<Grid container spacing={3}>
  <Grid item xs={12} sm={6} md={4}>
    {/* Content */}
  </Grid>
</Grid>
```

---

## 5. Icons & Imagery

### 5.1 مكتبة الأيقونات

**Material Icons** - من Material-UI

```tsx
import { 
  Dashboard as DashboardIcon,
  ShoppingCart as ShoppingCartIcon,
  Inventory as InventoryIcon
} from '@mui/icons-material';
```

### 5.2 أحجام الأيقونات

- **Small**: 20px
- **Medium**: 24px (افتراضي)
- **Large**: 32px
- **Extra Large**: 48px

### 5.3 الصور

- **Format**: JPG, PNG, WebP
- **Optimization**: ضغط الصور قبل الرفع
- **Lazy Loading**: تحميل الصور عند الحاجة
- **Alt Text**: نص بديل لجميع الصور

---

## 6. Components Patterns

### 6.1 الأزرار (Buttons)

```tsx
// زر رئيسي
<Button variant="primary" size="medium">
  حفظ
</Button>

// زر ثانوي
<Button variant="secondary" size="medium">
  إلغاء
</Button>

// زر مع أيقونة
<Button variant="primary" startIcon={<SaveIcon />}>
  حفظ
</Button>

// زر مع حالة تحميل
<Button variant="primary" loading={isSubmitting}>
  حفظ
</Button>
```

### 6.2 حقول الإدخال (Inputs)

```tsx
// حقل نصي عادي
<Input
  label="اسم المستخدم"
  value={username}
  onChange={(e) => setUsername(e.target.value)}
  required
/>

// حقل مع رسالة خطأ
<Input
  label="البريد الإلكتروني"
  type="email"
  error={!!errors.email}
  helperText={errors.email?.message}
/>

// حقل مع أيقونة
<Input
  label="البحث"
  startIcon={<SearchIcon />}
/>
```

### 6.3 البطاقات (Cards)

```tsx
<Card
  title="عنوان البطاقة"
  subtitle="وصف فرعي"
  action={<IconButton><MoreIcon /></IconButton>}
  hover
>
  {/* محتوى البطاقة */}
</Card>
```

### 6.4 الجداول (Tables)

```tsx
<Table
  columns={columns}
  data={data}
  pagination={{
    page: currentPage,
    rowsPerPage: pageSize,
    total: totalItems,
    onPageChange: setCurrentPage,
    onRowsPerPageChange: setPageSize,
  }}
  sorting={{
    orderBy: sortBy,
    order: sortOrder,
    onSort: handleSort,
  }}
/>
```

---

## 7. Responsive Design

### 7.1 Mobile First

نبدأ بتصميم للهواتف أولاً ثم نوسع للشاشات الأكبر.

### 7.2 Breakpoints Usage

```tsx
import { useMediaQuery, useTheme } from '@mui/material';

const theme = useTheme();
const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));
const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
```

### 7.3 Responsive Patterns

- **Navigation**: Sidebar على Desktop، Drawer على Mobile
- **Tables**: Scroll أفقي على Mobile
- **Forms**: أعمدة متعددة على Desktop، عمود واحد على Mobile
- **Cards**: Grid متجاوب

---

## 8. RTL Support

### 8.1 التوجيه التلقائي

```typescript
// i18n.ts
i18n.on('languageChanged', (lng) => {
  const direction = lng === 'ar' ? 'rtl' : 'ltr';
  document.documentElement.dir = direction;
  document.documentElement.lang = lng;
});
```

### 8.2 Material-UI RTL

```typescript
// App.tsx
const theme = createTheme({
  direction: 'rtl', // أو 'ltr'
});
```

### 8.3 CSS RTL

```css
/* استخدام margin-start و margin-end بدلاً من left و right */
.element {
  margin-inline-start: 16px;
  margin-inline-end: 8px;
}
```

---

## 9. Accessibility (A11y)

### 9.1 ARIA Labels

```tsx
<Button
  aria-label="حفظ التغييرات"
  onClick={handleSave}
>
  <SaveIcon />
</Button>
```

### 9.2 Keyboard Navigation

- **Tab**: التنقل بين العناصر
- **Enter/Space**: تفعيل الأزرار
- **Escape**: إغلاق النوافذ المنبثقة
- **Arrow Keys**: التنقل في القوائم

### 9.3 Focus Management

```tsx
const inputRef = useRef<HTMLInputElement>(null);

useEffect(() => {
  inputRef.current?.focus();
}, []);
```

### 9.4 Screen Readers

- استخدام semantic HTML
- ARIA roles و attributes
- Alt text للصور
- Labels للحقول

---

## 10. Animation & Transitions

### 10.1 Transitions

```typescript
// Material-UI transitions
transition: theme.transitions.create(['transform', 'opacity'], {
  duration: theme.transitions.duration.short,
  easing: theme.transitions.easing.easeInOut,
});
```

### 10.2 Animations

```css
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

### 10.3 Best Practices

- تجنب Animations المفرطة
- استخدام Transitions سريعة (200-300ms)
- احترام prefers-reduced-motion

---

## 11. Form Design Guidelines

### 11.1 Layout

- حقول عمودية على Mobile
- حقول أفقية (2-3 أعمدة) على Desktop
- Labels واضحة ومباشرة
- Placeholders للمساعدة

### 11.2 Validation

```tsx
<Input
  label="البريد الإلكتروني"
  type="email"
  error={!!errors.email}
  helperText={errors.email?.message}
  required
/>
```

### 11.3 Error Messages

- رسائل خطأ واضحة ومحددة
- عرض الأخطاء فوراً أو عند Submit
- استخدام ألوان Error (أحمر)

### 11.4 Success States

- رسائل نجاح عند الحفظ
- تأكيد بصري للعمليات الناجحة

---

## 12. Error States & Loading States

### 12.1 Loading States

```tsx
// Spinner
<Loading type="spinner" message="جاري التحميل..." />

// Linear Progress
<Loading type="linear" />

// Skeleton
<Loading type="skeleton" />
```

### 12.2 Error States

```tsx
// رسالة خطأ بسيطة
<Alert severity="error">
  حدث خطأ في تحميل البيانات
</Alert>

// رسالة خطأ مع إعادة المحاولة
<Box>
  <Alert severity="error" sx={{ mb: 2 }}>
    فشل في الاتصال بالخادم
  </Alert>
  <Button onClick={handleRetry}>
    إعادة المحاولة
  </Button>
</Box>
```

### 12.3 Empty States

```tsx
<Box sx={{ textAlign: 'center', py: 8 }}>
  <EmptyIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
  <Typography variant="h6" color="text.secondary">
    لا توجد بيانات
  </Typography>
  <Button variant="primary" onClick={handleAdd} sx={{ mt: 2 }}>
    إضافة جديد
  </Button>
</Box>
```

---

## 13. Navigation Patterns

### 13.1 Main Navigation

- Sidebar على Desktop
- Drawer على Mobile
- Breadcrumb للتنقل الهرمي
- Active state واضح

### 13.2 Secondary Navigation

- Tabs للتبديل بين الأقسام
- Stepper للخطوات المتعددة
- Pagination للقوائم الطويلة

### 13.3 User Actions

- Dropdown menu للمستخدم
- Context menu للإجراءات
- Tooltips للمساعدة

---

## 14. User Flows الرئيسية

### 14.1 تدفق تسجيل الدخول

1. صفحة Login
2. إدخال البيانات
3. التحقق (2FA إن وجد)
4. التوجيه للـ Dashboard

### 14.2 تدفق إضافة منتج

1. صفحة Products
2. زر "إضافة منتج"
3. نموذج إضافة المنتج
4. حفظ
5. رسالة نجاح
6. العودة للقائمة

### 14.3 تدفق إنشاء فاتورة

1. صفحة Sales
2. زر "فاتورة جديدة"
3. اختيار العميل
4. إضافة المنتجات
5. حساب الإجمالي
6. اختيار طريقة الدفع
7. حفظ وطباعة

---

## 15. Best Practices

### 15.1 Performance

- Lazy Loading للمكونات
- Memoization للحسابات المكلفة
- Virtual Scrolling للقوائم الكبيرة
- Image Optimization

### 15.2 User Experience

- Feedback فوري للإجراءات
- رسائل واضحة
- منع الإجراءات المزدوجة
- حفظ التقدم تلقائياً

### 15.3 Code Quality

- مكونات قابلة لإعادة الاستخدام
- TypeScript للـ type safety
- Documentation للكود المعقد
- Testing للمكونات الأساسية

---

## 16. Checklist للتصميم

### قبل البدء
- [ ] فهم متطلبات المستخدم
- [ ] مراجعة التصميمات
- [ ] التحقق من Responsive Design
- [ ] التحقق من RTL Support

### أثناء التطوير
- [ ] استخدام المكونات الموحدة
- [ ] تطبيق نظام الألوان
- [ ] تطبيق Typography
- [ ] إضافة Loading States
- [ ] إضافة Error Handling
- [ ] اختبار Keyboard Navigation
- [ ] اختبار Screen Readers

### قبل النشر
- [ ] اختبار على أجهزة مختلفة
- [ ] اختبار الأداء
- [ ] التحقق من Accessibility
- [ ] مراجعة UX مع المستخدمين

---

## 17. المراجع

- [Material Design Guidelines](https://material.io/design)
- [WCAG Accessibility Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [React Accessibility](https://react.dev/learn/accessibility)
- [Web.dev Best Practices](https://web.dev/)

---

**ملاحظة**: هذا الدليل يتم تحديثه باستمرار مع تطور التطبيق. يُرجى مراجعة أحدث الإصدارات قبل البدء بالتصميم.

