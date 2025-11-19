// Sales Service Types - مرتبط بـ backend/src/modules/sales

export interface SalesInvoiceLine {
  id: string;
  salesInvoiceId: string;
  productVariantId: string;
  warehouseId: string;
  quantity: number;
  unitPrice: number;
  discountAmount: number;
  taxAmount: number;
  lineTotal: number;
  productVariant?: {
    id: string;
    name: string;
    sku: string;
    product?: {
      id: string;
      name: string;
    };
  };
  warehouse?: {
    id: string;
    name: string;
  };
}

export interface Payment {
  id: string;
  salesInvoiceId?: string;
  customerId?: string;
  currencyId: string;
  amount: number;
  paymentMethod: string;
  referenceNumber?: string;
  notes?: string;
  paymentDate: string;
  processedBy?: string;
  currency?: {
    id: string;
    code: string;
    name: string;
  };
}

export interface SalesInvoice {
  id: string;
  invoiceNumber: string;
  branchId: string;
  customerId?: string;
  cashierId: string;
  warehouseId: string;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  currencyId: string;
  taxId?: string;
  status: 'draft' | 'confirmed' | 'cancelled' | 'refunded';
  paymentStatus: 'pending' | 'partial' | 'paid' | 'refunded';
  notes?: string;
  dueDate?: string;
  createdAt: string;
  updatedAt: string;

  // Relations
  branch?: {
    id: string;
    name: string;
  };
  customer?: {
    id: string;
    name: string;
    phone?: string;
  };
  cashier?: {
    id: string;
    name: string;
  };
  warehouse?: {
    id: string;
    name: string;
  };
  currency?: {
    id: string;
    code: string;
    name: string;
  };
  tax?: {
    id: string;
    name: string;
    rate: number;
  };
  lines: SalesInvoiceLine[];
  payments: Payment[];
}

export interface CreateSalesInvoiceLineDto {
  productVariantId: string;
  quantity: number;
  unitPrice?: number;
  discountAmount?: number;
  taxAmount?: number;
  lineTotal?: number;
}

export interface CreateSalesInvoiceDto {
  invoiceNumber?: string;
  branchId: string;
  customerId?: string;
  warehouseId: string;
  currencyId: string;
  taxId?: string;
  lines: CreateSalesInvoiceLineDto[];
  status?: string;
  notes?: string;
  dueDate?: string;
}

export interface UpdateSalesInvoiceDto {
  invoiceNumber?: string;
  customerId?: string;
  warehouseId?: string;
  currencyId?: string;
  taxId?: string;
  status?: string;
  notes?: string;
  dueDate?: string;
}

export interface CreatePaymentDto {
  currencyId: string;
  amount: number;
  paymentMethod: string;
  referenceNumber?: string;
  notes?: string;
}

export interface SalesStats {
  totalInvoices: number;
  totalRevenue: number;
  totalPaid: number;
  totalPending: number;
  invoiceCountByStatus: Record<string, number>;
  revenueByPaymentMethod: Record<string, number>;
}

export interface SalesFilters {
  branchId?: string;
  customerId?: string;
  status?: string;
  paymentStatus?: string;
  limit?: number;
  startDate?: string;
  endDate?: string;
}

export interface SalesApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
