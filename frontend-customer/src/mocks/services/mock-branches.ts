/**
 * Mock Branches Service
 * Handles branches mock API calls
 */

import branchesData from '../data/branches.json';
import { mockApi } from './mock-api';
import { filterData, sortData, paginateData, generateId, getMockDataFromStorage, saveMockDataToStorage } from './mock-utils';
import type { MockRequest, MockResponse } from '../types';

// Load data with localStorage persistence
const branches = getMockDataFromStorage('branches', branchesData);

// Register handlers
mockApi.registerHandler('GET:/branches', async (request: MockRequest): Promise<MockResponse> => {
  let filtered = filterData(branches, request.params || {});
  
  if (request.params?.sortBy) {
    filtered = sortData(filtered, request.params.sortBy, request.params.sortOrder || 'asc');
  }
  
  const page = request.params?.page || 1;
  const limit = request.params?.limit || 10;
  const result = paginateData(filtered, page, limit);
  
  return {
    data: result,
    statusCode: 200,
  };
});

mockApi.registerHandler('GET:/branches/:id', async (request: MockRequest): Promise<MockResponse> => {
  const id = request.params?.id;
  const branch = branches.find((b) => b.id === id);
  
  if (!branch) {
    throw {
      response: {
        status: 404,
        data: {
          message: 'الفرع غير موجود',
          statusCode: 404,
        },
      },
    };
  }
  
  return {
    data: branch,
    statusCode: 200,
  };
});

mockApi.registerHandler('POST:/branches', async (request: MockRequest): Promise<MockResponse> => {
  const newBranch = {
    id: generateId(),
    ...request.data,
    isActive: request.data?.isActive ?? true,
    totalSales: 0,
    totalRevenue: 0,
    totalUsers: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  branches.push(newBranch);
  saveMockDataToStorage('branches', branches);
  
  return {
    data: newBranch,
    statusCode: 201,
  };
});

mockApi.registerHandler('PATCH:/branches/:id', async (request: MockRequest): Promise<MockResponse> => {
  const id = request.params?.id;
  const index = branches.findIndex((b) => b.id === id);
  
  if (index === -1) {
    throw {
      response: {
        status: 404,
        data: {
          message: 'الفرع غير موجود',
          statusCode: 404,
        },
      },
    };
  }
  
  branches[index] = {
    ...branches[index],
    ...request.data,
    updatedAt: new Date().toISOString(),
  };
  
  saveMockDataToStorage('branches', branches);
  
  return {
    data: branches[index],
    statusCode: 200,
  };
});

mockApi.registerHandler('DELETE:/branches/:id', async (request: MockRequest): Promise<MockResponse> => {
  const id = request.params?.id;
  const index = branches.findIndex((b) => b.id === id);
  
  if (index === -1) {
    throw {
      response: {
        status: 404,
        data: {
          message: 'الفرع غير موجود',
          statusCode: 404,
        },
      },
    };
  }
  
  branches.splice(index, 1);
  saveMockDataToStorage('branches', branches);
  
  return {
    data: { message: 'تم حذف الفرع بنجاح' },
    statusCode: 200,
  };
});

mockApi.registerHandler('GET:/branches/stats', async (): Promise<MockResponse> => {
  const totalBranches = branches.length;
  const activeBranches = branches.filter((b) => b.isActive).length;
  const totalSales = branches.reduce((sum, b) => sum + (b.totalSales || 0), 0);
  const totalRevenue = branches.reduce((sum, b) => sum + (b.totalRevenue || 0), 0);
  const totalUsers = branches.reduce((sum, b) => sum + (b.totalUsers || 0), 0);
  
  return {
    data: {
      totalBranches,
      activeBranches,
      totalSales,
      totalRevenue,
      totalUsers,
    },
    statusCode: 200,
  };
});

