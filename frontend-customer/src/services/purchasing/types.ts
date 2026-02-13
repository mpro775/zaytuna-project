// أنواع نظام المشتريات

export interface Supplier {
  id: string;
  name: string;
  contactName?: string;
  phone?: string;
  email?: string;
  address?: string;
  taxNumber?: string;
  paymentTerms?: string;
  isActive: boolean;
}

export interface PurchaseOrder {
  id: string;
  orderNumber: string;
  supplierId: string;
  supplier?: Supplier;
  warehouseId: string;
  warehouse?: { id: string; name: string };
  requestedBy: string;
  requester?: { id: string; username: string };
  expectedDate?: string;
  notes?: string;
  status: 'draft' | 'approved' | 'ordered' | 'received' | 'cancelled';
  lines: PurchaseOrderLine[];
  createdAt: string;
  updatedAt: string;
}

export interface PurchaseOrderLine {
  id: string;
  purchaseOrderId: string;
  productId: string;
  product?: {
    id: string;
    name: string;
    sku?: string;
    barcode?: string;
  };
  quantity: number;
  unitCost: number;
  receivedQuantity: number;
  lineTotal: number;
}

export interface PurchaseInvoice {
  id: string;
  invoiceNumber: string;
  supplierId: string;
  supplier?: Supplier;
  warehouseId: string;
  warehouse?: { id: string; name: string };
  receivedBy: string;
  receiver?: { id: string; username: string };
  purchaseOrderId?: string;
  purchaseOrder?: PurchaseOrder;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  currencyId: string;
  currency?: { id: string; code: string; symbol: string };
  invoiceDate: string;
  dueDate?: string;
  status: 'draft' | 'received' | 'approved' | 'paid' | 'cancelled';
  paymentStatus: 'pending' | 'partial' | 'paid';
  notes?: string;
  lines: PurchaseInvoiceLine[];
  payments: PurchasePayment[];
  createdAt: string;
  updatedAt: string;
}

export interface PurchaseInvoiceLine {
  id: string;
  purchaseInvoiceId: string;
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
  unitCost: number;
  discountAmount: number;
  taxAmount: number;
  lineTotal: number;
}

export interface PurchasePayment {
  id: string;
  purchaseInvoiceId: string;
  supplierId: string;
  currencyId: string;
  amount: number;
  paymentMethod: 'cash' | 'bank_transfer' | 'check' | 'credit_card';
  referenceNumber?: string;
  notes?: string;
  paymentDate: string;
  processedBy?: string;
}

export interface PurchasingFilters {
  search?: string;
  supplierId?: string;
  warehouseId?: string;
  status?: string;
  paymentStatus?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface CreatePurchaseOrderDto {
  supplierId: string;
  warehouseId: string;
  expectedDate?: string;
  notes?: string;
  lines: {
    productId: string;
    quantity: number;
    unitCost: number;
  }[];
}

export interface CreatePurchaseInvoiceDto {
  supplierId: string;
  warehouseId: string;
  purchaseOrderId?: string;
  invoiceDate: string;
  dueDate?: string;
  currencyId: string;
  notes?: string;
  lines: {
    productVariantId: string;
    quantity: number;
    unitCost: number;
    discountAmount?: number;
    taxAmount?: number;
  }[];
}

export interface CreatePurchasePaymentDto {
  purchaseInvoiceId: string;
  amount: number;
  paymentMethod: PurchasePayment['paymentMethod'];
  referenceNumber?: string;
  notes?: string;
  paymentDate: string;
}
