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

export function hasPermission(userPermissions: string[] | undefined, requiredPermission: string): boolean {
  if (!userPermissions?.length) return false;

  return userPermissions.some((permission) => {
    if (permission === requiredPermission || permission === '*') return true;
    if (!permission.endsWith('.*')) return false;

    const namespace = permission.slice(0, -2);
    return requiredPermission === namespace || requiredPermission.startsWith(`${namespace}.`);
  });
}

export function hasAnyPermission(userPermissions: string[] | undefined, requiredPermissions: string[]): boolean {
  return requiredPermissions.some((permission) => hasPermission(userPermissions, permission));
}

const ROUTE_PERMISSION_MAP: Array<{ pathPrefix: string; permissions: string[] }> = [
  { pathPrefix: '/admin', permissions: ['admin', 'system.read'] },
  { pathPrefix: '/users', permissions: ['users.read'] },
  { pathPrefix: '/accounting', permissions: ['accounting.read'] },
  { pathPrefix: '/suppliers', permissions: ['purchasing.read', 'purchasing.create'] },
  { pathPrefix: '/branches', permissions: ['branches.read'] },
  { pathPrefix: '/reports', permissions: ['reporting.read', 'reports.read'] },
  { pathPrefix: '/warehouses', permissions: ['warehouses.read', 'inventory.read'] },
  { pathPrefix: '/pos', permissions: ['pos.create', 'sales.create'] },
  { pathPrefix: '/sales', permissions: ['sales.read', 'sales.create'] },
  { pathPrefix: '/customers', permissions: ['customers.read'] },
  { pathPrefix: '/purchasing', permissions: ['purchasing.read', 'purchasing.create'] },
  { pathPrefix: '/returns', permissions: ['returns.read', 'returns.create'] },
  { pathPrefix: '/products', permissions: ['products.read'] },
  { pathPrefix: '/inventory', permissions: ['inventory.read'] },
  { pathPrefix: '/settings', permissions: ['settings.read', 'settings.update'] },
];

export function canAccessPathByPermissions(pathname: string, userPermissions: string[] | undefined): boolean {
  if (!userPermissions?.length) return true;

  for (const { pathPrefix, permissions } of ROUTE_PERMISSION_MAP) {
    if (pathname === pathPrefix || pathname.startsWith(pathPrefix + '/')) {
      return hasAnyPermission(userPermissions, permissions);
    }
  }

  return true;
}
