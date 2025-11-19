// Users and Roles Service Types - مرتبط بـ backend/src/modules/user و backend/src/modules/auth


export interface Role {
  id: string;
  name: string;
  description?: string;
  permissions: string[];
  isSystemRole: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: {
    users: number;
  };
}

export interface User {
  id: string;
  username: string;
  email: string;
  phone?: string;
  isActive: boolean;
  lastLoginAt?: string;
  twoFactorEnabled: boolean;
  biometricEnabled: boolean;
  roleId: string;
  branchId?: string;
  createdAt: string;
  updatedAt: string;

  // Relations
  role?: {
    id: string;
    name: string;
    description?: string;
    permissions: string[];
  };
  branch?: {
    id: string;
    name: string;
  };
}

export interface Permission {
  id: string;
  name: string;
  description?: string;
  category: string;
  isActive: boolean;
}

export interface CreateUserDto {
  username: string;
  email: string;
  password: string;
  phone?: string;
  roleId: string;
  branchId?: string;
  isActive?: boolean;
}

export interface UpdateUserDto {
  username?: string;
  email?: string;
  phone?: string;
  roleId?: string;
  branchId?: string;
  isActive?: boolean;
}

export interface ChangeUserPasswordDto {
  newPassword: string;
}

export interface CreateRoleDto {
  name: string;
  description?: string;
  permissions?: string[];
  isSystemRole?: boolean;
}

export interface UpdateRoleDto {
  name?: string;
  description?: string;
  permissions?: string[];
  isSystemRole?: boolean;
}

export interface AssignRoleDto {
  userId: string;
  roleId: string;
}

export interface UsersFilters {
  branchId?: string;
  roleId?: string;
  isActive?: boolean;
  search?: string;
}

export interface UserStats {
  total: number;
  active: number;
  inactive: number;
  byRole: Array<{
    roleId: string;
    roleName: string;
    count: number;
  }>;
  byBranch: Array<{
    branchId: string;
    branchName: string;
    count: number;
  }>;
}

export interface RoleStats {
  totalRoles: number;
  activeRoles: number;
  systemRoles: number;
  rolesByPermissionCount: Array<{
    permissionCount: number;
    count: number;
  }>;
}

export interface UsersApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

