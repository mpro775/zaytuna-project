import { api } from '../api';
import type { ApiResponse } from '../api';

// Product types
export interface Product {
  id: string;
  name: string;
  description?: string;
  barcode?: string;
  sku: string;
  categoryId: string;
  category?: Category;
  basePrice: number;
  costPrice: number;
  reorderPoint: number;
  currentStock: number;
  unit: string;
  images: ProductImage[];
  variants: ProductVariant[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  branchId: string;
}

export interface ProductImage {
  id: string;
  url: string;
  alt: string;
  isPrimary: boolean;
  sortOrder: number;
}

export interface ProductVariant {
  id: string;
  name: string;
  value: string;
  priceModifier: number;
  stock: number;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  parentId?: string;
  children?: Category[];
  isActive: boolean;
  sortOrder: number;
  image?: string;
}

export interface CreateProductDto {
  name: string;
  description?: string;
  barcode?: string;
  sku: string;
  categoryId: string;
  basePrice: number;
  costPrice: number;
  reorderPoint: number;
  unit: string;
  isActive?: boolean;
  branchId: string;
  variants?: Omit<ProductVariant, 'id'>[];
}

export interface UpdateProductDto {
  name?: string;
  description?: string;
  barcode?: string;
  sku?: string;
  categoryId?: string;
  basePrice?: number;
  costPrice?: number;
  reorderPoint?: number;
  unit?: string;
  isActive?: boolean;
  variants?: ProductVariant[];
}

export interface ProductFilters {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: string;
  isActive?: boolean;
  branchId?: string;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: 'name' | 'price' | 'createdAt' | 'stock';
  sortOrder?: 'asc' | 'desc';
}

export interface ProductsResponse {
  data: Product[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreateCategoryDto {
  name: string;
  description?: string;
  parentId?: string;
  sortOrder?: number;
  image?: File;
}

export interface UpdateCategoryDto {
  name?: string;
  description?: string;
  parentId?: string;
  sortOrder?: number;
  isActive?: boolean;
  image?: File;
}

// Products API service
export const productsApi = {
  // Products CRUD operations

  /**
   * الحصول على قائمة المنتجات مع الفلاتر
   */
  async getProducts(filters?: ProductFilters): Promise<ProductsResponse> {
    const params = new URLSearchParams();

    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.search) params.append('search', filters.search);
    if (filters?.categoryId) params.append('categoryId', filters.categoryId);
    if (filters?.isActive !== undefined) params.append('isActive', filters.isActive.toString());
    if (filters?.branchId) params.append('branchId', filters.branchId);
    if (filters?.minPrice !== undefined) params.append('minPrice', filters.minPrice.toString());
    if (filters?.maxPrice !== undefined) params.append('maxPrice', filters.maxPrice.toString());
    if (filters?.sortBy) params.append('sortBy', filters.sortBy);
    if (filters?.sortOrder) params.append('sortOrder', filters.sortOrder);

    const response = await api.get<ApiResponse<ProductsResponse>>(`/products?${params}`);
    return response.data.data;
  },

  /**
   * الحصول على منتج بالمعرف
   */
  async getProduct(id: string): Promise<Product> {
    const response = await api.get<ApiResponse<Product>>(`/products/${id}`);
    return response.data.data;
  },

  /**
   * إنشاء منتج جديد
   */
  async createProduct(data: CreateProductDto): Promise<Product> {
    const response = await api.post<ApiResponse<Product>>('/products', data);
    return response.data.data;
  },

  /**
   * تحديث منتج
   */
  async updateProduct(id: string, data: UpdateProductDto): Promise<Product> {
    const response = await api.patch<ApiResponse<Product>>(`/products/${id}`, data);
    return response.data.data;
  },

  /**
   * حذف منتج
   */
  async deleteProduct(id: string): Promise<{ message: string }> {
    const response = await api.delete<ApiResponse<{ message: string }>>(`/products/${id}`);
    return response.data.data;
  },

  /**
   * حذف منتجات متعددة
   */
  async bulkDeleteProducts(ids: string[]): Promise<{ message: string; deletedCount: number }> {
    const response = await api.delete<ApiResponse<{ message: string; deletedCount: number }>>('/products/bulk', {
      data: { ids },
    });
    return response.data.data;
  },

  // Image management

  /**
   * رفع صورة للمنتج
   */
  async uploadProductImage(productId: string, file: File, isPrimary: boolean = false): Promise<ProductImage> {
    const formData = new FormData();
    formData.append('image', file);
    formData.append('isPrimary', isPrimary.toString());

    const response = await api.post<ApiResponse<ProductImage>>(`/products/${productId}/images`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.data;
  },

  /**
   * حذف صورة منتج
   */
  async deleteProductImage(productId: string, imageId: string): Promise<{ message: string }> {
    const response = await api.delete<ApiResponse<{ message: string }>>(`/products/${productId}/images/${imageId}`);
    return response.data.data;
  },

  /**
   * تحديث ترتيب الصور
   */
  async updateImageOrder(productId: string, imageOrder: { id: string; sortOrder: number }[]): Promise<{ message: string }> {
    const response = await api.patch<ApiResponse<{ message: string }>>(`/products/${productId}/images/order`, {
      imageOrder,
    });
    return response.data.data;
  },

  /**
   * تعيين الصورة الرئيسية
   */
  async setPrimaryImage(productId: string, imageId: string): Promise<{ message: string }> {
    const response = await api.patch<ApiResponse<{ message: string }>>(`/products/${productId}/images/${imageId}/primary`);
    return response.data.data;
  },

  // Categories management

  /**
   * الحصول على جميع الفئات
   */
  async getCategories(includeInactive: boolean = false): Promise<Category[]> {
    const params = new URLSearchParams();
    if (includeInactive) params.append('includeInactive', 'true');

    const response = await api.get<ApiResponse<Category[]>>(`/products/categories?${params}`);
    return response.data.data;
  },

  /**
   * الحصول على فئة بالمعرف
   */
  async getCategory(id: string): Promise<Category> {
    const response = await api.get<ApiResponse<Category>>(`/products/categories/${id}`);
    return response.data.data;
  },

  /**
   * إنشاء فئة جديدة
   */
  async createCategory(data: CreateCategoryDto): Promise<Category> {
    const formData = new FormData();
    formData.append('name', data.name);
    if (data.description) formData.append('description', data.description);
    if (data.parentId) formData.append('parentId', data.parentId);
    if (data.sortOrder !== undefined) formData.append('sortOrder', data.sortOrder.toString());
    if (data.image) formData.append('image', data.image);

    const response = await api.post<ApiResponse<Category>>('/products/categories', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.data;
  },

  /**
   * تحديث فئة
   */
  async updateCategory(id: string, data: UpdateCategoryDto): Promise<Category> {
    const formData = new FormData();
    if (data.name) formData.append('name', data.name);
    if (data.description) formData.append('description', data.description);
    if (data.parentId !== undefined) formData.append('parentId', data.parentId);
    if (data.sortOrder !== undefined) formData.append('sortOrder', data.sortOrder.toString());
    if (data.isActive !== undefined) formData.append('isActive', data.isActive.toString());
    if (data.image) formData.append('image', data.image);

    const response = await api.patch<ApiResponse<Category>>(`/products/categories/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.data;
  },

  /**
   * حذف فئة
   */
  async deleteCategory(id: string): Promise<{ message: string }> {
    const response = await api.delete<ApiResponse<{ message: string }>>(`/products/categories/${id}`);
    return response.data.data;
  },

  // Stock management

  /**
   * تحديث مخزون منتج
   */
  async updateStock(productId: string, newStock: number, reason?: string): Promise<{ message: string }> {
    const response = await api.patch<ApiResponse<{ message: string }>>(`/products/${productId}/stock`, {
      newStock,
      reason,
    });
    return response.data.data;
  },

  /**
   * الحصول على حركات المخزون لمنتج
   */
  async getStockMovements(productId: string, page: number = 1, limit: number = 20): Promise<any[]> {
    const response = await api.get<ApiResponse<any[]>>(`/products/${productId}/stock-movements?page=${page}&limit=${limit}`);
    return response.data.data;
  },

  // Variants management

  /**
   * إضافة متغير للمنتج
   */
  async addProductVariant(productId: string, variant: Omit<ProductVariant, 'id'>): Promise<ProductVariant> {
    const response = await api.post<ApiResponse<ProductVariant>>(`/products/${productId}/variants`, variant);
    return response.data.data;
  },

  /**
   * تحديث متغير منتج
   */
  async updateProductVariant(productId: string, variantId: string, data: Partial<ProductVariant>): Promise<ProductVariant> {
    const response = await api.patch<ApiResponse<ProductVariant>>(`/products/${productId}/variants/${variantId}`, data);
    return response.data.data;
  },

  /**
   * حذف متغير منتج
   */
  async deleteProductVariant(productId: string, variantId: string): Promise<{ message: string }> {
    const response = await api.delete<ApiResponse<{ message: string }>>(`/products/${productId}/variants/${variantId}`);
    return response.data.data;
  },

  // Bulk operations

  /**
   * تحديث حالة منتجات متعددة
   */
  async bulkUpdateStatus(ids: string[], isActive: boolean): Promise<{ message: string; updatedCount: number }> {
    const response = await api.patch<ApiResponse<{ message: string; updatedCount: number }>>('/products/bulk/status', {
      ids,
      isActive,
    });
    return response.data.data;
  },

  /**
   * نقل منتجات لفئة أخرى
   */
  async bulkUpdateCategory(ids: string[], categoryId: string): Promise<{ message: string; updatedCount: number }> {
    const response = await api.patch<ApiResponse<{ message: string; updatedCount: number }>>('/products/bulk/category', {
      ids,
      categoryId,
    });
    return response.data.data;
  },

  // Search and suggestions

  /**
   * البحث السريع في المنتجات
   */
  async searchProducts(query: string, limit: number = 10): Promise<Product[]> {
    const response = await api.get<ApiResponse<Product[]>>(`/products/search?q=${encodeURIComponent(query)}&limit=${limit}`);
    return response.data.data;
  },

  /**
   * الحصول على اقتراحات البحث
   */
  async getSearchSuggestions(query: string): Promise<string[]> {
    const response = await api.get<ApiResponse<string[]>>(`/products/suggestions?q=${encodeURIComponent(query)}`);
    return response.data.data;
  },

  // Import/Export

  /**
   * تصدير المنتجات إلى CSV
   */
  async exportProducts(filters?: ProductFilters): Promise<Blob> {
    const params = new URLSearchParams();

    if (filters?.search) params.append('search', filters.search);
    if (filters?.categoryId) params.append('categoryId', filters.categoryId);
    if (filters?.isActive !== undefined) params.append('isActive', filters.isActive.toString());
    if (filters?.branchId) params.append('branchId', filters.branchId);

    const response = await api.get(`/products/export?${params}`, {
      responseType: 'blob',
    });

    return response.data;
  },

  /**
   * استيراد المنتجات من CSV
   */
  async importProducts(file: File): Promise<{ message: string; imported: number; errors: string[] }> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post<ApiResponse<{ message: string; imported: number; errors: string[] }>>('/products/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data.data;
  },
};

export default productsApi;
