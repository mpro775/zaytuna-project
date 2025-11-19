/**
 * Mock Products Service
 * Handles products and categories mock API calls
 */

import productsData from '../data/products.json';
import categoriesData from '../data/categories.json';
import { mockApi } from './mock-api';
import { filterData, sortData, paginateData, generateId, getMockDataFromStorage, saveMockDataToStorage } from './mock-utils';
import type { MockRequest, MockResponse } from '../types';

// Load data with localStorage persistence
let products = getMockDataFromStorage('products', productsData);
let categories = [...categoriesData];

// Register handlers
mockApi.registerHandler('GET:/products', async (request: MockRequest): Promise<MockResponse> => {
  let filtered = filterData(products, request.params || {});
  
  // Sort
  if (request.params?.sortBy) {
    filtered = sortData(filtered, request.params.sortBy, request.params.sortOrder || 'asc');
  }
  
  // Paginate
  const page = request.params?.page || 1;
  const limit = request.params?.limit || 10;
  const result = paginateData(filtered, page, limit);
  
  return {
    data: result,
    statusCode: 200,
  };
});

mockApi.registerHandler('GET:/products/:id', async (request: MockRequest): Promise<MockResponse> => {
  const id = request.params?.id;
  const product = products.find((p) => p.id === id);
  
  if (!product) {
    throw {
      response: {
        status: 404,
        data: {
          message: 'المنتج غير موجود',
          statusCode: 404,
        },
      },
    };
  }
  
  // Add category relation
  const category = categories.find((c) => c.id === product.categoryId);
  const productWithCategory = { ...product, category };
  
  return {
    data: productWithCategory,
    statusCode: 200,
  };
});

mockApi.registerHandler('POST:/products', async (request: MockRequest): Promise<MockResponse> => {
  const newProduct = {
    id: generateId(),
    ...request.data,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'user-1',
    images: [],
    variants: [],
  };
  
  products.push(newProduct);
  saveMockDataToStorage('products', products);
  
  const category = categories.find((c) => c.id === newProduct.categoryId);
  const productWithCategory = { ...newProduct, category };
  
  return {
    data: productWithCategory,
    statusCode: 201,
  };
});

mockApi.registerHandler('PATCH:/products/:id', async (request: MockRequest): Promise<MockResponse> => {
  const id = request.params?.id;
  const index = products.findIndex((p) => p.id === id);
  
  if (index === -1) {
    throw {
      response: {
        status: 404,
        data: {
          message: 'المنتج غير موجود',
          statusCode: 404,
        },
      },
    };
  }
  
  products[index] = {
    ...products[index],
    ...request.data,
    updatedAt: new Date().toISOString(),
  };
  
  saveMockDataToStorage('products', products);
  
  const category = categories.find((c) => c.id === products[index].categoryId);
  const productWithCategory = { ...products[index], category };
  
  return {
    data: productWithCategory,
    statusCode: 200,
  };
});

mockApi.registerHandler('DELETE:/products/:id', async (request: MockRequest): Promise<MockResponse> => {
  const id = request.params?.id;
  const index = products.findIndex((p) => p.id === id);
  
  if (index === -1) {
    throw {
      response: {
        status: 404,
        data: {
          message: 'المنتج غير موجود',
          statusCode: 404,
        },
      },
    };
  }
  
  products.splice(index, 1);
  saveMockDataToStorage('products', products);
  
  return {
    data: { message: 'تم حذف المنتج بنجاح' },
    statusCode: 200,
  };
});

// Categories
mockApi.registerHandler('GET:/products/categories', async (request: MockRequest): Promise<MockResponse> => {
  let filtered = filterData(categories, request.params || {});
  
  if (request.params?.sortBy) {
    filtered = sortData(filtered, request.params.sortBy, request.params.sortOrder || 'asc');
  }
  
  return {
    data: filtered,
    statusCode: 200,
  };
});

mockApi.registerHandler('GET:/products/categories/:id', async (request: MockRequest): Promise<MockResponse> => {
  const id = request.params?.id;
  const category = categories.find((c) => c.id === id);
  
  if (!category) {
    throw {
      response: {
        status: 404,
        data: {
          message: 'الفئة غير موجودة',
          statusCode: 404,
        },
      },
    };
  }
  
  return {
    data: category,
    statusCode: 200,
  };
});

mockApi.registerHandler('POST:/products/categories', async (request: MockRequest): Promise<MockResponse> => {
  const newCategory = {
    id: generateId(),
    ...request.data,
    isActive: request.data?.isActive ?? true,
    sortOrder: request.data?.sortOrder ?? categories.length + 1,
    productCount: 0,
    children: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  categories.push(newCategory);
  
  return {
    data: newCategory,
    statusCode: 201,
  };
});

mockApi.registerHandler('PATCH:/products/categories/:id', async (request: MockRequest): Promise<MockResponse> => {
  const id = request.params?.id;
  const index = categories.findIndex((c) => c.id === id);
  
  if (index === -1) {
    throw {
      response: {
        status: 404,
        data: {
          message: 'الفئة غير موجودة',
          statusCode: 404,
        },
      },
    };
  }
  
  categories[index] = {
    ...categories[index],
    ...request.data,
    updatedAt: new Date().toISOString(),
  };
  
  return {
    data: categories[index],
    statusCode: 200,
  };
});

mockApi.registerHandler('DELETE:/products/categories/:id', async (request: MockRequest): Promise<MockResponse> => {
  const id = request.params?.id;
  const index = categories.findIndex((c) => c.id === id);
  
  if (index === -1) {
    throw {
      response: {
        status: 404,
        data: {
          message: 'الفئة غير موجودة',
          statusCode: 404,
        },
      },
    };
  }
  
  categories.splice(index, 1);
  
  return {
    data: { message: 'تم حذف الفئة بنجاح' },
    statusCode: 200,
  };
});

