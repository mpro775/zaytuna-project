import { api } from '../api';
import type {
  POSProduct,
  POSTransaction,
  POSShift,
  POSSettings,
  POSFilters,
  QuickCustomer,
  Cart,
  Payment,
} from './types';

interface BackendProduct {
  id: string;
  name: string;
  barcode?: string;
  sku?: string;
  categoryId: string;
  category?: { id: string; name: string };
  basePrice?: number;
  costPrice?: number;
  currentStock?: number;
  images?: Array<{ url?: string; isPrimary?: boolean }>;
  variants?: Array<{
    id: string;
    name: string;
    sku?: string;
    barcode?: string;
    price?: number;
    priceModifier?: number;
    stock?: number;
  }>;
}

interface BackendInvoice {
  id: string;
  invoiceNumber: string;
  status: string;
  paymentStatus?: string;
  cashierId?: string;
  branchId: string;
  warehouseId: string;
  totalAmount: number;
  createdAt: string;
  lines?: Array<{
    id: string;
    productVariantId: string;
    quantity: number;
    unitPrice: number;
    discountAmount?: number;
    taxAmount?: number;
    lineTotal: number;
    productVariant?: {
      id: string;
      name: string;
      barcode?: string;
      product?: { id: string; name: string };
    };
  }>;
  payments?: Array<{ amount: number; paymentMethod: string; referenceNumber?: string; notes?: string }>;
}

interface ReferenceRecord {
  id: string;
  code?: string;
  isDefault?: boolean;
  isBase?: boolean;
}

export interface CreateTransactionPayload {
  cart: Cart;
  payments: Payment[];
  customerId?: string;
  warehouseId: string;
  notes?: string;
}

const unwrap = <T>(data: unknown): T => {
  if (data && typeof data === 'object' && 'data' in data) {
    return (data as { data: T }).data;
  }
  return data as T;
};

const toArray = <T>(data: unknown): T[] => {
  const unwrapped = unwrap<T[] | { data?: T[] }>(data);
  if (Array.isArray(unwrapped)) return unwrapped;
  if (unwrapped && typeof unwrapped === 'object' && Array.isArray((unwrapped as { data?: T[] }).data)) {
    return (unwrapped as { data: T[] }).data;
  }
  return [];
};

const mapProduct = (product: BackendProduct): POSProduct => {
  const primaryImage = product.images?.find((image) => image.isPrimary)?.url ?? product.images?.[0]?.url;

  const mapped: POSProduct = {
    id: product.id,
    name: product.name,
    ...(product.barcode ? { barcode: product.barcode } : {}),
    ...(product.sku ? { sku: product.sku } : {}),
    price: Number(product.basePrice ?? 0),
    costPrice: Number(product.costPrice ?? 0),
    categoryId: product.categoryId,
    ...(product.category?.name ? { categoryName: product.category.name } : {}),
    ...(primaryImage ? { imageUrl: primaryImage } : {}),
    stockQuantity: Number(product.currentStock ?? 0),
    trackInventory: true,
  };

  if (product.variants?.length) {
    mapped.variants = product.variants.map((variant) => ({
      id: variant.id,
      productId: product.id,
      name: variant.name,
      ...(variant.barcode ? { barcode: variant.barcode } : {}),
      ...(variant.sku ? { sku: variant.sku } : {}),
      price: Number(variant.price ?? product.basePrice ?? 0) + Number(variant.priceModifier ?? 0),
      costPrice: Number(product.costPrice ?? 0),
      stockQuantity: Number(variant.stock ?? product.currentStock ?? 0),
      ...(primaryImage ? { imageUrl: primaryImage } : {}),
    }));
  }

  return mapped;
};

const mapInvoice = (invoice: BackendInvoice, fallbackCart?: Cart, fallbackPayments?: Payment[]): POSTransaction => ({
  id: invoice.id,
  invoiceNumber: invoice.invoiceNumber,
  cart:
    fallbackCart ??
    ({
      items:
        invoice.lines?.map((line) => ({
          id: line.id,
          productId: line.productVariant?.product?.id ?? line.productVariantId,
          variantId: line.productVariantId,
          name: line.productVariant?.product?.name ?? line.productVariant?.name ?? line.productVariantId,
          barcode: line.productVariant?.barcode,
          price: Number(line.unitPrice),
          quantity: Number(line.quantity),
          discount: Number(line.discountAmount ?? 0),
          discountType: 'fixed',
          taxRate: 0,
          taxAmount: Number(line.taxAmount ?? 0),
          subtotal: Number(line.unitPrice) * Number(line.quantity),
          total: Number(line.lineTotal),
        })) ?? [],
      subtotal: Number(invoice.totalAmount),
      totalDiscount: 0,
      totalTax: 0,
      grandTotal: Number(invoice.totalAmount),
    } as Cart),
  payments: fallbackPayments ?? [],
  totalPaid: (invoice.payments ?? fallbackPayments ?? []).reduce((sum, payment) => sum + Number(payment.amount), 0),
  change: 0,
  status: invoice.status === 'cancelled' ? 'cancelled' : invoice.paymentStatus === 'pending' ? 'pending' : 'completed',
  cashierId: invoice.cashierId ?? '',
  branchId: invoice.branchId,
  warehouseId: invoice.warehouseId,
  createdAt: invoice.createdAt,
});

const getFirstReferenceId = async (path: string, preferred?: (record: ReferenceRecord) => boolean): Promise<string> => {
  const response = await api.get(path);
  const records = toArray<ReferenceRecord>(response.data);
  const selected = preferred ? records.find(preferred) ?? records[0] : records[0];

  if (!selected?.id) {
    throw new Error(`لا توجد بيانات مرجعية كافية من ${path}`);
  }

  return selected.id;
};

export const getPOSProducts = async (filters?: POSFilters): Promise<POSProduct[]> => {
  if (filters?.barcode) {
    const product = await searchProductByBarcode(filters.barcode);
    return product ? [product] : [];
  }

  const params = new URLSearchParams();
  if (filters?.search) params.append('search', filters.search);
  if (filters?.categoryId) params.append('categoryId', filters.categoryId);

  const response = await api.get(`/products?${params.toString()}`);
  return toArray<BackendProduct>(response.data)
    .map(mapProduct)
    .filter((product) => (filters?.inStock ? product.stockQuantity > 0 : true));
};

export const searchProductByBarcode = async (barcode: string): Promise<POSProduct | null> => {
  try {
    const response = await api.get(`/products/lookup/${encodeURIComponent(barcode)}`);
    return mapProduct(unwrap<BackendProduct>(response.data));
  } catch {
    return null;
  }
};

export const createTransaction = async (payload: CreateTransactionPayload): Promise<POSTransaction> => {
  const [branchId, fallbackWarehouseId, currencyId] = await Promise.all([
    getFirstReferenceId('/branches'),
    payload.warehouseId && payload.warehouseId !== 'default'
      ? Promise.resolve(payload.warehouseId)
      : getFirstReferenceId('/warehouses'),
    getFirstReferenceId('/currencies', (currency) => Boolean(currency.isDefault || currency.isBase)),
  ]);

  const invoicePayload = {
    branchId,
    warehouseId: fallbackWarehouseId,
    currencyId,
    customerId: payload.customerId,
    status: 'confirmed',
    notes: payload.notes ?? payload.cart.notes,
    lines: payload.cart.items.map((item) => ({
      productVariantId: item.variantId ?? item.productId,
      quantity: item.quantity,
      unitPrice: item.price,
      discountAmount: item.discountType === 'fixed' ? item.discount : (item.price * item.quantity * item.discount) / 100,
      taxAmount: item.taxAmount,
      lineTotal: item.total,
    })),
  };

  const invoiceResponse = await api.post('/sales/invoices', invoicePayload);
  let invoice = unwrap<BackendInvoice>(invoiceResponse.data);

  for (const payment of payload.payments) {
    const paymentResponse = await api.post(`/sales/invoices/${invoice.id}/payments`, {
      currencyId,
      amount: payment.amount,
      paymentMethod: payment.methodType,
      referenceNumber: payment.reference,
      notes: payment.notes,
    });
    invoice = unwrap<BackendInvoice>(paymentResponse.data);
  }

  return mapInvoice(invoice, payload.cart, payload.payments);
};

export const getTransaction = async (id: string): Promise<POSTransaction> => {
  const response = await api.get(`/sales/invoices/${id}`);
  return mapInvoice(unwrap<BackendInvoice>(response.data));
};

export const getTransactions = async (_params?: {
  startDate?: string;
  endDate?: string;
  shiftId?: string;
  status?: string;
}): Promise<POSTransaction[]> => {
  void _params;
  const response = await api.get('/sales/invoices');
  return toArray<BackendInvoice>(response.data).map((invoice) => mapInvoice(invoice));
};

export const voidTransaction = async (id: string, reason: string): Promise<void> => {
  await api.delete(`/sales/invoices/${id}/cancel`, { data: { reason } });
};

export const openShift = async (openingCash: number): Promise<POSShift> => {
  const shift: POSShift = {
    id: crypto.randomUUID(),
    cashierId: '',
    cashierName: '',
    branchId: '',
    startTime: new Date().toISOString(),
    openingCash,
    totalSales: 0,
    totalTransactions: 0,
    status: 'open',
  };
  localStorage.setItem('zaytun_soft_current_shift', JSON.stringify(shift));
  return shift;
};

export const closeShift = async (shiftId: string, closingCash: number, notes?: string): Promise<POSShift> => {
  const current = await getCurrentShift();
  const shift: POSShift = {
    ...(current ?? (await openShift(0))),
    id: shiftId,
    endTime: new Date().toISOString(),
    closingCash,
    status: 'closed',
  };
  if (notes) shift.notes = notes;
  localStorage.removeItem('zaytun_soft_current_shift');
  return shift;
};

export const getCurrentShift = async (): Promise<POSShift | null> => {
  const stored = localStorage.getItem('zaytun_soft_current_shift');
  if (!stored) return null;
  return JSON.parse(stored) as POSShift;
};

export const getShiftReport = async (shiftId: string) => {
  const shift = (await getCurrentShift()) ?? (await openShift(0));
  return {
    shift: { ...shift, id: shiftId },
    transactions: await getTransactions(),
    summary: { totalCash: 0, totalCard: 0, totalOther: 0, totalRefunds: 0, netSales: 0 },
  };
};

export const getPOSSettings = async (): Promise<POSSettings> => {
  const [defaultWarehouseId, defaultCurrencyId] = await Promise.all([
    getFirstReferenceId('/warehouses'),
    getFirstReferenceId('/currencies', (currency) => Boolean(currency.isDefault || currency.isBase)),
  ]);

  return {
    defaultWarehouseId,
    defaultCurrencyId,
    defaultTaxRate: 0,
    allowNegativeStock: false,
    requireCustomer: false,
    printReceiptByDefault: true,
    receiptPrinterType: 'thermal',
    soundEnabled: true,
    quickAccessCategories: [],
    quickAccessProducts: [],
  };
};

export const updatePOSSettings = async (settings: Partial<POSSettings>): Promise<POSSettings> => ({
  ...(await getPOSSettings()),
  ...settings,
});

export const searchCustomers = async (query: string): Promise<QuickCustomer[]> => {
  const response = await api.get(`/customers/search?q=${encodeURIComponent(query)}`);
  return toArray<QuickCustomer>(response.data);
};

export const getFrequentCustomers = async (): Promise<QuickCustomer[]> => {
  const response = await api.get('/customers?limit=20');
  return toArray<QuickCustomer>(response.data);
};

export const printReceipt = async (transactionId: string): Promise<Blob> => {
  const response = await api.get(`/sales/invoices/${transactionId}/print`, { responseType: 'blob' });
  return response.data as Blob;
};

export const emailReceipt = async (_transactionId?: string, _email?: string): Promise<void> => {
  void _transactionId;
  void _email;
  throw new Error('إرسال الإيصال بالبريد خارج نطاق MVP الحالي.');
};

export const getPOSCategories = async (): Promise<{ id: string; name: string; productCount: number }[]> => {
  const response = await api.get('/categories');
  return toArray<{ id: string; name: string; productCount?: number }>(response.data).map((category) => ({
    id: category.id,
    name: category.name,
    productCount: category.productCount ?? 0,
  }));
};
