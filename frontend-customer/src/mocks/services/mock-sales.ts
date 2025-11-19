/**
 * Mock Sales Service
 * Handles sales invoices and payments mock API calls
 */

import salesInvoicesData from '../data/sales-invoices.json';
import paymentsData from '../data/payments.json';
import customersData from '../data/customers.json';
import productsData from '../data/products.json';
import { mockApi } from './mock-api';
import { filterData, sortData, paginateData, generateId, getMockDataFromStorage, saveMockDataToStorage } from './mock-utils';
import type { MockRequest, MockResponse } from '../types';

// Load data with localStorage persistence
let salesInvoices = getMockDataFromStorage('salesInvoices', salesInvoicesData);
let payments = getMockDataFromStorage('payments', paymentsData);

// Register handlers
mockApi.registerHandler('GET:/sales/invoices', async (request: MockRequest): Promise<MockResponse> => {
  let filtered = filterData(salesInvoices, request.params || {});
  
  if (request.params?.sortBy) {
    filtered = sortData(filtered, request.params.sortBy, request.params.sortOrder || 'desc');
  } else {
    // Default sort by createdAt desc
    filtered = sortData(filtered, 'createdAt', 'desc');
  }
  
  const page = request.params?.page || 1;
  const limit = request.params?.limit || 10;
  const result = paginateData(filtered, page, limit);
  
  return {
    data: result,
    statusCode: 200,
  };
});

mockApi.registerHandler('GET:/sales/invoices/:id', async (request: MockRequest): Promise<MockResponse> => {
  const id = request.params?.id;
  const invoice = salesInvoices.find((inv) => inv.id === id);
  
  if (!invoice) {
    throw {
      response: {
        status: 404,
        data: {
          message: 'الفاتورة غير موجودة',
          statusCode: 404,
        },
      },
    };
  }
  
  return {
    data: invoice,
    statusCode: 200,
  };
});

mockApi.registerHandler('POST:/sales/invoices', async (request: MockRequest): Promise<MockResponse> => {
  const invoiceNumber = `INV-2024-${String(salesInvoices.length + 1).padStart(4, '0')}`;
  
  const newInvoice = {
    id: generateId(),
    invoiceNumber,
    ...request.data,
    status: request.data?.status || 'draft',
    paymentStatus: request.data?.paymentStatus || 'pending',
    subtotal: 0,
    taxAmount: 0,
    discountAmount: request.data?.discountAmount || 0,
    totalAmount: 0,
    lines: request.data?.lines || [],
    payments: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  // Calculate totals
  newInvoice.subtotal = newInvoice.lines.reduce((sum, line) => sum + (line.unitPrice * line.quantity), 0);
  newInvoice.taxAmount = newInvoice.subtotal * 0.15; // 15% tax
  newInvoice.totalAmount = newInvoice.subtotal + newInvoice.taxAmount - newInvoice.discountAmount;
  
  salesInvoices.push(newInvoice);
  saveMockDataToStorage('salesInvoices', salesInvoices);
  
  return {
    data: newInvoice,
    statusCode: 201,
  };
});

mockApi.registerHandler('PATCH:/sales/invoices/:id', async (request: MockRequest): Promise<MockResponse> => {
  const id = request.params?.id;
  const index = salesInvoices.findIndex((inv) => inv.id === id);
  
  if (index === -1) {
    throw {
      response: {
        status: 404,
        data: {
          message: 'الفاتورة غير موجودة',
          statusCode: 404,
        },
      },
    };
  }
  
  salesInvoices[index] = {
    ...salesInvoices[index],
    ...request.data,
    updatedAt: new Date().toISOString(),
  };
  
  saveMockDataToStorage('salesInvoices', salesInvoices);
  
  return {
    data: salesInvoices[index],
    statusCode: 200,
  };
});

mockApi.registerHandler('DELETE:/sales/invoices/:id', async (request: MockRequest): Promise<MockResponse> => {
  const id = request.params?.id;
  const index = salesInvoices.findIndex((inv) => inv.id === id);
  
  if (index === -1) {
    throw {
      response: {
        status: 404,
        data: {
          message: 'الفاتورة غير موجودة',
          statusCode: 404,
        },
      },
    };
  }
  
  salesInvoices.splice(index, 1);
  saveMockDataToStorage('salesInvoices', salesInvoices);
  
  return {
    data: { message: 'تم حذف الفاتورة بنجاح' },
    statusCode: 200,
  };
});

mockApi.registerHandler('GET:/sales/stats', async (request: MockRequest): Promise<MockResponse> => {
  const totalInvoices = salesInvoices.length;
  const totalRevenue = salesInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
  const totalPaid = salesInvoices
    .filter((inv) => inv.paymentStatus === 'paid')
    .reduce((sum, inv) => sum + inv.totalAmount, 0);
  const totalPending = salesInvoices
    .filter((inv) => inv.paymentStatus === 'pending')
    .reduce((sum, inv) => sum + inv.totalAmount, 0);
  
  const invoiceCountByStatus = salesInvoices.reduce((acc, inv) => {
    acc[inv.status] = (acc[inv.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const revenueByPaymentMethod = payments.reduce((acc, pay) => {
    acc[pay.paymentMethod] = (acc[pay.paymentMethod] || 0) + pay.amount;
    return acc;
  }, {} as Record<string, number>);
  
  return {
    data: {
      totalInvoices,
      totalRevenue,
      totalPaid,
      totalPending,
      invoiceCountByStatus,
      revenueByPaymentMethod,
    },
    statusCode: 200,
  };
});

mockApi.registerHandler('POST:/sales/invoices/:id/payments', async (request: MockRequest): Promise<MockResponse> => {
  const invoiceId = request.params?.id;
  const invoice = salesInvoices.find((inv) => inv.id === invoiceId);
  
  if (!invoice) {
    throw {
      response: {
        status: 404,
        data: {
          message: 'الفاتورة غير موجودة',
          statusCode: 404,
        },
      },
    };
  }
  
  const newPayment = {
    id: generateId(),
    salesInvoiceId: invoiceId,
    customerId: invoice.customerId,
    ...request.data,
    paymentDate: request.data?.paymentDate || new Date().toISOString(),
    processedBy: 'user-3',
    currency: {
      id: 'YER',
      code: 'YER',
      name: 'ريال يمني',
    },
  };
  
  payments.push(newPayment);
  saveMockDataToStorage('payments', payments);
  
  // Update invoice payment status
  const totalPaid = payments
    .filter((p) => p.salesInvoiceId === invoiceId)
    .reduce((sum, p) => sum + p.amount, 0);
  
  if (totalPaid >= invoice.totalAmount) {
    invoice.paymentStatus = 'paid';
  } else if (totalPaid > 0) {
    invoice.paymentStatus = 'partial';
  }
  
  invoice.payments = payments.filter((p) => p.salesInvoiceId === invoiceId);
  saveMockDataToStorage('salesInvoices', salesInvoices);
  
  return {
    data: newPayment,
    statusCode: 201,
  };
});

