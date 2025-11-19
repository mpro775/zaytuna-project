# خدمة المستخدمين والأدوار والصلاحيات - Users, Roles & Permissions Service

خدمة شاملة لإدارة المستخدمين والأدوار والصلاحيات مرتبطة بـ Backend APIs في `backend/src/modules/user/` و `backend/src/modules/auth/`.

## الملفات

- `types.ts` - أنواع TypeScript للبيانات والـ DTOs
- `users.ts` - خدمة المستخدمين مع جميع دوال API
- `roles.ts` - خدمة الأدوار
- `permissions.ts` - خدمة الصلاحيات
- `hooks.ts` - React Query hooks للتكامل مع المكونات
- `README.md` - هذا الملف

## APIs المدعومة

### المستخدمين (Users)
- `POST /users` - إنشاء مستخدم جديد
- `GET /users` - قائمة المستخدمين مع الفلترة
- `GET /users/:id` - تفاصيل مستخدم
- `PATCH /users/:id` - تحديث مستخدم
- `DELETE /users/:id` - حذف مستخدم
- `PATCH /users/:id/password` - تغيير كلمة مرور
- `PUT /users/:id/toggle-status` - تبديل حالة المستخدم
- `GET /users/stats/overview` - إحصائيات المستخدمين

### الأدوار (Roles)
- `POST /roles` - إنشاء دور جديد
- `GET /roles` - قائمة الأدوار
- `GET /roles/:id` - تفاصيل دور
- `GET /roles/:id/users` - المستخدمون بالدور
- `PATCH /roles/:id` - تحديث دور
- `DELETE /roles/:id` - حذف دور
- `POST /roles/assign` - تعيين دور لمستخدم
- `GET /roles/stats` - إحصائيات الأدوار

### الصلاحيات (Permissions)
- `GET /permissions` - جميع الصلاحيات
- `GET /permissions/categories` - فئات الصلاحيات
- `GET /permissions/category/:category` - صلاحيات بالفئة
- `GET /permissions/validate/:permission` - التحقق من الصلاحية

## استخدام الخدمة

### استخدام مباشر للخدمات

```typescript
import { UsersService, RolesService, PermissionsService } from '@/services/users';

// إنشاء مستخدم
const newUser = await UsersService.createUser({
  username: 'john_doe',
  email: 'john@example.com',
  password: 'securePass123',
  roleId: 'role-uuid',
  branchId: 'branch-uuid',
});

// الحصول على المستخدمين
const users = await UsersService.getUsers({
  isActive: true,
  search: 'john'
});

// إنشاء دور
const newRole = await RolesService.createRole({
  name: 'Manager',
  description: 'Store Manager',
  permissions: ['users.read', 'sales.create']
});

// الحصول على الصلاحيات
const permissions = await PermissionsService.getAllPermissions();
```

### استخدام React Query Hooks

```typescript
import {
  useUsers,
  useCreateUser,
  useRoles,
  usePermissions
} from '@/services/users';

function UsersManagementComponent() {
  // الحصول على المستخدمين
  const { data: users, isLoading } = useUsers({ isActive: true });

  // إنشاء مستخدم جديد
  const createUser = useCreateUser();

  const handleCreateUser = async (userData) => {
    try {
      await createUser.mutateAsync(userData);
      // تم إنشاء المستخدم بنجاح
    } catch (error) {
      // معالجة الخطأ
    }
  };

  // الحصول على الأدوار والصلاحيات
  const { data: roles } = useRoles();
  const { data: permissions } = usePermissions();

  // ... باقي الكود
}
```

## أنواع البيانات

### User
```typescript
interface User {
  id: string;
  username: string;
  email: string;
  phone?: string;
  isActive: boolean;
  roleId: string;
  branchId?: string;
  role?: {
    id: string;
    name: string;
    permissions: string[];
  };
  branch?: {
    id: string;
    name: string;
  };
}
```

### Role
```typescript
interface Role {
  id: string;
  name: string;
  description?: string;
  permissions: string[];
  isSystemRole: boolean;
  isActive: boolean;
}
```

### CreateUserDto
```typescript
interface CreateUserDto {
  username: string;
  email: string;
  password: string;
  phone?: string;
  roleId: string;
  branchId?: string;
  isActive?: boolean;
}
```

## معالجة الأخطاء

جميع دوال الخدمة ترجع `UsersApiResponse<T>` والتي تحتوي على:
- `data`: البيانات المطلوبة
- `success`: حالة النجاح
- `message`: رسالة إضافية (اختيارية)

## التكامل مع الباك إند

- مرتبطة مباشرة بـ `backend/src/modules/user/` و `backend/src/modules/auth/`
- تستخدم نفس DTOs الموجودة في `backend/src/modules/user/dto/`
- متوافقة مع schema البيانات في Prisma (`User`, `Role`)
- تدعم نظام الصلاحيات والمصادقة

## أمثلة الاستخدام

انظر إلى `frontend-customer/src/pages/Users/UsersList.tsx` لمثال كامل على استخدام الخدمة في مكون React.

## ملاحظات مهمة

- **الصلاحيات**: تأكد من أن المستخدم الحالي لديه الصلاحيات المطلوبة للوصول إلى endpoints
- **كلمات المرور**: يتم تشفير كلمات المرور في الباك إند باستخدام bcrypt
- **الأدوار النظامية**: لا يمكن حذف الأدوار النظامية (`isSystemRole: true`)
- **التحقق من البيانات**: جميع DTOs في الباك إند تحتوي على validation decorators
