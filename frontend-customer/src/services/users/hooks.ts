import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { UsersService } from './users';
import type { UsersFilters } from './types';
import { RolesService } from './roles';
import { PermissionsService } from './permissions';

// Query Keys
export const USERS_QUERY_KEYS = {
  all: ['users'] as const,
  users: () => [...USERS_QUERY_KEYS.all, 'list'] as const,
  user: (id: string) => [...USERS_QUERY_KEYS.all, id] as const,
  stats: () => [...USERS_QUERY_KEYS.all, 'stats'] as const,
};

export const ROLES_QUERY_KEYS = {
  all: ['roles'] as const,
  roles: () => [...ROLES_QUERY_KEYS.all, 'list'] as const,
  role: (id: string) => [...ROLES_QUERY_KEYS.all, id] as const,
  roleUsers: (id: string) => [...ROLES_QUERY_KEYS.all, id, 'users'] as const,
  stats: () => [...ROLES_QUERY_KEYS.all, 'stats'] as const,
};

export const PERMISSIONS_QUERY_KEYS = {
  all: ['permissions'] as const,
  permissions: () => [...PERMISSIONS_QUERY_KEYS.all, 'list'] as const,
  categories: () => [...PERMISSIONS_QUERY_KEYS.all, 'categories'] as const,
  categoryPermissions: (category: string) =>
    [...PERMISSIONS_QUERY_KEYS.all, 'category', category] as const,
};

/**
 * Users Hooks
 */
export const useUsers = (filters: UsersFilters = {}) => {
  return useQuery({
    queryKey: [...USERS_QUERY_KEYS.users(), filters],
    queryFn: () => UsersService.getUsers(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useUser = (id: string) => {
  return useQuery({
    queryKey: USERS_QUERY_KEYS.user(id),
    queryFn: () => UsersService.getUserById(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
};

export const useUserStats = () => {
  return useQuery({
    queryKey: USERS_QUERY_KEYS.stats(),
    queryFn: () => UsersService.getUserStats(),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

export const useCreateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: UsersService.createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEYS.users() });
      queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEYS.stats() });
    },
  });
};

export const useUpdateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => UsersService.updateUser(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEYS.user(id) });
      queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEYS.users() });
    },
  });
};

export const useDeleteUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: UsersService.deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEYS.users() });
      queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEYS.stats() });
    },
  });
};

export const useToggleUserStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: UsersService.toggleUserStatus,
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEYS.user(id) });
      queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEYS.users() });
      queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEYS.stats() });
    },
  });
};

export const useChangeUserPassword = () => {
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      UsersService.changeUserPassword(id, data),
  });
};

/**
 * Roles Hooks
 */
export const useRoles = () => {
  return useQuery({
    queryKey: ROLES_QUERY_KEYS.roles(),
    queryFn: () => RolesService.getRoles(),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

export const useRole = (id: string) => {
  return useQuery({
    queryKey: ROLES_QUERY_KEYS.role(id),
    queryFn: () => RolesService.getRoleById(id),
    enabled: !!id,
    staleTime: 10 * 60 * 1000,
  });
};

export const useRoleUsers = (id: string) => {
  return useQuery({
    queryKey: ROLES_QUERY_KEYS.roleUsers(id),
    queryFn: () => RolesService.getUsersByRole(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
};

export const useRoleStats = () => {
  return useQuery({
    queryKey: ROLES_QUERY_KEYS.stats(),
    queryFn: () => RolesService.getRoleStats(),
    staleTime: 10 * 60 * 1000,
  });
};

export const useCreateRole = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: RolesService.createRole,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ROLES_QUERY_KEYS.roles() });
      queryClient.invalidateQueries({ queryKey: ROLES_QUERY_KEYS.stats() });
    },
  });
};

export const useUpdateRole = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => RolesService.updateRole(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ROLES_QUERY_KEYS.role(id) });
      queryClient.invalidateQueries({ queryKey: ROLES_QUERY_KEYS.roles() });
    },
  });
};

export const useDeleteRole = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: RolesService.deleteRole,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ROLES_QUERY_KEYS.roles() });
      queryClient.invalidateQueries({ queryKey: ROLES_QUERY_KEYS.stats() });
    },
  });
};

export const useAssignRole = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: RolesService.assignRoleToUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEYS.users() });
      queryClient.invalidateQueries({ queryKey: ROLES_QUERY_KEYS.roles() });
    },
  });
};

/**
 * Permissions Hooks
 */
export const usePermissions = () => {
  return useQuery({
    queryKey: PERMISSIONS_QUERY_KEYS.permissions(),
    queryFn: () => PermissionsService.getAllPermissions(),
    staleTime: 30 * 60 * 1000, // 30 minutes - permissions rarely change
  });
};

export const usePermissionCategories = () => {
  return useQuery({
    queryKey: PERMISSIONS_QUERY_KEYS.categories(),
    queryFn: () => PermissionsService.getCategories(),
    staleTime: 30 * 60 * 1000,
  });
};

export const usePermissionsByCategory = (category: string) => {
  return useQuery({
    queryKey: PERMISSIONS_QUERY_KEYS.categoryPermissions(category),
    queryFn: () => PermissionsService.getPermissionsByCategory(category),
    enabled: !!category,
    staleTime: 30 * 60 * 1000,
  });
};
