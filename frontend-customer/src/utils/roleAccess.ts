/**
 * صلاحيات المسارات حسب الدور
 * مطابق لصلاحيات السايد بار في MainLayout
 */

export const KNOWN_ROLES = ['admin', 'manager', 'cashier', 'warehouse_manager'] as const;

export type UserRole = (typeof KNOWN_ROLES)[number];

/**
 * المسارات التي تتطلب أدواراً محددة (أول تطابق يفوز)
 * الترتيب من الأكثر تحديداً إلى الأقل
 */
export const ROUTE_ROLE_MAP: Array<{ pathPrefix: string; allowedRoles: UserRole[] }> = [
  { pathPrefix: '/admin', allowedRoles: ['admin'] },
  { pathPrefix: '/users', allowedRoles: ['admin'] },
  { pathPrefix: '/accounting', allowedRoles: ['admin'] },
  { pathPrefix: '/suppliers', allowedRoles: ['admin', 'manager'] },
  { pathPrefix: '/branches', allowedRoles: ['admin', 'manager'] },
  { pathPrefix: '/reports', allowedRoles: ['admin', 'manager'] },
  { pathPrefix: '/warehouses', allowedRoles: ['admin', 'manager', 'warehouse_manager'] },
  { pathPrefix: '/pos', allowedRoles: ['admin', 'manager', 'cashier'] },
  { pathPrefix: '/sales', allowedRoles: ['admin', 'manager', 'cashier'] },
  { pathPrefix: '/customers', allowedRoles: ['admin', 'manager', 'cashier'] },
  { pathPrefix: '/purchasing', allowedRoles: ['admin', 'manager'] },
  { pathPrefix: '/returns', allowedRoles: ['admin', 'manager'] },
  { pathPrefix: '/products', allowedRoles: ['admin', 'manager', 'cashier', 'warehouse_manager'] },
  { pathPrefix: '/inventory', allowedRoles: ['admin', 'manager', 'cashier', 'warehouse_manager'] },
  // dashboard, settings - متاحة للجميع
];

export function canAccessPath(pathname: string, userRole: string | undefined): boolean {
  if (!userRole || !KNOWN_ROLES.includes(userRole as UserRole)) {
    return true; // أدوار غير معروفة - السماح (سيتم التعامل معها في السايد بار)
  }

  for (const { pathPrefix, allowedRoles } of ROUTE_ROLE_MAP) {
    if (pathname === pathPrefix || pathname.startsWith(pathPrefix + '/')) {
      return allowedRoles.includes(userRole as UserRole);
    }
  }

  return true; // مسارات غير معرفة - السماح
}
