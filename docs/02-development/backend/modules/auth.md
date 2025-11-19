# 🔐 وحدة المصادقة والصلاحيات (Auth Module)

## نظرة عامة

وحدة المصادقة والصلاحيات هي الوحدة الأساسية المسؤولة عن إدارة المصادقة، الأذونات، والأدوار في النظام. توفر هذه الوحدة نظام مصادقة قوي باستخدام JWT مع دعم Refresh Tokens، وإدارة شاملة للأدوار والصلاحيات.

### الميزات الرئيسية

- **المصادقة**: تسجيل الدخول والخروج باستخدام JWT
- **إدارة الأدوار**: إنشاء وتعديل وحذف الأدوار
- **إدارة الصلاحيات**: نظام صلاحيات مرن وقابل للتوسع
- **تشفير كلمات المرور**: استخدام bcrypt مع 12 rounds
- **إدارة الجلسات**: تخزين الجلسات في Redis Cache
- **تحديث الرموز**: نظام Refresh Token لتحديث Access Tokens

### الاعتماديات

- `PrismaService`: للوصول إلى قاعدة البيانات
- `CacheService`: لإدارة الجلسات والكاش
- `JwtService`: لإنشاء والتحقق من الرموز المميزة
- `PermissionService`: لإدارة الصلاحيات

---

## API Endpoints

### المصادقة (Authentication)

#### POST `/auth/login`
تسجيل دخول المستخدم

**الصلاحيات المطلوبة**: لا شيء (Public)

**Request Body**:
```json
{
  "username": "admin",
  "password": "password123"
}
```

**Response** (200 OK):
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "clx1234567890",
    "username": "admin",
    "email": "admin@example.com",
    "role": "admin",
    "branch": "الفرع الرئيسي"
  },
  "expiresIn": 900
}
```

**الأخطاء المحتملة**:
- `401 Unauthorized`: بيانات الدخول غير صحيحة
- `401 Unauthorized`: الحساب غير نشط

---

#### POST `/auth/register`
تسجيل مستخدم جديد

**الصلاحيات المطلوبة**: لا شيء (Public)

**Request Body**:
```json
{
  "username": "newuser",
  "email": "user@example.com",
  "password": "password123",
  "phone": "+967712345678",
  "roleId": "clx1234567890",
  "branchId": "clx0987654321"
}
```

**Response** (201 Created):
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "clx9876543210",
    "username": "newuser",
    "email": "user@example.com",
    "role": "cashier",
    "branch": "الفرع الرئيسي"
  },
  "expiresIn": 900
}
```

**الأخطاء المحتملة**:
- `409 Conflict`: اسم المستخدم موجود بالفعل
- `409 Conflict`: البريد الإلكتروني موجود بالفعل
- `400 Bad Request`: الدور المحدد غير موجود
- `400 Bad Request`: الفرع المحدد غير موجود

---

#### POST `/auth/refresh`
تحديث الرمز المميز

**الصلاحيات المطلوبة**: لا شيء (Public)

**Request Body**:
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response** (200 OK):
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 900
}
```

**الأخطاء المحتملة**:
- `401 Unauthorized`: الرمز المميز غير صحيح
- `401 Unauthorized`: المستخدم غير موجود أو غير نشط

---

#### POST `/auth/logout`
تسجيل خروج المستخدم

**الصلاحيات المطلوبة**: `JwtAuthGuard` (مستخدم مصادق عليه)

**Response** (200 OK):
```json
{
  "message": "تم تسجيل الخروج بنجاح"
}
```

---

#### GET `/auth/me`
الحصول على معلومات المستخدم الحالي

**الصلاحيات المطلوبة**: `JwtAuthGuard` (مستخدم مصادق عليه)

**Response** (200 OK):
```json
{
  "id": "clx1234567890",
  "username": "admin",
  "email": "admin@example.com",
  "roleId": "clx1111111111",
  "branchId": "clx2222222222",
  "iat": 1234567890,
  "exp": 1234568790,
  "type": "access"
}
```

---

#### PATCH `/auth/password`
تغيير كلمة المرور

**الصلاحيات المطلوبة**: `JwtAuthGuard` (مستخدم مصادق عليه)

**Request Body**:
```json
{
  "currentPassword": "oldpassword123",
  "newPassword": "newpassword456"
}
```

**Response** (200 OK):
```json
{
  "message": "تم تغيير كلمة المرور بنجاح"
}
```

**الأخطاء المحتملة**:
- `400 Bad Request`: كلمة المرور الحالية غير صحيحة
- `400 Bad Request`: المستخدم غير موجود

---

#### PATCH `/auth/users/:userId/password`
إعادة تعيين كلمة المرور (للمشرفين)

**الصلاحيات المطلوبة**: `admin`

**Request Body**:
```json
{
  "newPassword": "newpassword456"
}
```

**Response** (200 OK):
```json
{
  "message": "تم إعادة تعيين كلمة المرور بنجاح"
}
```

---

#### GET `/auth/verify`
التحقق من صحة الرمز المميز

**الصلاحيات المطلوبة**: `JwtAuthGuard` (مستخدم مصادق عليه)

**Response** (200 OK):
```json
{
  "valid": true,
  "user": {
    "id": "clx1234567890",
    "username": "admin",
    "email": "admin@example.com",
    "roleId": "clx1111111111",
    "branchId": "clx2222222222"
  }
}
```

---

### إدارة الأدوار (Roles Management)

#### POST `/roles`
إنشاء دور جديد

**الصلاحيات المطلوبة**: `roles.create`

**Request Body**:
```json
{
  "name": "manager",
  "description": "مدير الفرع",
  "permissions": ["sales.read", "sales.create", "inventory.read"],
  "isSystemRole": false
}
```

**Response** (201 Created):
```json
{
  "id": "clx3333333333",
  "name": "manager",
  "description": "مدير الفرع",
  "permissions": ["sales.read", "sales.create", "inventory.read"],
  "userCount": 0,
  "isSystemRole": false,
  "createdAt": "2025-12-01T10:00:00.000Z",
  "updatedAt": "2025-12-01T10:00:00.000Z"
}
```

---

#### GET `/roles`
الحصول على جميع الأدوار

**الصلاحيات المطلوبة**: `roles.read`

**Response** (200 OK):
```json
[
  {
    "id": "clx1111111111",
    "name": "admin",
    "description": "مدير النظام",
    "permissions": ["*"],
    "userCount": 5,
    "isSystemRole": true,
    "createdAt": "2025-01-01T00:00:00.000Z",
    "updatedAt": "2025-01-01T00:00:00.000Z"
  }
]
```

---

#### GET `/roles/stats`
الحصول على إحصائيات الأدوار

**الصلاحيات المطلوبة**: `roles.read`

**Response** (200 OK):
```json
{
  "totalRoles": 10,
  "systemRoles": 3,
  "customRoles": 7,
  "totalUsers": 50,
  "rolesDistribution": {
    "admin": 5,
    "manager": 15,
    "cashier": 30
  }
}
```

---

#### GET `/roles/:id`
الحصول على دور بالمعرف

**الصلاحيات المطلوبة**: `roles.read`

**Response** (200 OK):
```json
{
  "id": "clx1111111111",
  "name": "admin",
  "description": "مدير النظام",
  "permissions": ["*"],
  "userCount": 5,
  "isSystemRole": true,
  "createdAt": "2025-01-01T00:00:00.000Z",
  "updatedAt": "2025-01-01T00:00:00.000Z"
}
```

---

#### GET `/roles/:id/users`
الحصول على المستخدمين بالدور

**الصلاحيات المطلوبة**: `users.read`

**Response** (200 OK):
```json
[
  {
    "id": "clx1234567890",
    "username": "admin",
    "email": "admin@example.com",
    "isActive": true
  }
]
```

---

#### PATCH `/roles/:id`
تحديث دور

**الصلاحيات المطلوبة**: `roles.update`

**Request Body**:
```json
{
  "description": "وصف محدث",
  "permissions": ["sales.read", "sales.create", "sales.update"]
}
```

**Response** (200 OK):
```json
{
  "id": "clx1111111111",
  "name": "admin",
  "description": "وصف محدث",
  "permissions": ["sales.read", "sales.create", "sales.update"],
  "userCount": 5,
  "isSystemRole": true,
  "updatedAt": "2025-12-01T11:00:00.000Z"
}
```

---

#### POST `/roles/assign`
تعيين دور لمستخدم

**الصلاحيات المطلوبة**: `roles.assign`

**Request Body**:
```json
{
  "userId": "clx1234567890",
  "roleId": "clx1111111111"
}
```

**Response** (200 OK):
```json
{
  "message": "تم تعيين الدور بنجاح",
  "user": {
    "id": "clx1234567890",
    "username": "admin",
    "role": {
      "id": "clx1111111111",
      "name": "admin"
    }
  }
}
```

---

#### DELETE `/roles/:id`
حذف دور

**الصلاحيات المطلوبة**: `roles.delete`

**Response** (200 OK):
```json
{
  "message": "تم حذف الدور بنجاح"
}
```

**الأخطاء المحتملة**:
- `400 Bad Request`: لا يمكن حذف دور نظامي
- `400 Bad Request`: الدور مستخدم من قبل مستخدمين

---

### إدارة الصلاحيات (Permissions Management)

#### GET `/permissions`
الحصول على جميع الصلاحيات

**الصلاحيات المطلوبة**: `roles.read`

**Response** (200 OK):
```json
{
  "permissions": [
    {
      "name": "sales.create",
      "description": "إنشاء فاتورة مبيعات",
      "category": "sales",
      "children": []
    },
    {
      "name": "sales.read",
      "description": "قراءة فواتير المبيعات",
      "category": "sales",
      "children": []
    }
  ]
}
```

---

#### GET `/permissions/categories`
الحصول على فئات الصلاحيات

**الصلاحيات المطلوبة**: `roles.read`

**Response** (200 OK):
```json
{
  "categories": [
    "sales",
    "inventory",
    "purchasing",
    "accounting",
    "users",
    "branches"
  ]
}
```

---

#### GET `/permissions/category/:category`
الحصول على الصلاحيات بالفئة المحددة

**الصلاحيات المطلوبة**: `roles.read`

**Response** (200 OK):
```json
[
  {
    "name": "sales.create",
    "description": "إنشاء فاتورة مبيعات",
    "category": "sales"
  },
  {
    "name": "sales.read",
    "description": "قراءة فواتير المبيعات",
    "category": "sales"
  }
]
```

---

#### GET `/permissions/validate/:permission`
التحقق من صحة الصلاحية

**الصلاحيات المطلوبة**: `roles.read`

**Response** (200 OK):
```json
{
  "permission": "sales.create",
  "isValid": true,
  "details": {
    "name": "sales.create",
    "description": "إنشاء فاتورة مبيعات",
    "category": "sales"
  }
}
```

---

## DTOs (Data Transfer Objects)

### LoginDto
```typescript
{
  username: string;      // اسم المستخدم أو البريد الإلكتروني
  password: string;      // كلمة المرور (حد أدنى 6 أحرف)
}
```

**قواعد التحقق**:
- `username`: مطلوب، نص
- `password`: مطلوب، نص، حد أدنى 6 أحرف

---

### RegisterDto
```typescript
{
  username: string;      // اسم المستخدم (فريد)
  email: string;         // البريد الإلكتروني (فريد، صيغة صحيحة)
  password: string;      // كلمة المرور (حد أدنى 6 أحرف)
  phone?: string;        // رقم الهاتف (اختياري)
  roleId: string;        // معرف الدور (مطلوب، UUID)
  branchId?: string;     // معرف الفرع (اختياري، UUID)
}
```

**قواعد التحقق**:
- `username`: مطلوب، نص، فريد
- `email`: مطلوب، بريد إلكتروني صحيح، فريد
- `password`: مطلوب، نص، حد أدنى 6 أحرف
- `phone`: اختياري، نص
- `roleId`: مطلوب، UUID صحيح
- `branchId`: اختياري، UUID صحيح

---

### ChangePasswordDto
```typescript
{
  currentPassword?: string;  // كلمة المرور الحالية (اختياري)
  newPassword: string;        // كلمة المرور الجديدة (مطلوب)
}
```

**قواعد التحقق**:
- `currentPassword`: اختياري، نص
- `newPassword`: مطلوب، نص، حد أدنى 6 أحرف

---

### RefreshTokenDto
```typescript
{
  refreshToken: string;  // Refresh Token
}
```

**قواعد التحقق**:
- `refreshToken`: مطلوب، نص

---

### CreateRoleDto
```typescript
{
  name: string;              // اسم الدور (مطلوب، حد أقصى 50 حرف)
  description?: string;      // وصف الدور (اختياري، حد أقصى 200 حرف)
  permissions?: string[];     // قائمة الصلاحيات (اختياري)
  isSystemRole?: boolean;   // هل هو دور نظامي (افتراضي: false)
}
```

**قواعد التحقق**:
- `name`: مطلوب، نص، حد أقصى 50 حرف، فريد
- `description`: اختياري، نص، حد أقصى 200 حرف
- `permissions`: اختياري، مصفوفة من النصوص
- `isSystemRole`: اختياري، قيمة منطقية

---

### UpdateRoleDto
```typescript
{
  description?: string;      // وصف الدور
  permissions?: string[];     // قائمة الصلاحيات
  isActive?: boolean;        // حالة الدور
}
```

---

### AssignRoleDto
```typescript
{
  userId: string;   // معرف المستخدم (UUID)
  roleId: string;   // معرف الدور (UUID)
}
```

---

## الخدمات (Services)

### AuthService

#### `login(loginDto: LoginDto): Promise<LoginResponseDto>`
تسجيل دخول المستخدم وإنشاء رموز JWT

**المعاملات**:
- `loginDto`: بيانات تسجيل الدخول

**القيمة المرجعة**: `LoginResponseDto` مع access token و refresh token

---

#### `register(registerDto: RegisterDto): Promise<LoginResponseDto>`
تسجيل مستخدم جديد وإنشاء رموز JWT

**المعاملات**:
- `registerDto`: بيانات التسجيل

**القيمة المرجعة**: `LoginResponseDto` مع access token و refresh token

---

#### `refreshToken(refreshTokenDto: RefreshTokenDto): Promise<TokenPair>`
تحديث الرمز المميز

**المعاملات**:
- `refreshTokenDto`: Refresh token

**القيمة المرجعة**: زوج جديد من الرموز المميزة

---

#### `logout(userId: string): Promise<void>`
تسجيل خروج المستخدم وإنهاء الجلسة

**المعاملات**:
- `userId`: معرف المستخدم

---

#### `changePassword(userId: string, changePasswordDto: ChangePasswordDto): Promise<void>`
تغيير كلمة مرور المستخدم

**المعاملات**:
- `userId`: معرف المستخدم
- `changePasswordDto`: بيانات تغيير كلمة المرور

---

#### `resetPassword(userId: string, newPassword: string): Promise<void>`
إعادة تعيين كلمة المرور (للمشرفين)

**المعاملات**:
- `userId`: معرف المستخدم
- `newPassword`: كلمة المرور الجديدة

---

### RoleService

#### `create(createRoleDto: CreateRoleDto): Promise<RoleWithPermissions>`
إنشاء دور جديد

**المعاملات**:
- `createRoleDto`: بيانات إنشاء الدور

**القيمة المرجعة**: الدور مع الصلاحيات

---

#### `findAll(): Promise<RoleWithPermissions[]>`
الحصول على جميع الأدوار

**القيمة المرجعة**: مصفوفة من الأدوار

---

#### `findOne(id: string): Promise<RoleWithPermissions>`
الحصول على دور بالمعرف

**المعاملات**:
- `id`: معرف الدور

**القيمة المرجعة**: الدور

---

#### `update(id: string, updateRoleDto: UpdateRoleDto): Promise<RoleWithPermissions>`
تحديث دور

**المعاملات**:
- `id`: معرف الدور
- `updateRoleDto`: بيانات التحديث

**القيمة المرجعة**: الدور المحدث

---

#### `remove(id: string): Promise<void>`
حذف دور

**المعاملات**:
- `id`: معرف الدور

---

#### `assignRoleToUser(assignRoleDto: AssignRoleDto): Promise<any>`
تعيين دور لمستخدم

**المعاملات**:
- `assignRoleDto`: بيانات التعيين

---

### PermissionService

#### `getAllPermissions(): PermissionDefinition[]`
الحصول على جميع الصلاحيات

**القيمة المرجعة**: مصفوفة من تعريفات الصلاحيات

---

#### `getCategories(): string[]`
الحصول على فئات الصلاحيات

**القيمة المرجعة**: مصفوفة من أسماء الفئات

---

#### `getPermissionsByCategory(category: string): PermissionDefinition[]`
الحصول على الصلاحيات بالفئة

**المعاملات**:
- `category`: اسم الفئة

**القيمة المرجعة**: مصفوفة من الصلاحيات

---

#### `isValidPermission(permission: string): boolean`
التحقق من صحة الصلاحية

**المعاملات**:
- `permission`: اسم الصلاحية

**القيمة المرجعة**: `true` إذا كانت الصلاحية صحيحة

---

## العلاقات (Relationships)

### الوحدات المرتبطة

- **User Module**: تستخدم وحدة Auth لإدارة المستخدمين والمصادقة
- **Audit Module**: تسجل جميع عمليات المصادقة في سجلات التدقيق
- **Branch Module**: ترتبط المستخدمين بالفروع

### التبعيات

- `PrismaService`: للوصول إلى جداول `users`, `roles`
- `CacheService`: لتخزين الجلسات والكاش
- `JwtService`: لإنشاء والتحقق من الرموز المميزة

---

## أمثلة الاستخدام

### مثال 1: تسجيل الدخول

```typescript
// Request
POST /auth/login
{
  "username": "admin",
  "password": "password123"
}

// Response
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "clx1234567890",
    "username": "admin",
    "email": "admin@example.com",
    "role": "admin",
    "branch": "الفرع الرئيسي"
  },
  "expiresIn": 900
}
```

### مثال 2: إنشاء دور جديد

```typescript
// Request
POST /roles
Authorization: Bearer <access_token>
{
  "name": "cashier",
  "description": "كاشير",
  "permissions": [
    "sales.create",
    "sales.read",
    "sales.update",
    "payment.create"
  ],
  "isSystemRole": false
}

// Response
{
  "id": "clx3333333333",
  "name": "cashier",
  "description": "كاشير",
  "permissions": [
    "sales.create",
    "sales.read",
    "sales.update",
    "payment.create"
  ],
  "userCount": 0,
  "isSystemRole": false,
  "createdAt": "2025-12-01T10:00:00.000Z",
  "updatedAt": "2025-12-01T10:00:00.000Z"
}
```

### مثال 3: تحديث الرمز المميز

```typescript
// Request
POST /auth/refresh
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}

// Response
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 900
}
```

---

## الأخطاء الشائعة

### 401 Unauthorized - بيانات الدخول غير صحيحة
**السبب**: اسم المستخدم أو كلمة المرور غير صحيحة

**الحل**: 
- التحقق من صحة اسم المستخدم وكلمة المرور
- التأكد من أن الحساب نشط

---

### 401 Unauthorized - الحساب غير نشط
**السبب**: المستخدم تم إلغاء تفعيله

**الحل**: 
- الاتصال بالمدير لتفعيل الحساب

---

### 409 Conflict - اسم المستخدم موجود بالفعل
**السبب**: محاولة إنشاء مستخدم باسم مستخدم موجود

**الحل**: 
- استخدام اسم مستخدم آخر
- أو تحديث المستخدم الموجود

---

### 400 Bad Request - الدور المحدد غير موجود
**السبب**: معرف الدور المرسل غير موجود في قاعدة البيانات

**الحل**: 
- التحقق من صحة معرف الدور
- إنشاء الدور أولاً إذا لم يكن موجوداً

---

### 400 Bad Request - لا يمكن حذف دور نظامي
**السبب**: محاولة حذف دور تم تعريفه كدور نظامي

**الحل**: 
- لا يمكن حذف الأدوار النظامية
- يمكن فقط تحديثها أو إلغاء تفعيلها

---

**📅 تاريخ آخر تحديث**: ديسمبر 2025
**👨‍💻 المطور**: فريق تطوير BThwani
**📊 إصدار الوحدة**: v1.0.0

