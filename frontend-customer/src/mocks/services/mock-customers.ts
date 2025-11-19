/**
 * Mock Customers Service
 * Handles customers mock API calls
 */

import customersData from '../data/customers.json';
import { mockApi } from './mock-api';
import { filterData, sortData, paginateData, generateId, getMockDataFromStorage, saveMockDataToStorage } from './mock-utils';
import type { MockRequest, MockResponse } from '../types';

// Load data with localStorage persistence
const customers = getMockDataFromStorage('customers', customersData);

// Register handlers
mockApi.registerHandler('GET:/customers', async (request: MockRequest): Promise<MockResponse> => {
  let filtered = filterData(customers, request.params || {});
  
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

mockApi.registerHandler('GET:/customers/search', async (request: MockRequest): Promise<MockResponse> => {
  const query = request.params?.query || '';
  let filtered = customers;
  
  if (query) {
    filtered = customers.filter((c) => 
      c.name.toLowerCase().includes(query.toLowerCase()) ||
      c.phone?.includes(query) ||
      c.email?.toLowerCase().includes(query.toLowerCase())
    );
  }
  
  // Apply additional filters
  filtered = filterData(filtered, request.params || {});
  
  const limit = request.params?.limit || 50;
  const result = paginateData(filtered, 1, limit);
  
  return {
    data: result,
    statusCode: 200,
  };
});

mockApi.registerHandler('GET:/customers/:id', async (request: MockRequest): Promise<MockResponse> => {
  const id = request.params?.id;
  const customer = customers.find((c) => c.id === id);
  
  if (!customer) {
    throw {
      response: {
        status: 404,
        data: {
          message: 'العميل غير موجود',
          statusCode: 404,
        },
      },
    };
  }
  
  return {
    data: customer,
    statusCode: 200,
  };
});

mockApi.registerHandler('POST:/customers', async (request: MockRequest): Promise<MockResponse> => {
  const newCustomer = {
    id: generateId(),
    ...request.data,
    isActive: request.data?.isActive ?? true,
    loyaltyPoints: 0,
    loyaltyTier: 'bronze',
    totalPurchases: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'user-1',
  };
  
  customers.push(newCustomer);
  saveMockDataToStorage('customers', customers);
  
  return {
    data: newCustomer,
    statusCode: 201,
  };
});

mockApi.registerHandler('PATCH:/customers/:id', async (request: MockRequest): Promise<MockResponse> => {
  const id = request.params?.id;
  const index = customers.findIndex((c) => c.id === id);
  
  if (index === -1) {
    throw {
      response: {
        status: 404,
        data: {
          message: 'العميل غير موجود',
          statusCode: 404,
        },
      },
    };
  }
  
  customers[index] = {
    ...customers[index],
    ...request.data,
    updatedAt: new Date().toISOString(),
  };
  
  saveMockDataToStorage('customers', customers);
  
  return {
    data: customers[index],
    statusCode: 200,
  };
});

mockApi.registerHandler('DELETE:/customers/:id', async (request: MockRequest): Promise<MockResponse> => {
  const id = request.params?.id;
  const index = customers.findIndex((c) => c.id === id);
  
  if (index === -1) {
    throw {
      response: {
        status: 404,
        data: {
          message: 'العميل غير موجود',
          statusCode: 404,
        },
      },
    };
  }
  
  customers.splice(index, 1);
  saveMockDataToStorage('customers', customers);
  
  return {
    data: { message: 'تم حذف العميل بنجاح' },
    statusCode: 200,
  };
});

mockApi.registerHandler('GET:/customers/stats/overview', async (): Promise<MockResponse> => {
  const totalCustomers = customers.length;
  const activeCustomers = customers.filter((c) => c.isActive).length;
  const inactiveCustomers = totalCustomers - activeCustomers;
  const totalLoyaltyPoints = customers.reduce((sum, c) => sum + (c.loyaltyPoints || 0), 0);
  const totalPurchases = customers.reduce((sum, c) => sum + (c.totalPurchases || 0), 0);
  const averagePurchaseValue = totalCustomers > 0 ? totalPurchases / totalCustomers : 0;
  
  const tierDistribution = {
    bronze: customers.filter((c) => c.loyaltyTier === 'bronze').length,
    silver: customers.filter((c) => c.loyaltyTier === 'silver').length,
    gold: customers.filter((c) => c.loyaltyTier === 'gold').length,
    platinum: customers.filter((c) => c.loyaltyTier === 'platinum').length,
  };
  
  return {
    data: {
      totalCustomers,
      activeCustomers,
      inactiveCustomers,
      totalLoyaltyPoints,
      averagePurchaseValue,
      topTierDistribution: tierDistribution,
    },
    statusCode: 200,
  };
});

mockApi.registerHandler('GET:/customers/:id/loyalty', async (request: MockRequest): Promise<MockResponse> => {
  const id = request.params?.id;
  const customer = customers.find((c) => c.id === id);
  
  if (!customer) {
    throw {
      response: {
        status: 404,
        data: {
          message: 'العميل غير موجود',
          statusCode: 404,
        },
      },
    };
  }
  
  const tierThresholds = {
    bronze: 0,
    silver: 500,
    gold: 1000,
    platinum: 2000,
  };
  
  const currentTier = customer.loyaltyTier || 'bronze';
  const currentPoints = customer.loyaltyPoints || 0;
  
  let nextTier: string | null = null;
  let nextTierThreshold: number | null = null;
  
  if (currentTier === 'bronze') {
    nextTier = 'silver';
    nextTierThreshold = tierThresholds.silver;
  } else if (currentTier === 'silver') {
    nextTier = 'gold';
    nextTierThreshold = tierThresholds.gold;
  } else if (currentTier === 'gold') {
    nextTier = 'platinum';
    nextTierThreshold = tierThresholds.platinum;
  }
  
  const pointsToNextTier = nextTierThreshold ? Math.max(0, nextTierThreshold - currentPoints) : null;
  
  const tierBenefits = {
    bronze: ['خصم 5% على المشتريات'],
    silver: ['خصم 10% على المشتريات', 'نقاط مضاعفة'],
    gold: ['خصم 15% على المشتريات', 'نقاط مضاعفة', 'شحن مجاني'],
    platinum: ['خصم 20% على المشتريات', 'نقاط مضاعفة', 'شحن مجاني', 'دعم مخصص'],
  };
  
  return {
    data: {
      currentPoints,
      tier: currentTier,
      nextTier,
      nextTierThreshold,
      pointsToNextTier,
      totalPurchases: customer.totalPurchases || 0,
      lastPurchaseDate: customer.lastPurchaseDate,
      tierBenefits: tierBenefits[currentTier as keyof typeof tierBenefits] || [],
    },
    statusCode: 200,
  };
});

