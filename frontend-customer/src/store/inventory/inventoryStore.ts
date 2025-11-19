import { create } from 'zustand';
import { inventoryApi } from '@/services/inventory';
import type {
  StockItem,
  StockMovement,
  InventoryStats,
  CreateStockItemDto,
  UpdateStockItemDto,
  AdjustStockDto,
  TransferStockDto,
} from '@/services/inventory';
import { toast } from 'react-hot-toast';

// Combined store type
type InventoryStore = {
  // State
  stockItems: StockItem[];
  stockMovements: StockMovement[];
  lowStockAlerts: StockItem[];
  inventoryStats: InventoryStats | null;
  selectedStockItem: StockItem | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchStockItems: (warehouseId?: string, lowStockOnly?: boolean) => Promise<void>;
  fetchStockItem: (id: string) => Promise<void>;
  createStockItem: (data: CreateStockItemDto) => Promise<void>;
  updateStockItem: (id: string, data: UpdateStockItemDto) => Promise<void>;
  adjustStock: (warehouseId: string, productVariantId: string, data: AdjustStockDto) => Promise<void>;
  fetchStockMovements: (warehouseId?: string, productVariantId?: string, limit?: number) => Promise<void>;
  fetchLowStockAlerts: () => Promise<void>;
  fetchInventoryStats: () => Promise<void>;
  transferStock: (data: TransferStockDto) => Promise<void>;
  getProductStockAcrossWarehouses: (productVariantId: string) => Promise<StockItem[]>;
  getWarehouseStock: (warehouseId: string) => Promise<StockItem[]>;

  // Utility actions
  setSelectedStockItem: (stockItem: StockItem | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
};

// Inventory store implementation
export const useInventoryStore = create<InventoryStore>()((set, get) => ({
  // Initial state
  stockItems: [],
  stockMovements: [],
  lowStockAlerts: [],
  inventoryStats: null,
  selectedStockItem: null,
  isLoading: false,
  error: null,

  // Actions
  fetchStockItems: async (warehouseId?: string, lowStockOnly?: boolean) => {
    try {
      set({ isLoading: true, error: null });

      const stockItems = await inventoryApi.getStockItems(warehouseId, lowStockOnly);

      set({
        stockItems,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'فشل في تحميل عناصر المخزون';
      set({
        error: message,
        isLoading: false,
      });
      toast.error(message);
      throw error;
    }
  },

  fetchStockItem: async (id: string) => {
    try {
      set({ isLoading: true, error: null });

      const stockItem = await inventoryApi.getStockItem(id);

      set({
        selectedStockItem: stockItem,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'فشل في تحميل عنصر المخزون';
      set({
        error: message,
        isLoading: false,
      });
      toast.error(message);
      throw error;
    }
  },

  createStockItem: async (data: CreateStockItemDto) => {
    try {
      set({ isLoading: true, error: null });

      const newStockItem = await inventoryApi.createStockItem(data);

      // Update the stock items list
      set(state => ({
        stockItems: [...state.stockItems, newStockItem],
        isLoading: false,
        error: null,
      }));

      toast.success('تم إنشاء عنصر المخزون بنجاح');
    } catch (error) {
      const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'فشل في إنشاء عنصر المخزون';
      set({
        error: message,
        isLoading: false,
      });
      toast.error(message);
      throw error;
    }
  },

  updateStockItem: async (id: string, data: UpdateStockItemDto) => {
    try {
      set({ isLoading: true, error: null });

      const updatedStockItem = await inventoryApi.updateStockItem(id, data);

      // Update the stock items list
      set(state => ({
        stockItems: state.stockItems.map(item =>
          item.id === id ? updatedStockItem : item
        ),
        selectedStockItem: state.selectedStockItem?.id === id ? updatedStockItem : state.selectedStockItem,
        isLoading: false,
        error: null,
      }));

      toast.success('تم تحديث عنصر المخزون بنجاح');
    } catch (error) {
      const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'فشل في تحديث عنصر المخزون';
      set({
        error: message,
        isLoading: false,
      });
      toast.error(message);
      throw error;
    }
  },

  adjustStock: async (warehouseId: string, productVariantId: string, data: AdjustStockDto) => {
    try {
      set({ isLoading: true, error: null });

      const updatedStockItem = await inventoryApi.adjustStock(warehouseId, productVariantId, data);

      // Update the stock items list
      set(state => ({
        stockItems: state.stockItems.map(item =>
          item.warehouseId === warehouseId && item.productVariantId === productVariantId
            ? updatedStockItem
            : item
        ),
        isLoading: false,
        error: null,
      }));

      toast.success('تم تعديل المخزون بنجاح');
    } catch (error) {
      const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'فشل في تعديل المخزون';
      set({
        error: message,
        isLoading: false,
      });
      toast.error(message);
      throw error;
    }
  },

  fetchStockMovements: async (warehouseId?: string, productVariantId?: string, limit?: number) => {
    try {
      set({ isLoading: true, error: null });

      const filters: { warehouseId?: string; productVariantId?: string; limit?: number } = {};
      if (warehouseId !== undefined) filters.warehouseId = warehouseId;
      if (productVariantId !== undefined) filters.productVariantId = productVariantId;
      if (limit !== undefined) filters.limit = limit;

      const stockMovements = await inventoryApi.getStockMovements(filters);

      set({
        stockMovements,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'فشل في تحميل حركات المخزون';
      set({
        error: message,
        isLoading: false,
      });
      toast.error(message);
      throw error;
    }
  },

  fetchLowStockAlerts: async () => {
    try {
      set({ isLoading: true, error: null });

      const lowStockAlerts = await inventoryApi.getLowStockAlerts();

      set({
        lowStockAlerts,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'فشل في تحميل تنبيهات المخزون المنخفض';
      set({
        error: message,
        isLoading: false,
      });
      toast.error(message);
      throw error;
    }
  },

  fetchInventoryStats: async () => {
    try {
      set({ isLoading: true, error: null });

      const inventoryStats = await inventoryApi.getInventoryStats();

      set({
        inventoryStats,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'فشل في تحميل إحصائيات المخزون';
      set({
        error: message,
        isLoading: false,
      });
      toast.error(message);
      throw error;
    }
  },

  transferStock: async (data: TransferStockDto) => {
    try {
      set({ isLoading: true, error: null });

      await inventoryApi.transferStock(data);

      // Refresh stock items to reflect the transfer
      await get().fetchStockItems();

      set({
        isLoading: false,
        error: null,
      });

      toast.success('تم نقل المخزون بنجاح');
    } catch (error) {
      const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'فشل في نقل المخزون';
      set({
        error: message,
        isLoading: false,
      });
      toast.error(message);
      throw error;
    }
  },

  getProductStockAcrossWarehouses: async (productVariantId: string) => {
    try {
      const stockItems = await inventoryApi.getProductStockAcrossWarehouses(productVariantId);
      return stockItems;
    } catch (error) {
      const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'فشل في تحميل مخزون المنتج';
      toast.error(message);
      throw error;
    }
  },

  getWarehouseStock: async (warehouseId: string) => {
    try {
      const stockItems = await inventoryApi.getWarehouseStock(warehouseId);
      return stockItems;
    } catch (error) {
      const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'فشل في تحميل مخزون المخزن';
      toast.error(message);
      throw error;
    }
  },

  // Utility actions
  setSelectedStockItem: (stockItem: StockItem | null) => {
    set({ selectedStockItem: stockItem });
  },

  setLoading: (loading: boolean) => {
    set({ isLoading: loading });
  },

  setError: (error: string | null) => {
    set({ error });
  },

  clearError: () => {
    set({ error: null });
  },
}));
