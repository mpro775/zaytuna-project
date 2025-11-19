import { api } from '../api';
import type { ApiResponse } from '../api';

// Warehouse types
export interface Warehouse {
  id: string;
  name: string;
  code: string;
  address?: string;
  phone?: string;
  email?: string;
  branchId: string;
  branch?: {
    id: string;
    name: string;
    code: string;
  };
  managerId?: string;
  manager?: {
    id: string;
    name: string;
    email: string;
  };
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  totalStock?: number;
  lowStockItems?: number;
  outOfStockItems?: number;
}

export interface StockItem {
  id: string;
  productId: string;
  product: {
    id: string;
    name: string;
    sku: string;
    barcode?: string;
  };
  quantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  lastUpdated: string;
}

export interface CreateWarehouseDto {
  name: string;
  code: string;
  address?: string;
  phone?: string;
  email?: string;
  branchId: string;
  managerId?: string;
  isActive?: boolean;
}

export interface UpdateWarehouseDto {
  name?: string;
  code?: string;
  address?: string;
  phone?: string;
  email?: string;
  managerId?: string;
  isActive?: boolean;
}

export interface TransferStockDto {
  fromWarehouseId: string;
  toWarehouseId: string;
  productVariantId: string;
  quantity: number;
  notes?: string;
}

export interface WarehouseFilters {
  page?: number;
  limit?: number;
  search?: string;
  branchId?: string;
  isActive?: boolean;
  sortBy?: 'name' | 'code' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

export interface WarehousesResponse {
  data: Warehouse[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface WarehouseStats {
  totalWarehouses: number;
  activeWarehouses: number;
  inactiveWarehouses: number;
  totalStockValue: number;
  lowStockAlerts: number;
  outOfStockAlerts: number;
}

// API functions
export const warehousesApi = {
  // Get all warehouses
  getWarehouses: async (filters: WarehouseFilters = {}): Promise<WarehousesResponse> => {
    const response = await api.get<ApiResponse<WarehousesResponse>>('/warehouses', { params: filters });
    return response.data.data;
  },

  // Get warehouse by ID
  getWarehouse: async (id: string): Promise<Warehouse> => {
    const response = await api.get<ApiResponse<Warehouse>>(`/warehouses/${id}`);
    return response.data.data;
  },

  // Create warehouse
  createWarehouse: async (data: CreateWarehouseDto): Promise<Warehouse> => {
    const response = await api.post<ApiResponse<Warehouse>>('/warehouses', data);
    return response.data.data;
  },

  // Update warehouse
  updateWarehouse: async (id: string, data: UpdateWarehouseDto): Promise<Warehouse> => {
    const response = await api.patch<ApiResponse<Warehouse>>(`/warehouses/${id}`, data);
    return response.data.data;
  },

  // Delete warehouse
  deleteWarehouse: async (id: string): Promise<void> => {
    await api.delete(`/warehouses/${id}`);
  },

  // Get warehouse statistics
  getWarehouseStats: async (): Promise<WarehouseStats> => {
    const response = await api.get<ApiResponse<WarehouseStats>>('/warehouses/stats');
    return response.data.data;
  },

  // Get stock items by warehouse
  getStockItemsByWarehouse: async (warehouseId: string): Promise<StockItem[]> => {
    const response = await api.get<ApiResponse<StockItem[]>>(`/warehouses/${warehouseId}/stock`);
    return response.data.data;
  },

  // Transfer stock between warehouses
  transferStock: async (data: TransferStockDto): Promise<void> => {
    await api.post('/warehouses/transfer-stock', data);
  },

  // Switch to warehouse (client-side utility)
  switchToWarehouse: async (warehouseId: string): Promise<void> => {
    // This would typically update user context/selected warehouse
    localStorage.setItem('selectedWarehouseId', warehouseId);
  },

  // Get current selected warehouse
  getCurrentWarehouse: (): string | null => {
    return localStorage.getItem('selectedWarehouseId');
  },
};
