import { api } from '../api';
import type { ApiResponse } from '../api';

// Supplier types
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
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  // Statistics fields
  totalPurchases?: number;
  totalPaid?: number;
  outstandingBalance?: number;
  lastPurchaseDate?: string;
  productsCount?: number;
}

export interface CreateSupplierDto {
  name: string;
  contactName?: string;
  phone?: string;
  email?: string;
  address?: string;
  taxNumber?: string;
  paymentTerms?: string;
  isActive?: boolean;
}

export interface UpdateSupplierDto {
  name?: string;
  contactName?: string;
  phone?: string;
  email?: string;
  taxNumber?: string;
  paymentTerms?: string;
  isActive?: boolean;
}

export interface SupplierFilters {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
  paymentTerms?: string;
  hasOutstandingBalance?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface SuppliersResponse {
  data: Supplier[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface SupplierStats {
  totalSuppliers: number;
  activeSuppliers: number;
  inactiveSuppliers: number;
  totalOutstandingBalance: number;
  averagePaymentTerms: string;
  topSuppliersByVolume: Supplier[];
}

// API functions
export const suppliersApi = {
  // Get all suppliers
  getSuppliers: async (filters: SupplierFilters = {}): Promise<SuppliersResponse> => {
    const response = await api.get<ApiResponse<SuppliersResponse>>('/purchasing/suppliers', { params: filters });
    return response.data.data;
  },

  // Get supplier by ID
  getSupplier: async (id: string): Promise<Supplier> => {
    const response = await api.get<ApiResponse<Supplier>>(`/purchasing/suppliers/${id}`);
    return response.data.data;
  },

  // Create supplier
  createSupplier: async (data: CreateSupplierDto): Promise<Supplier> => {
    const response = await api.post<ApiResponse<Supplier>>('/purchasing/suppliers', data);
    return response.data.data;
  },

  // Update supplier
  updateSupplier: async (id: string, data: UpdateSupplierDto): Promise<Supplier> => {
    const response = await api.patch<ApiResponse<Supplier>>(`/purchasing/suppliers/${id}`, data);
    return response.data.data;
  },

  // Delete supplier
  deleteSupplier: async (id: string): Promise<void> => {
    await api.delete(`/purchasing/suppliers/${id}`);
  },

  // Get supplier statistics
  getSupplierStats: async (): Promise<SupplierStats> => {
    const response = await api.get<ApiResponse<SupplierStats>>('/purchasing/suppliers/stats/overview');
    return response.data.data;
  },

  // Get supplier purchase history
  getSupplierPurchaseHistory: async (supplierId: string): Promise<any[]> => {
    const response = await api.get<ApiResponse<any[]>>(`/purchasing/suppliers/${supplierId}/purchases`);
    return response.data.data;
  },

  // Get suppliers with outstanding balance
  getSuppliersWithOutstandingBalance: async (): Promise<Supplier[]> => {
    const response = await api.get<ApiResponse<Supplier[]>>('/purchasing/suppliers/outstanding-balance');
    return response.data.data;
  },

  // Export suppliers
  exportSuppliers: async (filters?: SupplierFilters): Promise<Blob> => {
    const response = await api.get('/purchasing/suppliers/export/csv', {
      params: filters,
      responseType: 'blob',
    });
    return response.data;
  },
};
