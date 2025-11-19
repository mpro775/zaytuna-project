# بنية الفرونت إند (Frontend Architecture)

## نظرة عامة

يُبنى الفرونت إند لتطبيق زيتونة SaaS باستخدام **React 18+ مع TypeScript** ويتبع معمارية حديثة وقابلة للتوسع. التطبيق مصمم ليكون Progressive Web App (PWA) مع دعم كامل للعمل بدون إنترنت والمزامنة التلقائية.

**تاريخ آخر تحديث**: ديسمبر 2025  
**حالة الإكمال**: 80%

---

## 1. التقنيات الأساسية

### 1.1 إطار العمل والمكتبات الرئيسية

| التقنية | الإصدار | الاستخدام |
|---------|---------|-----------|
| React | 18+ | إطار العمل الأساسي |
| TypeScript | 5.9+ | اللغة البرمجية |
| Vite | 7.2+ | أداة البناء والتطوير |
| Material-UI (MUI) | 7.3+ | مكتبة مكونات UI |
| React Router | 7.9+ | نظام التوجيه |
| TanStack Query | 5.90+ | إدارة البيانات من الخادم |
| Zustand | 5.0+ | إدارة الحالة العامة |
| React Hook Form | 7.66+ | إدارة النماذج |
| Zod | 4.1+ | التحقق من صحة البيانات |
| i18next | 16.3+ | التدويل والترجمة |
| Recharts | 3.4+ | الرسوم البيانية |

### 1.2 المكتبات المساعدة

- **axios**: للاتصال بـ APIs
- **date-fns**: معالجة التواريخ
- **react-hot-toast**: الإشعارات
- **idb**: IndexedDB للبيانات المحلية
- **workbox**: Service Workers وPWA

---

## 2. هيكل المشروع

```
frontend-customer/
├── public/                 # الملفات الثابتة
│   ├── fonts/             # الخطوط
│   ├── icons/             # الأيقونات
│   └── manifest.json      # PWA manifest
├── src/
│   ├── components/        # المكونات
│   │   ├── common/       # مكونات عامة
│   │   ├── layout/       # مكونات التخطيط
│   │   ├── ui/           # مكونات UI متخصصة
│   │   ├── landing/      # مكونات صفحة الهبوط
│   │   ├── sync/         # مكونات المزامنة
│   │   └── inventory/    # مكونات المخزون
│   ├── pages/            # صفحات التطبيق
│   ├── hooks/            # React Hooks مخصصة
│   ├── services/         # خدمات API
│   ├── store/            # إدارة الحالة (Zustand)
│   ├── contexts/         # React Contexts
│   ├── utils/            # أدوات مساعدة
│   ├── types/            # أنواع TypeScript
│   ├── locales/          # ملفات الترجمة
│   ├── config/           # ملفات التكوين
│   ├── mocks/            # بيانات وخدمات وهمية للتطوير
│   ├── App.tsx           # المكون الرئيسي
│   ├── main.tsx          # نقطة الدخول
│   └── i18n.ts           # إعداد التدويل
├── dist/                 # ملفات البناء
├── node_modules/         # التبعيات
├── package.json
├── tsconfig.json         # إعدادات TypeScript
├── vite.config.ts        # إعدادات Vite
└── eslint.config.js      # إعدادات ESLint
```

---

## 3. إدارة الحالة (State Management)

### 3.1 TanStack Query (React Query)

**الاستخدام**: إدارة البيانات القادمة من الخادم (Server State)

**الميزات**:
- تخزين مؤقت تلقائي
- إعادة المحاولة عند الفشل
- تحديث تلقائي للبيانات
- إلغاء الطلبات تلقائياً

**مثال**:

```typescript
// hooks/useProducts.ts
import { useQuery, useMutation } from '@tanstack/react-query';
import { productsApi } from '@/services/products';

export const useProducts = (filters?: ProductFilters) => {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['products', filters],
    queryFn: () => productsApi.getProducts(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const createMutation = useMutation({
    mutationFn: productsApi.createProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });

  return {
    products: data?.data || [],
    isLoading,
    error,
    createProduct: createMutation.mutate,
  };
};
```

### 3.2 Zustand

**الاستخدام**: إدارة الحالة العامة للتطبيق (Client State)

**الميزات**:
- بسيط وخفيف
- لا يحتاج إلى Providers
- دعم TypeScript كامل
- Persistence مدمج

**مثال**:

```typescript
// store/auth/authStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      login: async (credentials) => {
        const response = await authApi.login(credentials);
        set({ user: response.user, isAuthenticated: true });
      },
      logout: async () => {
        await authApi.logout();
        set({ user: null, isAuthenticated: false });
      },
    }),
    {
      name: 'auth-storage',
    }
  )
);
```

### 3.3 React Context

**الاستخدام**: مشاركة الحالة بين مكونات قريبة

**Contexts المستخدمة**:
- `AuthContext`: حالة المصادقة
- `SyncContext`: حالة المزامنة

---

## 4. نظام التوجيه (Routing)

### 4.1 React Router v6

**الميزات**:
- Lazy Loading للمكونات
- Protected Routes
- Nested Routes
- Route Guards

**مثال**:

```typescript
// App.tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ProtectedRoute } from '@/components/routing';

const Dashboard = React.lazy(() => import('@/pages/Dashboard'));
const Products = React.lazy(() => import('@/pages/Products'));

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <MainLayout>
                <Dashboard />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/products"
          element={
            <ProtectedRoute>
              <MainLayout>
                <Products />
              </MainLayout>
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
```

### 4.2 Protected Routes

**الموقع**: `src/components/routing/ProtectedRoute.tsx`

**الوظيفة**: حماية المسارات التي تتطلب مصادقة

---

## 5. نظام المصادقة والأمان

### 5.1 JWT Authentication

**التدفق**:
1. المستخدم يسجل الدخول
2. الخادم يعيد `accessToken` و `refreshToken`
3. يتم حفظ Tokens في localStorage
4. يتم إضافة Token في header كل طلب API
5. عند انتهاء Token، يتم تحديثه تلقائياً

**مثال**:

```typescript
// services/api/axios.ts
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
});

// Request interceptor - إضافة Token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor - تحديث Token تلقائياً
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        try {
          const { data } = await axios.post('/auth/refresh', { refreshToken });
          localStorage.setItem('accessToken', data.accessToken);
          return api.request(error.config);
        } catch {
          // Refresh failed, logout
          localStorage.clear();
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);
```

### 5.2 Two-Factor Authentication (2FA)

**الدعم**: SMS, Email, Authenticator App

---

## 6. نظام المزامنة (Sync System)

### 6.1 SyncService

**الموقع**: `src/services/sync/syncService.ts`

**الميزات**:
- مزامنة البيانات مع الخادم
- حفظ البيانات محلياً في IndexedDB
- معالجة تضارب البيانات
- Queue للعمليات عند عدم الاتصال

### 6.2 WebSocketService

**الموقع**: `src/services/sync/webSocketService.ts`

**الميزات**:
- اتصال فوري مع الخادم
- تحديثات فورية للبيانات
- إعادة الاتصال التلقائي

### 6.3 SyncContext

**الموقع**: `src/contexts/SyncContext.tsx`

**الوظيفة**: توفير حالة المزامنة للمكونات

---

## 7. نظام التدويل (Internationalization)

### 7.1 i18next Configuration

**الموقع**: `src/i18n.ts`

**الميزات**:
- دعم العربية والإنجليزية
- RTL تلقائي للعربية
- كشف اللغة التلقائي
- حفظ اللغة في localStorage

**مثال**:

```typescript
// i18n.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      ar: { translation: arCommon },
      en: { translation: enCommon },
    },
    fallbackLng: 'ar',
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
  });

// تحديث اتجاه النص عند تغيير اللغة
i18n.on('languageChanged', (lng) => {
  document.documentElement.dir = lng === 'ar' ? 'rtl' : 'ltr';
  document.documentElement.lang = lng;
});
```

### 7.2 استخدام الترجمة

```typescript
import { useTranslation } from 'react-i18next';

const MyComponent = () => {
  const { t } = useTranslation();
  return <h1>{t('common.welcome', 'مرحباً')}</h1>;
};
```

---

## 8. إدارة الأخطاء والاستثناءات

### 8.1 Error Boundaries

**الاستخدام**: التقاط أخطاء React في المكونات

### 8.2 API Error Handling

**الميزات**:
- معالجة موحدة للأخطاء
- رسائل خطأ واضحة للمستخدم
- إعادة المحاولة التلقائية
- Logging للأخطاء

**مثال**:

```typescript
// services/api/axios.ts
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // Server responded with error
      const message = error.response.data?.message || 'حدث خطأ';
      toast.error(message);
    } else if (error.request) {
      // Request made but no response
      toast.error('لا يوجد اتصال بالخادم');
    } else {
      // Error in request setup
      toast.error('حدث خطأ في إعداد الطلب');
    }
    return Promise.reject(error);
  }
);
```

---

## 9. الأداء والتحسينات

### 9.1 Code Splitting

**الاستخدام**: تحميل المكونات عند الحاجة فقط

```typescript
const Dashboard = React.lazy(() => import('@/pages/Dashboard'));

<Suspense fallback={<Loading />}>
  <Dashboard />
</Suspense>
```

### 9.2 Memoization

**الاستخدام**: تجنب إعادة الرسم غير الضرورية

```typescript
const ExpensiveComponent = React.memo(({ data }) => {
  // Component logic
});

const filteredData = useMemo(() => {
  return data.filter(item => item.active);
}, [data]);
```

### 9.3 Virtual Scrolling

**الاستخدام**: للقوائم الكبيرة (سيتم إضافته لاحقاً)

### 9.4 Image Optimization

**الاستخدام**: ضغط وتحسين الصور

---

## 10. PWA والـ Service Workers

### 10.1 Manifest

**الموقع**: `public/manifest.json`

**الميزات**:
- تثبيت كتطبيق
- أيقونات التطبيق
- اسم التطبيق

### 10.2 Service Worker

**الموقع**: `public/sw.js`

**الميزات**:
- Cache للبيانات
- Offline Support
- Background Sync
- Push Notifications

---

## 11. التطوير والبناء

### 11.1 Vite Configuration

**الموقع**: `vite.config.ts`

**الميزات**:
- Hot Module Replacement (HMR)
- Fast Build
- Path Aliases
- Proxy للـ API

```typescript
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3001,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
});
```

### 11.2 TypeScript Configuration

**الموقع**: `tsconfig.json`

**الميزات**:
- Strict Mode
- Path Mapping
- Type Checking

### 11.3 ESLint Configuration

**الموقع**: `eslint.config.js`

**الميزات**:
- TypeScript Rules
- React Rules
- Prettier Integration

---

## 12. الاختبار

### 12.1 Unit Tests

**الأدوات**: Jest, React Testing Library

### 12.2 E2E Tests

**الأدوات**: Playwright (سيتم إضافته)

---

## 13. الأمان

### 13.1 Input Validation

- Zod schemas لجميع النماذج
- Sanitization للمدخلات
- XSS Protection

### 13.2 Secure Storage

- Tokens في localStorage (سيتم تحسينه لاحقاً)
- لا يتم حفظ معلومات حساسة

### 13.3 HTTPS

- مطلوب في الإنتاج
- Secure Cookies

---

## 14. المراقبة والتحليلات

### 14.1 Error Tracking

**الأدوات**: (سيتم إضافته)

### 14.2 Performance Monitoring

**الأدوات**: (سيتم إضافته)

---

## 15. أفضل الممارسات

### 15.1 Code Organization

- فصل المسؤوليات
- مكونات صغيرة وقابلة لإعادة الاستخدام
- Custom Hooks للمنطق المعقد

### 15.2 TypeScript

- استخدام Types بدلاً من any
- Interfaces للـ Props
- Type Safety في جميع الأماكن

### 15.3 Performance

- Lazy Loading
- Memoization عند الحاجة
- تجنب Re-renders غير الضرورية

### 15.4 Accessibility

- ARIA Labels
- Keyboard Navigation
- Screen Reader Support

---

## 16. المراجع

- [React Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Material-UI Documentation](https://mui.com/)
- [TanStack Query Documentation](https://tanstack.com/query/latest)
- [Zustand Documentation](https://zustand-demo.pmnd.rs/)

---

**ملاحظة**: هذا الملف يتم تحديثه باستمرار مع تطور التطبيق. يُرجى مراجعة الكود المصدري للحصول على أحدث المعلومات.

