/**
 * Mock POS Service
 * Handles point of sale API mock calls
 */

import productsData from '../data/products.json';
import categoriesData from '../data/categories.json';
import customersData from '../data/customers.json';

import { mockApi } from './mock-api';
import {
  generateId,
  getMockDataFromStorage,
  saveMockDataToStorage,
  saveMockObjectToStorage,
  getMockObjectFromStorage,
} from './mock-utils';
import type { MockRequest, MockResponse } from '../types';

// POS-specific data (shifts and transactions are mutable)
const defaultPosShifts: unknown[] = [];
const defaultPosTransactions: unknown[] = [];
const defaultPosSettings = {
  defaultWarehouseId: 'warehouse-1',
  defaultCurrencyId: 'YER',
  defaultTaxRate: 15,
  allowNegativeStock: false,
  requireCustomer: false,
  printReceiptByDefault: true,
  receiptPrinterType: 'thermal' as const,
  soundEnabled: true,
  quickAccessCategories: ['cat-1', 'cat-2'],
  quickAccessProducts: ['prod-1', 'prod-2', 'prod-3'],
};

const posShifts = getMockDataFromStorage('posShifts', defaultPosShifts as Record<string, unknown>[]);
const posTransactions = getMockDataFromStorage('posTransactions', defaultPosTransactions as Record<string, unknown>[]);
const posSettings = getMockObjectFromStorage('posSettings', defaultPosSettings as Record<string, unknown>);

// Transform products to POS format
const toPOSProduct = (p: Record<string, unknown>, categoryName?: string) => ({
  id: p.id,
  name: p.name,
  barcode: p.barcode,
  sku: p.sku,
  price: p.basePrice ?? p.price ?? 0,
  costPrice: p.costPrice,
  categoryId: p.categoryId,
  categoryName: categoryName ?? '',
  imageUrl: (p.images as string[])?.[0],
  stockQuantity: p.currentStock ?? p.stockQuantity ?? 0,
  trackInventory: true,
  taxRate: 15,
  variants: [],
});

// Products - use products.json
mockApi.registerHandler('GET:/pos/products', async (request: MockRequest): Promise<MockResponse> => {
  const categories = categoriesData as Record<string, unknown>[];
  const categoryMap = Object.fromEntries(categories.map((c) => [c.id, c.name]));

  let products = (productsData as Record<string, unknown>[]).map((p) =>
    toPOSProduct(p, categoryMap[p.categoryId as string] as string)
  );

  if (request.params?.search) {
    const search = String(request.params.search).toLowerCase();
    products = products.filter(
      (p) =>
        (p.name as string).toLowerCase().includes(search) ||
        (p.barcode as string)?.toLowerCase().includes(search) ||
        (p.sku as string)?.toLowerCase().includes(search)
    );
  }
  if (request.params?.categoryId) {
    products = products.filter((p) => p.categoryId === request.params?.categoryId);
  }
  if (request.params?.barcode) {
    products = products.filter((p) => p.barcode === request.params?.barcode);
  }
  if (request.params?.inStock === true || request.params?.inStock === 'true') {
    products = products.filter((p) => (p.stockQuantity as number) > 0);
  }

  return { data: products, statusCode: 200 };
});

mockApi.registerHandler(
  'GET:/pos/products/barcode/:barcode',
  async (request: MockRequest): Promise<MockResponse> => {
    const barcode = request.params?.barcode;
    const categories = categoriesData as Record<string, unknown>[];
    const categoryMap = Object.fromEntries(categories.map((c) => [c.id, c.name]));

    const product = (productsData as Record<string, unknown>[]).find((p) => p.barcode === barcode);
    if (!product) {
      throw {
        response: { status: 404, data: { message: 'المنتج غير موجود', statusCode: 404 } },
      };
    }
    const posProduct = toPOSProduct(product, categoryMap[product.categoryId as string] as string);
    return { data: posProduct, statusCode: 200 };
  }
);

mockApi.registerHandler('GET:/pos/categories', async (): Promise<MockResponse> => {
  const categories = (categoriesData as Record<string, unknown>[]).map((c) => ({
    id: c.id,
    name: c.name,
    productCount: c.productCount ?? 0,
  }));
  return { data: categories, statusCode: 200 };
});

// Transactions
mockApi.registerHandler('POST:/pos/transactions', async (request: MockRequest): Promise<MockResponse> => {
  const payload = request.data as {
    cart: { items: unknown[]; grandTotal: number };
    payments: { amount: number }[];
    customerId?: string;
    warehouseId: string;
    notes?: string;
  };

  const invoiceNumber = `POS-${Date.now()}`;
  const totalPaid = payload.payments?.reduce((sum, p) => sum + (p.amount ?? 0), 0) ?? 0;
  const grandTotal = payload.cart?.grandTotal ?? 0;
  const change = Math.max(0, totalPaid - grandTotal);

  const warehouseId =
    payload.warehouseId === 'default' || !payload.warehouseId ? 'warehouse-1' : payload.warehouseId;

  const transaction = {
    id: generateId(),
    invoiceNumber,
    cart: payload.cart ?? { items: [], grandTotal: 0 },
    payments: payload.payments ?? [],
    totalPaid,
    change,
    status: 'completed',
    cashierId: 'user-3',
    branchId: 'branch-1',
    warehouseId,
    createdAt: new Date().toISOString(),
  };

  posTransactions.push(transaction);
  saveMockDataToStorage('posTransactions', posTransactions);

  return { data: transaction, statusCode: 201 };
});

mockApi.registerHandler('GET:/pos/transactions', async (request: MockRequest): Promise<MockResponse> => {
  let filtered = [...posTransactions];
  if (request.params?.shiftId) {
    filtered = filtered.filter((t: Record<string, unknown>) => t.shiftId === request.params?.shiftId);
  }
  if (request.params?.status) {
    filtered = filtered.filter((t: Record<string, unknown>) => t.status === request.params?.status);
  }
  return { data: filtered, statusCode: 200 };
});

mockApi.registerHandler(
  'GET:/pos/transactions/:id',
  async (request: MockRequest): Promise<MockResponse> => {
    const id = request.params?.id;
    const transaction = posTransactions.find((t: Record<string, unknown>) => t.id === id);
    if (!transaction) {
      throw {
        response: { status: 404, data: { message: 'المعاملة غير موجودة', statusCode: 404 } },
      };
    }
    return { data: transaction, statusCode: 200 };
  }
);

mockApi.registerHandler(
  'POST:/pos/transactions/:id/void',
  async (request: MockRequest): Promise<MockResponse> => {
    const id = request.params?.id;
    const index = posTransactions.findIndex((t: Record<string, unknown>) => t.id === id);
    if (index === -1) {
      throw {
        response: { status: 404, data: { message: 'المعاملة غير موجودة', statusCode: 404 } },
      };
    }
    (posTransactions[index]! as Record<string, unknown>).status = 'cancelled';
    saveMockDataToStorage('posTransactions', posTransactions);
    return { data: { message: 'تم إلغاء المعاملة' }, statusCode: 200 };
  }
);

// Shifts
mockApi.registerHandler('POST:/pos/shifts/open', async (request: MockRequest): Promise<MockResponse> => {
  const openingCash = (request.data as { openingCash?: number })?.openingCash ?? 0;
  const shift = {
    id: generateId(),
    cashierId: 'user-3',
    cashierName: 'خالد حسن',
    branchId: 'branch-1',
    startTime: new Date().toISOString(),
    openingCash,
    totalSales: 0,
    totalTransactions: 0,
    status: 'open',
  };
  posShifts.push(shift);
  saveMockDataToStorage('posShifts', posShifts);
  return { data: shift, statusCode: 201 };
});

mockApi.registerHandler(
  'POST:/pos/shifts/:id/close',
  async (request: MockRequest): Promise<MockResponse> => {
    const id = request.params?.id;
    const { closingCash = 0, notes } = (request.data as { closingCash?: number; notes?: string }) ?? {};
    const index = posShifts.findIndex((s: Record<string, unknown>) => s.id === id);
    if (index === -1) {
      throw {
        response: { status: 404, data: { message: 'الوردية غير موجودة', statusCode: 404 } },
      };
    }
    const shift = posShifts[index]! as Record<string, unknown>;
    shift.endTime = new Date().toISOString();
    shift.closingCash = closingCash;
    shift.expectedCash = shift.openingCash as number;
    shift.cashDifference = (closingCash ?? 0) - (shift.openingCash as number);
    shift.status = 'closed';
    shift.notes = notes;
    saveMockDataToStorage('posShifts', posShifts);
    return { data: shift, statusCode: 200 };
  }
);

mockApi.registerHandler('GET:/pos/shifts/current', async (): Promise<MockResponse> => {
  const currentShift = posShifts.find((s: Record<string, unknown>) => s.status === 'open');
  if (!currentShift) {
    throw {
      response: { status: 404, data: { message: 'لا توجد وردية مفتوحة', statusCode: 404 } },
    };
  }
  return { data: currentShift, statusCode: 200 };
});

mockApi.registerHandler(
  'GET:/pos/shifts/:id/report',
  async (request: MockRequest): Promise<MockResponse> => {
    const shiftId = request.params?.id;
    const shift = posShifts.find((s: Record<string, unknown>) => s.id === shiftId);
    if (!shift) {
      throw {
        response: { status: 404, data: { message: 'الوردية غير موجودة', statusCode: 404 } },
      };
    }
    const transactions = posTransactions.filter(
      (t: Record<string, unknown>) => t.shiftId === shiftId || !t.shiftId
    );
    const summary = {
      totalCash: 0,
      totalCard: 0,
      totalOther: 0,
      totalRefunds: 0,
      netSales: (shift as Record<string, unknown>).totalSales ?? 0,
    };
    return { data: { shift, transactions, summary }, statusCode: 200 };
  }
);

// Settings
mockApi.registerHandler('GET:/pos/settings', async (): Promise<MockResponse> => {
  const settings = getMockObjectFromStorage('posSettings', posSettings);
  return { data: settings, statusCode: 200 };
});

mockApi.registerHandler('PUT:/pos/settings', async (request: MockRequest): Promise<MockResponse> => {
  const updated = { ...(posSettings as Record<string, unknown>), ...(request.data as Record<string, unknown>) };
  saveMockObjectToStorage('posSettings', updated);
  return { data: updated, statusCode: 200 };
});

// Customers
mockApi.registerHandler('GET:/pos/customers/search', async (request: MockRequest): Promise<MockResponse> => {
  const q = String(request.params?.q ?? '').toLowerCase();
  if (q.length < 2) {
    return { data: [], statusCode: 200 };
  }
  const customers = (customersData as Record<string, unknown>[]).filter(
    (c) =>
      (c.name as string).toLowerCase().includes(q) ||
      (c.phone as string)?.includes(q) ||
      (c.email as string)?.toLowerCase().includes(q)
  );
  const result = customers.map((c) => ({
    id: c.id,
    name: c.name,
    phone: c.phone,
    loyaltyPoints: c.loyaltyPoints ?? 0,
    loyaltyTier: c.loyaltyTier ?? 'bronze',
    creditLimit: c.creditLimit,
    currentBalance: 0,
  }));
  return { data: result, statusCode: 200 };
});

mockApi.registerHandler('GET:/pos/customers/frequent', async (): Promise<MockResponse> => {
  const customers = (customersData as Record<string, unknown>[])
    .slice(0, 5)
    .map((c) => ({
      id: c.id,
      name: c.name,
      phone: c.phone,
      loyaltyPoints: c.loyaltyPoints ?? 0,
      loyaltyTier: c.loyaltyTier ?? 'bronze',
      creditLimit: c.creditLimit,
      currentBalance: 0,
    }));
  return { data: customers, statusCode: 200 };
});

mockApi.registerHandler(
  'POST:/pos/transactions/:id/email-receipt',
  async (request: MockRequest): Promise<MockResponse> => {
    const id = request.params?.id;
    const transaction = posTransactions.find((t: Record<string, unknown>) => t.id === id);
    if (!transaction) {
      throw {
        response: { status: 404, data: { message: 'المعاملة غير موجودة', statusCode: 404 } },
      };
    }
    return { data: { success: true, message: 'تم إرسال الإيصال' }, statusCode: 200 };
  }
);

// Receipt - returns Blob for print
mockApi.registerHandler(
  'GET:/pos/transactions/:id/receipt',
  async (request: MockRequest): Promise<MockResponse> => {
    const id = request.params?.id;
    const transaction = posTransactions.find((t: Record<string, unknown>) => t.id === id);
    if (!transaction) {
      throw {
        response: { status: 404, data: { message: 'المعاملة غير موجودة', statusCode: 404 } },
      };
    }
    const html = `<html><body dir="rtl"><pre>فاتورة #${(transaction as Record<string, unknown>).invoiceNumber}</pre></body></html>`;
    const blob = new Blob([html], { type: 'text/html' });
    return { data: blob, statusCode: 200 };
  }
);
