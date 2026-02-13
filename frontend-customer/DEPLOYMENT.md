# دليل نشر تطبيق زيتون على دومين

## نظرة عامة

هذا الدليل يوضح المتطلبات والإعدادات اللازمة لنشر تطبيق الفرونت إند على دومين (وهمي أو حقيقي).

---

## 1. متغيرات البيئة المطلوبة

### عند البناء (Build Time)

يجب تعيين هذه المتغيرات **قبل** تنفيذ `npm run build`:

| المتغير | الوصف | مثال (Mock) | مثال (Production) |
|---------|-------|-------------|-------------------|
| `VITE_API_BASE_URL` | عنوان API الباك إند | غير مستخدم | `https://api.zaytuna.com/api/v1` |
| `VITE_USE_MOCK_DATA` | تفعيل البيانات الوهمية | `true` | `false` |
| `VITE_API_TIMEOUT` | مهلة الطلبات (ms) | `10000` | `10000` |
| `VITE_APP_ENV` | بيئة التطبيق | `staging` | `production` |
| `VITE_APP_VERSION` | إصدار التطبيق | `1.0.0` | `1.0.0` |

### سيناريوهات الاستخدام

**أ) نشر مع Mock فقط (دومين تجريبي بدون باك إند):**
```env
VITE_USE_MOCK_DATA=true
VITE_API_BASE_URL=https://your-domain.com/api/v1
VITE_APP_ENV=staging
```

**ب) نشر مع باك إند حقيقي:**
```env
VITE_USE_MOCK_DATA=false
VITE_API_BASE_URL=https://api.your-domain.com/api/v1
VITE_APP_ENV=production
```

---

## 2. إعدادات البناء (Vite)

### Base Path (إذا كان التطبيق في مجلد فرعي)

إذا كان الرابط مثل `https://your-domain.com/zaytuna/`:

```ts
// vite.config.ts
export default defineConfig({
  base: '/zaytuna/',
  // ...
});
```

### إزالة Source Maps في الإنتاج (أمان)

```ts
build: {
  outDir: 'dist',
  sourcemap: false,  // أو true للتشخيص فقط
}
```

---

## 3. إعدادات الخادم

### أ) Nginx (مثل Hostinger VPS أو Docker)

```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /usr/share/nginx/html;
    index index.html;

    # SPA routing - مهم جداً
    location / {
        try_files $uri $uri/ /index.html;
    }

    # PWA Service Worker - لا تخزن في الكاش
    location /sw.js {
        add_header Cache-Control "no-cache, no-store, must-revalidate";
    }

    location /manifest.json {
        add_header Cache-Control "no-cache, no-store, must-revalidate";
    }

    # الملفات الثابتة - كاش طويل
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # إذا الباك إند على نفس الدومين
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### ب) Apache (.htaccess) - Hostinger Shared Hosting

أنشئ ملف `.htaccess` في مجلد `dist` بعد البناء:

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>

# PWA - منع تخزين Service Worker
<Files "sw.js">
  Header set Cache-Control "no-cache, no-store, must-revalidate"
</Files>

<Files "manifest.json">
  Header set Cache-Control "no-cache, no-store, must-revalidate"
</Files>
```

---

## 4. الصلاحيات المطلوبة

### صلاحيات الملفات (Linux/Unix)

```bash
# الملفات: قراءة للمالك، قراءة للمجموعة والعالم
find dist -type f -exec chmod 644 {} \;

# المجلدات: تنفيذ للدخول
find dist -type d -exec chmod 755 {} \;

# مالك الملفات (مثال: مستخدم nginx أو www-data)
chown -R www-data:www-data dist/
```

### صلاحيات Hostinger (cPanel)

- **قراءة**: جميع ملفات `dist` يجب أن تكون قابلة للقراءة من قبل خادم الويب
- **تنفيذ**: المجلدات تحتاج صلاحية 755
- **رفع**: استخدم File Manager أو FTP مع صلاحيات الكتابة على مجلد `public_html` أو المجلد المخصص

---

## 5. HTTPS و PWA

- **PWA يتطلب HTTPS** في بيئة الإنتاج (ما عدا localhost)
- احصل على شهادة SSL مجانية (Let's Encrypt) من لوحة Hostinger
- تأكد أن `manifest.json` و `sw.js` يستخدمان مسارات نسبية أو نفس الدومين

---

## 6. CORS (إذا الباك إند على دومين مختلف)

يجب تفعيل CORS في الباك إند للسماح للدومين الجديد:

```ts
// في NestJS (backend)
app.enableCors({
  origin: ['https://your-domain.com', 'https://www.your-domain.com'],
  credentials: true,
});
```

---

## 7. خطوات النشر السريعة

### مع Mock (دومين تجريبي)

```bash
# 1. إنشاء ملف .env.production
echo "VITE_USE_MOCK_DATA=true" > .env.production
echo "VITE_API_BASE_URL=https://your-domain.com/api/v1" >> .env.production

# 2. البناء
npm run build

# 3. رفع محتويات مجلد dist إلى الخادم
# عبر FTP أو rsync أو Git
```

### مع Docker

```bash
docker build \
  --build-arg VITE_USE_MOCK_DATA=true \
  --build-arg VITE_API_BASE_URL=https://your-domain.com/api/v1 \
  -t zaytuna-frontend .
docker run -p 80:80 zaytuna-frontend
```

---

## 8. التحقق بعد النشر

- [ ] الصفحة الرئيسية `/` تعمل
- [ ] تسجيل الدخول يعمل
- [ ] التنقل بين الصفحات (مثل `/dashboard`, `/products`) يعمل بدون 404
- [ ] PWA: يمكن تثبيت التطبيق من المتصفح (إن كان HTTPS)
- [ ] في وضع Mock: البيانات الوهمية تظهر بشكل صحيح

---

## 9. استكشاف الأخطاء

| المشكلة | الحل |
|---------|------|
| 404 عند تحديث الصفحة | تأكد من `try_files` في Nginx أو قواعد Rewrite في .htaccess |
| صفحة بيضاء | تحقق من Console، قد يكون خطأ في مسار الـ base أو الـ API |
| CORS error | أضف الدومين في إعدادات CORS في الباك إند |
| PWA لا يعمل | تأكد من HTTPS ووجود `manifest.json` و `sw.js` |
| Mock لا يعمل | تأكد أن `VITE_USE_MOCK_DATA=true` عند البناء |
