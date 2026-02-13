// أنواع نظام المرتجعات

export interface Return {
  id: string;
  returnNumber: string;
  salesInvoiceId: string;
  salesInvoice?: {
    id: string;
    invoiceNumber: string;
    totalAmount: number;
  };
  customerId?: string;
  customer?: {
    id: string;
    name: string;
    phone?: string;
  };
  cashierId: string;
  cashier?: {
    id: string;
    username: string;
  };
  warehouseId: string;
  warehouse?: {
    id: string;
    name: string;
  };
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  currencyId: string;
  currency?: {
    id: string;
    code: string;
    symbol?: string;
  };
  reason: string;
  status: 'draft' | 'confirmed' | 'cancelled' | 'refunded';
  refundStatus: 'pending' | 'partial' | 'refunded';
  notes?: string;
  lines: ReturnLine[];
  creditNotes: CreditNote[];
  createdAt: string;
  updatedAt: string;
}

export interface ReturnLine {
  id: string;
  returnId: string;
  productVariantId: string;
  productVariant?: {
    id: string;
    name: string;
    sku?: string;
    barcode?: string;
    product?: { id: string; name: string };
  };
  warehouseId: string;
  quantity: number;
  unitPrice: number;
  discountAmount: number;
  taxAmount: number;
  lineTotal: number;
  reason?: string;
}

export interface CreditNote {
  id: string;
  creditNoteNumber: string;
  returnId: string;
  return?: Return;
  customerId?: string;
  customer?: {
    id: string;
    name: string;
  };
  currencyId: string;
  currency?: {
    id: string;
    code: string;
  };
  amount: number;
  remainingAmount: number;
  status: 'active' | 'used' | 'expired' | 'cancelled';
  expiryDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReturnsFilters {
  search?: string;
  customerId?: string;
  salesInvoiceId?: string;
  status?: string;
  refundStatus?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface CreditNotesFilters {
  search?: string;
  customerId?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export interface CreateReturnDto {
  salesInvoiceId: string;
  customerId?: string;
  warehouseId: string;
  reason: string;
  notes?: string;
  lines: {
    productVariantId: string;
    quantity: number;
    unitPrice: number;
    reason?: string;
  }[];
}
