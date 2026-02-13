/**
 * Mock Users Service
 * Handles users mock API calls
 */

import usersData from '../data/users.json';
import { mockApi } from './mock-api';
import { paginateData, generateId, getMockDataFromStorage, saveMockDataToStorage, simulateDelay } from './mock-utils';
import type { MockRequest, MockResponse } from '../types';

// Map role name to roleId for API compatibility
const ROLE_MAP: Record<string, string> = {
  admin: 'role-admin',
  manager: 'role-manager',
  cashier: 'role-cashier',
  warehouse_manager: 'role-warehouse',
};

const ROLE_REVERSE: Record<string, string> = {
  'role-admin': 'admin',
  'role-manager': 'manager',
  'role-cashier': 'cashier',
  'role-warehouse': 'warehouse_manager',
};

type RawUser = {
  id: string;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: string;
  branchId?: string;
  branch?: { id: string; name: string };
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

// Transform users.json to User API format
const transformUser = (u: RawUser) => ({
  id: u.id,
  username: u.username,
  email: u.email,
  phone: null as string | null,
  isActive: u.isActive ?? true,
  lastLoginAt: u.updatedAt || null,
  twoFactorEnabled: false,
  biometricEnabled: false,
  roleId: ROLE_MAP[u.role] || `role-${u.role}`,
  branchId: u.branchId || null,
  createdAt: u.createdAt || new Date().toISOString(),
  updatedAt: u.updatedAt || new Date().toISOString(),
  role: {
    id: ROLE_MAP[u.role] || `role-${u.role}`,
    name: u.role || 'user',
    permissions: [] as string[],
  },
  branch: u.branch || null,
});

// Load raw users from storage (for mutations)
const getRawUsers = (): RawUser[] => {
  const stored = getMockDataFromStorage('users', usersData);
  return Array.isArray(stored) ? (stored as RawUser[]) : (usersData as RawUser[]);
};

// Save raw users to storage
const saveRawUsers = (raw: RawUser[]) => {
  saveMockDataToStorage('users', raw);
};

// Load and transform users for API responses
const getUsers = () => getRawUsers().map(transformUser);

// Register handlers
mockApi.registerHandler('GET:/users', async (request: MockRequest): Promise<MockResponse> => {
  await simulateDelay(100, 200);

  let users = getUsers();

  // Apply filters
  const params = request.params || {};
  if (params.isActive !== undefined && params.isActive !== '') {
    const isActive = params.isActive === 'true' || params.isActive === true;
    users = users.filter((u) => u.isActive === isActive);
  }
  if (params.branchId) {
    users = users.filter((u) => u.branchId === params.branchId || u.branch?.id === params.branchId);
  }
  if (params.roleId) {
    users = users.filter((u) => u.roleId === params.roleId || u.role?.name === params.roleId);
  }
  if (params.search) {
    const search = String(params.search).toLowerCase();
    users = users.filter(
      (u) =>
        u.username?.toLowerCase().includes(search) ||
        u.email?.toLowerCase().includes(search) ||
        (u as { firstName?: string }).firstName?.toLowerCase().includes(search) ||
        (u as { lastName?: string }).lastName?.toLowerCase().includes(search)
    );
  }

  const page = Number(params.page) || 1;
  const limit = Number(params.limit) || 50;
  const result = paginateData(users, page, limit);

  return {
    data: result.data,
    statusCode: 200,
  };
});

mockApi.registerHandler('GET:/users/stats/overview', async (): Promise<MockResponse> => {
  await simulateDelay(100, 200);

  const users = getUsers();
  const total = users.length;
  const active = users.filter((u) => u.isActive).length;
  const inactive = total - active;

  // Group by role
  const roleCounts: Record<string, { name: string; count: number }> = {};
  users.forEach((u) => {
    const roleName = (typeof u.role === 'object' && u.role?.name) || 'user';
    if (!roleCounts[roleName]) {
      roleCounts[roleName] = { name: roleName, count: 0 };
    }
    roleCounts[roleName].count++;
  });

  const byRole = Object.entries(roleCounts).map(([roleId, { name, count }]) => ({
    roleId,
    roleName: name,
    count,
  }));

  // Group by branch
  const branchCounts: Record<string, { name: string; count: number }> = {};
  users.forEach((u) => {
    const branchId = u.branchId || u.branch?.id || 'none';
    const branchName = u.branch?.name || 'بدون فرع';
    if (!branchCounts[branchId]) {
      branchCounts[branchId] = { name: branchName, count: 0 };
    }
    branchCounts[branchId].count++;
  });

  const byBranch = Object.entries(branchCounts).map(([branchId, { name, count }]) => ({
    branchId,
    branchName: name,
    count,
  }));

  return {
    data: {
      total,
      active,
      inactive,
      byRole,
      byBranch,
    },
    statusCode: 200,
  };
});

mockApi.registerHandler('GET:/users/:id', async (request: MockRequest): Promise<MockResponse> => {
  await simulateDelay(100, 200);

  const id = request.params?.id;
  const users = getUsers();
  const user = users.find((u) => u.id === id);

  if (!user) {
    throw {
      response: {
        status: 404,
        data: {
          message: 'المستخدم غير موجود',
          statusCode: 404,
        },
      },
    };
  }

  return {
    data: user,
    statusCode: 200,
  };
});

mockApi.registerHandler('POST:/users', async (request: MockRequest): Promise<MockResponse> => {
  await simulateDelay(150, 300);

  const data = request.data as {
    username: string;
    email: string;
    roleId: string;
    branchId?: string;
    phone?: string;
    isActive?: boolean;
    firstName?: string;
    lastName?: string;
  };
  const roleName = ROLE_REVERSE[data.roleId] || data.roleId?.replace('role-', '') || 'cashier';
  const now = new Date().toISOString();
  const raw: RawUser = {
    id: generateId(),
    username: data.username,
    email: data.email,
    role: roleName,
    isActive: data.isActive ?? true,
    createdAt: now,
    updatedAt: now,
    ...(data.branchId && { branchId: data.branchId }),
    ...(data.firstName && { firstName: data.firstName }),
    ...(data.lastName && { lastName: data.lastName }),
  };
  const rawUsers = getRawUsers();
  rawUsers.push(raw);
  saveRawUsers(rawUsers);

  return {
    data: transformUser(raw),
    statusCode: 201,
  };
});

mockApi.registerHandler('PATCH:/users/:id', async (request: MockRequest): Promise<MockResponse> => {
  await simulateDelay(100, 200);

  const id = request.params?.id;
  const rawUsers = getRawUsers();
  const index = rawUsers.findIndex((u) => u.id === id);

  if (index === -1) {
    throw {
      response: {
        status: 404,
        data: {
          message: 'المستخدم غير موجود',
          statusCode: 404,
        },
      },
    };
  }

  const patch = request.data as Record<string, unknown>;
  const user = rawUsers[index]!;
  if (patch.roleId) {
    user.role = ROLE_REVERSE[patch.roleId as string] || (patch.roleId as string);
  }
  if (patch.username !== undefined) user.username = patch.username as string;
  if (patch.email !== undefined) user.email = patch.email as string;
  if (patch.branchId !== undefined) {
    if (typeof patch.branchId === 'string') user.branchId = patch.branchId;
    else delete user.branchId;
  }
  if (patch.isActive !== undefined) user.isActive = patch.isActive as boolean;
  user.updatedAt = new Date().toISOString();
  saveRawUsers(rawUsers);

  return {
    data: transformUser(user),
    statusCode: 200,
  };
});

mockApi.registerHandler('DELETE:/users/:id', async (request: MockRequest): Promise<MockResponse> => {
  await simulateDelay(100, 200);

  const id = request.params?.id;
  const rawUsers = getRawUsers();
  const index = rawUsers.findIndex((u) => u.id === id);

  if (index === -1) {
    throw {
      response: {
        status: 404,
        data: {
          message: 'المستخدم غير موجود',
          statusCode: 404,
        },
      },
    };
  }

  rawUsers.splice(index, 1);
  saveRawUsers(rawUsers);

  return {
    data: { message: 'تم حذف المستخدم بنجاح' },
    statusCode: 200,
  };
});

mockApi.registerHandler('PATCH:/users/:id/password', async (): Promise<MockResponse> => {
  await simulateDelay(150, 300);

  return {
    data: { data: { message: 'تم تغيير كلمة المرور بنجاح' }, success: true },
    statusCode: 200,
  };
});

mockApi.registerHandler('PUT:/users/:id/toggle-status', async (request: MockRequest): Promise<MockResponse> => {
  await simulateDelay(100, 200);

  const id = request.params?.id;
  const rawUsers = getRawUsers();
  const index = rawUsers.findIndex((u) => u.id === id);

  if (index === -1) {
    throw {
      response: {
        status: 404,
        data: {
          message: 'المستخدم غير موجود',
          statusCode: 404,
        },
      },
    };
  }

  const user = rawUsers[index]!;
  user.isActive = !user.isActive;
  user.updatedAt = new Date().toISOString();
  saveRawUsers(rawUsers);

  return {
    data: transformUser(user),
    statusCode: 200,
  };
});
