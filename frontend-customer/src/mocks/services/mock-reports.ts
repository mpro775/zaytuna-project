/**
 * Mock Reports Service
 * Handles reports mock API calls
 */

import salesReportData from '../data/reports/sales-report.json';
import inventoryReportData from '../data/reports/inventory-report.json';
import financialReportData from '../data/reports/financial-report.json';
import dashboardData from '../data/reports/dashboard-data.json';
import { mockApi } from './mock-api';
import type { MockRequest, MockResponse } from '../types';

// Register handlers
mockApi.registerHandler('GET:/reporting/sales', async (request: MockRequest): Promise<MockResponse> => {
  return {
    data: salesReportData,
    statusCode: 200,
  };
});

mockApi.registerHandler('GET:/reporting/sales/monthly', async (request: MockRequest): Promise<MockResponse> => {
  return {
    data: salesReportData,
    statusCode: 200,
  };
});

mockApi.registerHandler('GET:/reporting/sales/daily', async (request: MockRequest): Promise<MockResponse> => {
  return {
    data: salesReportData,
    statusCode: 200,
  };
});

mockApi.registerHandler('GET:/reporting/inventory', async (request: MockRequest): Promise<MockResponse> => {
  return {
    data: inventoryReportData,
    statusCode: 200,
  };
});

mockApi.registerHandler('GET:/reporting/inventory/low-stock', async (request: MockRequest): Promise<MockResponse> => {
  return {
    data: {
      lowStockAlerts: inventoryReportData.lowStockAlerts,
      summary: {
        totalLowStockItems: inventoryReportData.summary.lowStockItems,
        totalOutOfStockItems: inventoryReportData.summary.outOfStockItems,
      },
    },
    statusCode: 200,
  };
});

mockApi.registerHandler('GET:/reporting/inventory/movements', async (request: MockRequest): Promise<MockResponse> => {
  return {
    data: {
      stockMovements: inventoryReportData.stockMovements,
      summary: inventoryReportData.summary,
    },
    statusCode: 200,
  };
});

mockApi.registerHandler('GET:/reporting/financial/balance-sheet', async (request: MockRequest): Promise<MockResponse> => {
  return {
    data: financialReportData.balanceSheet,
    statusCode: 200,
  };
});

mockApi.registerHandler('GET:/reporting/financial/profit-loss', async (request: MockRequest): Promise<MockResponse> => {
  return {
    data: financialReportData.profitLoss,
    statusCode: 200,
  };
});

mockApi.registerHandler('GET:/reporting/financial/cash-flow', async (request: MockRequest): Promise<MockResponse> => {
  return {
    data: financialReportData.cashFlow,
    statusCode: 200,
  };
});

mockApi.registerHandler('GET:/reporting/financial/comprehensive', async (request: MockRequest): Promise<MockResponse> => {
  return {
    data: financialReportData,
    statusCode: 200,
  };
});

mockApi.registerHandler('GET:/reporting/dashboard/overview', async (request: MockRequest): Promise<MockResponse> => {
  return {
    data: dashboardData,
    statusCode: 200,
  };
});

mockApi.registerHandler('GET:/reporting/dashboard/sales', async (request: MockRequest): Promise<MockResponse> => {
  return {
    data: salesReportData,
    statusCode: 200,
  };
});

mockApi.registerHandler('GET:/reporting/dashboard/inventory', async (request: MockRequest): Promise<MockResponse> => {
  return {
    data: {
      summary: inventoryReportData.summary,
      lowStockAlerts: inventoryReportData.lowStockAlerts,
      topMovingProducts: inventoryReportData.topMovingProducts,
    },
    statusCode: 200,
  };
});

mockApi.registerHandler('GET:/reporting/sales/export/excel', async (request: MockRequest): Promise<MockResponse> => {
  // Mock Excel export - return a blob-like response
  return {
    data: new Blob(['Mock Excel Data'], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
    statusCode: 200,
  };
});

mockApi.registerHandler('GET:/reporting/inventory/export/excel', async (request: MockRequest): Promise<MockResponse> => {
  return {
    data: new Blob(['Mock Excel Data'], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
    statusCode: 200,
  };
});

mockApi.registerHandler('GET:/reporting/sales/export/pdf', async (request: MockRequest): Promise<MockResponse> => {
  return {
    data: new Blob(['Mock PDF Data'], { type: 'application/pdf' }),
    statusCode: 200,
  };
});

mockApi.registerHandler('GET:/reporting/inventory/export/pdf', async (request: MockRequest): Promise<MockResponse> => {
  return {
    data: new Blob(['Mock PDF Data'], { type: 'application/pdf' }),
    statusCode: 200,
  };
});

