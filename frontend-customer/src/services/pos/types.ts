// أنواع نظام POS

export interface POSProduct {
  id: string;
  name: string;
  barcode?: string;
  sku?: string;
  price: number;
  costPrice?: number;
  categoryId: string;
  categoryName?: string;
  imageUrl?: string;
  stockQuantity: number;
  trackInventory: boolean;
  taxRate?: number;
  variants?: POSProductVariant[];
}

export interface POSProductVariant {
  id: string;
  productId: string;
  name: string;
  barcode?: string;
  sku?: string;
  price: number;
  costPrice?: number;
  stockQuantity: number;
  attributes?: Record<string, string>;
  imageUrl?: string;
}

export interface CartItem {
  id: string; // unique cart item id
  productId: string;
  variantId?: string;
  name: string;
  barcode?: string;
  price: number;
  quantity: number;
  discount: number; // percentage or fixed
  discountType: 'percentage' | 'fixed';
  taxRate: number;
  taxAmount: number;
  subtotal: number;
  total: number;
  notes?: string;
}

export interface Cart {
  items: CartItem[];
  customerId?: string;
  customerName?: string;
  subtotal: number;
  totalDiscount: number;
  totalTax: number;
  grandTotal: number;
  notes?: string;
}

export interface PaymentMethod {
  id: string;
  name: string;
  nameAr: string;
  icon: string;
  type: 'cash' | 'card' | 'bank_transfer' | 'digital_wallet' | 'credit';
  isActive: boolean;
}

export interface Payment {
  methodId: string;
  methodType: PaymentMethod['type'];
  amount: number;
  reference?: string;
  notes?: string;
}

export interface POSTransaction {
  id: string;
  invoiceNumber: string;
  cart: Cart;
  payments: Payment[];
  totalPaid: number;
  change: number;
  status: 'completed' | 'pending' | 'cancelled' | 'refunded';
  cashierId: string;
  branchId: string;
  warehouseId: string;
  createdAt: string;
}

export interface POSShift {
  id: string;
  cashierId: string;
  cashierName: string;
  branchId: string;
  startTime: string;
  endTime?: string;
  openingCash: number;
  closingCash?: number;
  expectedCash?: number;
  cashDifference?: number;
  totalSales: number;
  totalTransactions: number;
  status: 'open' | 'closed';
  notes?: string;
}

export interface POSSettings {
  defaultWarehouseId: string;
  defaultCurrencyId: string;
  defaultTaxRate: number;
  allowNegativeStock: boolean;
  requireCustomer: boolean;
  printReceiptByDefault: boolean;
  receiptPrinterType: 'thermal' | 'a4';
  soundEnabled: boolean;
  quickAccessCategories: string[];
  quickAccessProducts: string[];
}

export interface POSFilters {
  search?: string;
  categoryId?: string;
  barcode?: string;
  inStock?: boolean;
}

// Discount Types
export interface Discount {
  id: string;
  name: string;
  type: 'percentage' | 'fixed';
  value: number;
  applicableTo: 'item' | 'cart';
  minPurchase?: number;
  maxDiscount?: number;
  validFrom?: string;
  validTo?: string;
  isActive: boolean;
}

// Customer for Quick Selection
export interface QuickCustomer {
  id: string;
  name: string;
  phone?: string;
  loyaltyPoints: number;
  loyaltyTier: string;
  creditLimit?: number;
  currentBalance?: number;
}
