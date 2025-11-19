import { api } from '../api';

// Inventory types
export interface Warehouse {
  id: string;
  name: string;
  code: string;
  location?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProductVariant {
  id: string;
  name: string;
  sku?: string;
  barcode?: string;
  product: {
    id: string;
    name: string;
  };
}

export interface StockItem extends Record<string, unknown> {
  id: string;
  warehouseId: string;
  productVariantId: string;
  quantity: number;
  minStock: number;
  maxStock: number;
  warehouse: Warehouse;
  productVariant: ProductVariant;
  isLowStock: boolean;
  isOverStock: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface StockMovement extends Record<string, unknown> {
  id: string;
  warehouseId: string;
  productVariantId: string;
  movementType: string;
  quantity: number;
  referenceType?: string;
  referenceId?: string;
  reason?: string;
  performedBy?: string;
  warehouse: Warehouse;
  productVariant: ProductVariant;
  createdAt: string;
}

export interface InventoryStats {
  totalItems: number;
  totalValue: number;
  lowStockItems: number;
  outOfStockItems: number;
  overStockItems: number;
  totalMovements: number;
}

export interface CreateStockItemDto {
  warehouseId: string;
  productVariantId: string;
  quantity?: number;
  minStock?: number;
  maxStock?: number;
}

export interface UpdateStockItemDto {
  minStock?: number;
  maxStock?: number;
}

export interface AdjustStockDto {
  quantity: number;
  movementType?: string;
  referenceType?: string;
  referenceId?: string;
  reason?: string;
}

export interface TransferStockDto {
  fromWarehouseId: string;
  toWarehouseId: string;
  productVariantId: string;
  quantity: number;
  notes?: string;
}

export interface StockMovementsFilters {
  warehouseId?: string;
  productVariantId?: string;
  limit?: number;
}

// Inventory API service
export const inventoryApi = {
  // Stock Items CRUD operations

  /**
   * الحصول على عناصر المخزون
   */
  async getStockItems(warehouseId?: string, lowStockOnly?: boolean): Promise<StockItem[]> {
    const params = new URLSearchParams();
    if (warehouseId) params.append('warehouseId', warehouseId);
    if (lowStockOnly !== undefined) params.append('lowStockOnly', lowStockOnly.toString());

    const response = await api.get(`/inventory/stock-items?${params}`);
    return response.data.data;
  },

  /**
   * الحصول على عنصر مخزون بالمعرف
   */
  async getStockItem(id: string): Promise<StockItem> {
    const response = await api.get(`/inventory/stock-items/${id}`);
    return response.data.data;
  },

  /**
   * إنشاء عنصر مخزون جديد
   */
  async createStockItem(data: CreateStockItemDto): Promise<StockItem> {
    const response = await api.post('/inventory/stock-items', data);
    return response.data.data;
  },

  /**
   * تحديث عنصر مخزون
   */
  async updateStockItem(id: string, data: UpdateStockItemDto): Promise<StockItem> {
    const response = await api.patch(`/inventory/stock-items/${id}`, data);
    return response.data.data;
  },

  /**
   * تعديل كمية المخزون
   */
  async adjustStock(
    warehouseId: string,
    productVariantId: string,
    data: AdjustStockDto
  ): Promise<StockItem> {
    const response = await api.post(`/inventory/stock-items/${warehouseId}/${productVariantId}/adjust`, data);
    return response.data.data;
  },

  // Stock Movements

  /**
   * الحصول على حركات المخزون
   */
  async getStockMovements(filters?: StockMovementsFilters): Promise<StockMovement[]> {
    const params = new URLSearchParams();
    if (filters?.warehouseId) params.append('warehouseId', filters.warehouseId);
    if (filters?.productVariantId) params.append('productVariantId', filters.productVariantId);
    if (filters?.limit) params.append('limit', filters.limit.toString());

    const response = await api.get(`/inventory/movements?${params}`);
    return response.data.data;
  },

  // Alerts and Stats

  /**
   * الحصول على تنبيهات المخزون المنخفض
   */
  async getLowStockAlerts(): Promise<StockItem[]> {
    const response = await api.get('/inventory/alerts/low-stock');
    return response.data.data;
  },

  /**
   * الحصول على إحصائيات المخزون
   */
  async getInventoryStats(): Promise<InventoryStats> {
    const response = await api.get('/inventory/stats');
    return response.data.data;
  },

  // Warehouse Stock

  /**
   * الحصول على مخزون منتج في جميع المخازن
   */
  async getProductStockAcrossWarehouses(productVariantId: string): Promise<StockItem[]> {
    const response = await api.get(`/inventory/products/${productVariantId}/stock`);
    return response.data.data;
  },

  /**
   * الحصول على مخزون مخزن محدد
   */
  async getWarehouseStock(warehouseId: string): Promise<StockItem[]> {
    const response = await api.get(`/inventory/warehouses/${warehouseId}/stock`);
    return response.data.data;
  },

  // Stock Transfers

  /**
   * نقل المخزون بين المخازن
   */
  async transferStock(data: TransferStockDto): Promise<{ message: string }> {
    const response = await api.post('/warehouses/transfer-stock', data);
    return response.data.data;
  },
};

export default inventoryApi;
