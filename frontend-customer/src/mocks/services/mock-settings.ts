/**
 * Mock Settings Service
 * Handles settings mock API calls
 */

import settingsData from '../data/settings.json';
import { mockApi } from './mock-api';
import { getMockObjectFromStorage, saveMockObjectToStorage } from './mock-utils';
import type { MockRequest, MockResponse } from '../types';

// Load data with localStorage persistence
let settings = getMockObjectFromStorage('settings', settingsData);

// Register handlers
mockApi.registerHandler('GET:/settings', async (): Promise<MockResponse> => {
  return {
    data: settings,
    statusCode: 200,
  };
});

mockApi.registerHandler('GET:/settings/:key', async (request: MockRequest): Promise<MockResponse> => {
  const key = request.params?.key;
  const value = (settings as any)[key];
  
  if (value === undefined) {
    throw {
      response: {
        status: 404,
        data: {
          message: 'الإعداد غير موجود',
          statusCode: 404,
        },
      },
    };
  }
  
  return {
    data: value,
    statusCode: 200,
  };
});

mockApi.registerHandler('PATCH:/settings', async (request: MockRequest): Promise<MockResponse> => {
  settings = {
    ...settings,
    ...request.data,
  };
  
  saveMockObjectToStorage('settings', settings);
  
  return {
    data: settings,
    statusCode: 200,
  };
});

mockApi.registerHandler('PATCH:/settings/:key', async (request: MockRequest): Promise<MockResponse> => {
  const key = request.params?.key;
  (settings as any)[key] = request.data;
  
  saveMockObjectToStorage('settings', settings);
  
  return {
    data: (settings as any)[key],
    statusCode: 200,
  };
});

