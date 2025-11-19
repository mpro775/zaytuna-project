/**
 * Mock Suppliers Service
 * Handles suppliers mock API calls
 */

import suppliersData from '../data/suppliers.json';
import { mockApi } from './mock-api';
import { filterData, sortData, paginateData, generateId, getMockDataFromStorage, saveMockDataToStorage } from './mock-utils';
import type { MockRequest, MockResponse } from '../types';

// Load data with localStorage persistence
let suppliers = getMockDataFromStorage('suppliers', suppliersData);

// Register handlers
mockApi.registerHandler('GET:/purchasing/suppliers', async (request: MockRequest): Promise<MockResponse> => {
  let filtered = filterData(suppliers, request.params || {});
  
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

mockApi.registerHandler('GET:/purchasing/suppliers/:id', async (request: MockRequest): Promise<MockResponse> => {
  const id = request.params?.id;
  const supplier = suppliers.find((s) => s.id === id);
  
  if (!supplier) {
    throw {
      response: {
        status: 404,
        data: {
          message: 'المورد غير موجود',
          statusCode: 404,
        },
      },
    };
  }
  
  return {
    data: supplier,
    statusCode: 200,
  };
});

mockApi.registerHandler('POST:/purchasing/suppliers', async (request: MockRequest): Promise<MockResponse> => {
  const newSupplier = {
    id: generateId(),
    ...request.data,
    isActive: request.data?.isActive ?? true,
    totalPurchases: 0,
    outstandingBalance: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  suppliers.push(newSupplier);
  saveMockDataToStorage('suppliers', suppliers);
  
  return {
    data: newSupplier,
    statusCode: 201,
  };
});

mockApi.registerHandler('PATCH:/purchasing/suppliers/:id', async (request: MockRequest): Promise<MockResponse> => {
  const id = request.params?.id;
  const index = suppliers.findIndex((s) => s.id === id);
  
  if (index === -1) {
    throw {
      response: {
        status: 404,
        data: {
          message: 'المورد غير موجود',
          statusCode: 404,
        },
      },
    };
  }
  
  suppliers[index] = {
    ...suppliers[index],
    ...request.data,
    updatedAt: new Date().toISOString(),
  };
  
  saveMockDataToStorage('suppliers', suppliers);
  
  return {
    data: suppliers[index],
    statusCode: 200,
  };
});

mockApi.registerHandler('DELETE:/purchasing/suppliers/:id', async (request: MockRequest): Promise<MockResponse> => {
  const id = request.params?.id;
  const index = suppliers.findIndex((s) => s.id === id);
  
  if (index === -1) {
    throw {
      response: {
        status: 404,
        data: {
          message: 'المورد غير موجود',
          statusCode: 404,
        },
      },
    };
  }
  
  suppliers.splice(index, 1);
  saveMockDataToStorage('suppliers', suppliers);
  
  return {
    data: { message: 'تم حذف المورد بنجاح' },
    statusCode: 200,
  };
});

mockApi.registerHandler('GET:/purchasing/suppliers/stats/overview', async (request: MockRequest): Promise<MockResponse> => {
  const totalSuppliers = suppliers.length;
  const activeSuppliers = suppliers.filter((s) => s.isActive).length;
  const totalPurchases = suppliers.reduce((sum, s) => sum + (s.totalPurchases || 0), 0);
  const totalOutstanding = suppliers.reduce((sum, s) => sum + (s.outstandingBalance || 0), 0);
  const topSuppliersByVolume = [...suppliers]
    .sort((a, b) => (b.totalPurchases || 0) - (a.totalPurchases || 0))
    .slice(0, 5);
  
  return {
    data: {
      totalSuppliers,
      activeSuppliers,
      totalPurchases,
      totalOutstanding,
      topSuppliersByVolume,
    },
    statusCode: 200,
  };
});

mockApi.registerHandler('GET:/purchasing/suppliers/outstanding-balance', async (request: MockRequest): Promise<MockResponse> => {
  const suppliersWithBalance = suppliers.filter((s) => (s.outstandingBalance || 0) > 0);
  
  return {
    data: suppliersWithBalance,
    statusCode: 200,
  };
});

