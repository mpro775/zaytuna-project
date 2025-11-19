/**
 * Mock Warehouses Service
 * Handles warehouses mock API calls
 */

import warehousesData from '../data/warehouses.json';
import { mockApi } from './mock-api';
import { filterData, sortData, paginateData, generateId, getMockDataFromStorage, saveMockDataToStorage } from './mock-utils';
import type { MockRequest, MockResponse } from '../types';

// Load data with localStorage persistence
let warehouses = getMockDataFromStorage('warehouses', warehousesData);

// Register handlers
mockApi.registerHandler('GET:/warehouses', async (request: MockRequest): Promise<MockResponse> => {
  let filtered = filterData(warehouses, request.params || {});
  
  if (request.params?.sortBy) {
    filtered = sortData(filtered, request.params.sortBy, request.params.sortOrder || 'asc');
  }
  
  return {
    data: filtered,
    statusCode: 200,
  };
});

mockApi.registerHandler('GET:/warehouses/:id', async (request: MockRequest): Promise<MockResponse> => {
  const id = request.params?.id;
  const warehouse = warehouses.find((w) => w.id === id);
  
  if (!warehouse) {
    throw {
      response: {
        status: 404,
        data: {
          message: 'المخزن غير موجود',
          statusCode: 404,
        },
      },
    };
  }
  
  return {
    data: warehouse,
    statusCode: 200,
  };
});

mockApi.registerHandler('POST:/warehouses', async (request: MockRequest): Promise<MockResponse> => {
  const newWarehouse = {
    id: generateId(),
    ...request.data,
    isActive: request.data?.isActive ?? true,
    totalItems: 0,
    totalValue: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  warehouses.push(newWarehouse);
  saveMockDataToStorage('warehouses', warehouses);
  
  return {
    data: newWarehouse,
    statusCode: 201,
  };
});

mockApi.registerHandler('PATCH:/warehouses/:id', async (request: MockRequest): Promise<MockResponse> => {
  const id = request.params?.id;
  const index = warehouses.findIndex((w) => w.id === id);
  
  if (index === -1) {
    throw {
      response: {
        status: 404,
        data: {
          message: 'المخزن غير موجود',
          statusCode: 404,
        },
      },
    };
  }
  
  warehouses[index] = {
    ...warehouses[index],
    ...request.data,
    updatedAt: new Date().toISOString(),
  };
  
  saveMockDataToStorage('warehouses', warehouses);
  
  return {
    data: warehouses[index],
    statusCode: 200,
  };
});

mockApi.registerHandler('DELETE:/warehouses/:id', async (request: MockRequest): Promise<MockResponse> => {
  const id = request.params?.id;
  const index = warehouses.findIndex((w) => w.id === id);
  
  if (index === -1) {
    throw {
      response: {
        status: 404,
        data: {
          message: 'المخزن غير موجود',
          statusCode: 404,
        },
      },
    };
  }
  
  warehouses.splice(index, 1);
  saveMockDataToStorage('warehouses', warehouses);
  
  return {
    data: { message: 'تم حذف المخزن بنجاح' },
    statusCode: 200,
  };
});

