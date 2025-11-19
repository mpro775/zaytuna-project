/**
 * Mock Accounting Service
 * Handles accounting mock API calls
 */

import glAccountsData from '../data/accounting/gl-accounts.json';
import transactionsData from '../data/accounting/transactions.json';
import { mockApi } from './mock-api';
import { filterData, sortData, paginateData, generateId, getMockDataFromStorage, saveMockDataToStorage } from './mock-utils';
import type { MockRequest, MockResponse } from '../types';

// Load data with localStorage persistence
let glAccounts = getMockDataFromStorage('glAccounts', glAccountsData);
let transactions = getMockDataFromStorage('transactions', transactionsData);

// Register handlers
mockApi.registerHandler('GET:/accounting/gl-accounts', async (request: MockRequest): Promise<MockResponse> => {
  let filtered = filterData(glAccounts, request.params || {});
  
  if (request.params?.sortBy) {
    filtered = sortData(filtered, request.params.sortBy, request.params.sortOrder || 'asc');
  }
  
  return {
    data: filtered,
    statusCode: 200,
  };
});

mockApi.registerHandler('GET:/accounting/gl-accounts/:id', async (request: MockRequest): Promise<MockResponse> => {
  const id = request.params?.id;
  const account = glAccounts.find((acc) => acc.id === id);
  
  if (!account) {
    throw {
      response: {
        status: 404,
        data: {
          message: 'الحساب غير موجود',
          statusCode: 404,
        },
      },
    };
  }
  
  return {
    data: account,
    statusCode: 200,
  };
});

mockApi.registerHandler('POST:/accounting/gl-accounts', async (request: MockRequest): Promise<MockResponse> => {
  const newAccount = {
    id: generateId(),
    ...request.data,
    isActive: request.data?.isActive ?? true,
    balance: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  glAccounts.push(newAccount);
  saveMockDataToStorage('glAccounts', glAccounts);
  
  return {
    data: newAccount,
    statusCode: 201,
  };
});

mockApi.registerHandler('PATCH:/accounting/gl-accounts/:id', async (request: MockRequest): Promise<MockResponse> => {
  const id = request.params?.id;
  const index = glAccounts.findIndex((acc) => acc.id === id);
  
  if (index === -1) {
    throw {
      response: {
        status: 404,
        data: {
          message: 'الحساب غير موجود',
          statusCode: 404,
        },
      },
    };
  }
  
  glAccounts[index] = {
    ...glAccounts[index],
    ...request.data,
    updatedAt: new Date().toISOString(),
  };
  
  saveMockDataToStorage('glAccounts', glAccounts);
  
  return {
    data: glAccounts[index],
    statusCode: 200,
  };
});

mockApi.registerHandler('GET:/accounting/transactions', async (request: MockRequest): Promise<MockResponse> => {
  let filtered = filterData(transactions, request.params || {});
  
  // Default sort by date desc
  filtered = sortData(filtered, 'date', 'desc');
  
  const page = request.params?.page || 1;
  const limit = request.params?.limit || 10;
  const result = paginateData(filtered, page, limit);
  
  return {
    data: result,
    statusCode: 200,
  };
});

mockApi.registerHandler('POST:/accounting/transactions', async (request: MockRequest): Promise<MockResponse> => {
  const newTransaction = {
    id: generateId(),
    ...request.data,
    date: request.data?.date || new Date().toISOString(),
    createdBy: 'user-1',
    createdAt: new Date().toISOString(),
  };
  
  transactions.push(newTransaction);
  saveMockDataToStorage('transactions', transactions);
  
  // Update account balances (simplified)
  const debitAccount = glAccounts.find((acc) => acc.id === newTransaction.debitAccountId);
  const creditAccount = glAccounts.find((acc) => acc.id === newTransaction.creditAccountId);
  
  if (debitAccount) {
    debitAccount.balance += newTransaction.amount;
    debitAccount.updatedAt = new Date().toISOString();
  }
  
  if (creditAccount) {
    creditAccount.balance -= newTransaction.amount;
    creditAccount.updatedAt = new Date().toISOString();
  }
  
  saveMockDataToStorage('glAccounts', glAccounts);
  
  return {
    data: newTransaction,
    statusCode: 201,
  };
});

