import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { productsApi } from '@/services/products';
import type {
    ProductFilters,
  UpdateProductDto,
  Category,
  UpdateCategoryDto,
} from '@/services/products';
import { toast } from 'react-hot-toast';

export interface UseProductsOptions {
  filters?: ProductFilters;
  autoFetch?: boolean;
}

export const useProducts = (options: UseProductsOptions = {}) => {
  const { filters = {}, autoFetch = true } = options;
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  // Local state for filters
  const [currentFilters, setCurrentFilters] = useState<ProductFilters>(filters);

  // Products query
  const {
    data: productsData,
    isLoading,
    error,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['products', currentFilters],
    queryFn: () => productsApi.getProducts(currentFilters),
    enabled: autoFetch,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Categories query
  const {
    data: categoriesData,
    isLoading: isLoadingCategories,
  } = useQuery({
    queryKey: ['categories'],
    queryFn: () => productsApi.getCategories(),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  // Create product mutation
  const createMutation = useMutation({
    mutationFn: productsApi.createProduct,
    onSuccess: (newProduct) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success(t('products.messages.created', 'تم إنشاء المنتج بنجاح'));
      return newProduct;
    },
    onError: (error: Error) => {
      const message = error.message || t('products.errors.createFailed', 'فشل في إنشاء المنتج');
      toast.error(message);
    },
  });

  // Update product mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateProductDto }) =>
      productsApi.updateProduct(id, data),
    onSuccess: (updatedProduct) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['product', updatedProduct.id] });
      toast.success(t('products.messages.updated', 'تم تحديث المنتج بنجاح'));
      return updatedProduct;
    },
    onError: (error: Error) => {
      const message = error.message || t('products.errors.updateFailed', 'فشل في تحديث المنتج');
      toast.error(message);
    },
  });

  // Delete product mutation
  const deleteMutation = useMutation({
    mutationFn: productsApi.deleteProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success(t('products.messages.deleted', 'تم حذف المنتج بنجاح'));
    },
    onError: (error: Error) => {
      const message = error.message || t('products.errors.deleteFailed', 'فشل في حذف المنتج');
      toast.error(message);
    },
  });

  // Bulk delete mutation
  const bulkDeleteMutation = useMutation({
    mutationFn: productsApi.bulkDeleteProducts,
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success(t('products.messages.bulkDeleted', `تم حذف ${result.deletedCount} منتج بنجاح`));
    },
    onError: (error: Error) => {
      const message = error.message || t('products.errors.bulkDeleteFailed', 'فشل في حذف المنتجات');
      toast.error(message);
    },
  });

  // Upload image mutation
  const uploadImageMutation = useMutation({
    mutationFn: ({ productId, file, isPrimary }: { productId: string; file: File; isPrimary?: boolean }) =>
      productsApi.uploadProductImage(productId, file, isPrimary),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success(t('products.messages.imageUploaded', 'تم رفع الصورة بنجاح'));
    },
    onError: (error: Error) => {
      const message = error.message || t('products.errors.imageUploadFailed', 'فشل في رفع الصورة');
      toast.error(message);
    },
  });

  // Delete image mutation
  const deleteImageMutation = useMutation({
    mutationFn: ({ productId, imageId }: { productId: string; imageId: string }) =>
      productsApi.deleteProductImage(productId, imageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success(t('products.messages.imageDeleted', 'تم حذف الصورة بنجاح'));
    },
      onError: (error: Error) => {
      const message = error.message || t('products.errors.imageDeleteFailed', 'فشل في حذف الصورة');
      toast.error(message);
    },
  });

  // Create category mutation
  const createCategoryMutation = useMutation({
    mutationFn: productsApi.createCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success(t('products.messages.categoryCreated', 'تم إنشاء الفئة بنجاح'));
    },
    onError: (error: Error) => {
      const message = error.message || t('products.errors.categoryCreateFailed', 'فشل في إنشاء الفئة');
      toast.error(message);
    },
  });

  // Update category mutation
  const updateCategoryMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCategoryDto }) =>
      productsApi.updateCategory(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success(t('products.messages.categoryUpdated', 'تم تحديث الفئة بنجاح'));
    },
        onError: (error: Error) => {
      const message = error.message || t('products.errors.categoryUpdateFailed', 'فشل في تحديث الفئة');
      toast.error(message);
    },
  });

  // Delete category mutation
  const deleteCategoryMutation = useMutation({
    mutationFn: productsApi.deleteCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success(t('products.messages.categoryDeleted', 'تم حذف الفئة بنجاح'));
    },
    onError: (error: Error) => {
      const message = error.message || t('products.errors.categoryDeleteFailed', 'فشل في حذف الفئة');
      toast.error(message);
    },
  });

  // Computed values
  const products = useMemo(() => productsData?.data || [], [productsData?.data]);
  const totalProducts = productsData?.total || 0;
  const categories = useMemo(() => categoriesData || [], [categoriesData]);

  // Filter categories by parent
  const categoryTree = useMemo(() => {
    const buildTree = (parentId?: string): Category[] => {
      return categories
        .filter(cat => cat.parentId === parentId)
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map(cat => ({
          ...cat,
          children: buildTree(cat.id),
        }));
    };
    return buildTree();
  }, [categories]);

  // Get flat categories list
  const flatCategories = useMemo(() => {
    const flatten = (cats: Category[], level = 0): (Category & { level: number; displayName: string })[] => {
      return cats.flatMap(cat => [
        { ...cat, level, displayName: '  '.repeat(level) + cat.name },
        ...flatten(cat.children || [], level + 1),
      ]);
    };
    return flatten(categoryTree);
  }, [categoryTree]);

  // Get category by ID
  const getCategoryById = (id: string): Category | undefined => {
    return categories.find(cat => cat.id === id);
  };

  // Get category path (breadcrumbs)
  const getCategoryPath = (categoryId: string): Category[] => {
    const path: Category[] = [];
    let currentId: string | undefined = categoryId;

    while (currentId) {
      const category = getCategoryById(currentId);
      if (category) {
        path.unshift(category);
        currentId = category.parentId;
      } else {
        break;
      }
    }

    return path;
  };

  // Update filters
  const updateFilters = (newFilters: Partial<ProductFilters>) => {
    setCurrentFilters(prev => ({ ...prev, ...newFilters }));
  };

  // Search products
  const searchProducts = (query: string) => {
    updateFilters({ search: query, page: 1 });
  };

  // Filter by category
  const filterByCategory = (categoryId?: string) => {
      updateFilters({
      ...(categoryId !== undefined && { categoryId }),
      page: 1,
    });
  };

  // Filter by status
  const filterByStatus = (isActive?: boolean) => {
    updateFilters({
      ...(isActive !== undefined && { isActive }),
      page: 1,
    });
  };

  // Change page
  const changePage = (page: number) => {
    updateFilters({ page });
  };

  // Change page size
  const changePageSize = (limit: number) => {
    updateFilters({ limit, page: 1 });
  };

  // Sort products
  const sortProducts = (sortBy: ProductFilters['sortBy'], sortOrder: ProductFilters['sortOrder'] = 'asc') => {
    updateFilters({
      ...(sortBy !== undefined && { sortBy }),
      sortOrder,
    });
  };

  // Statistics
  const statistics = useMemo(() => {
    const total = products.length;
    const active = products.filter(p => p.isActive).length;
    const inactive = total - active;
    const lowStock = products.filter(p => p.currentStock <= p.reorderPoint).length;
    const outOfStock = products.filter(p => p.currentStock === 0).length;

    return {
      total,
      active,
      inactive,
      lowStock,
      outOfStock,
    };
  }, [products]);

  return {
    // Data
    products,
    totalProducts,
    categories: flatCategories,
    categoryTree,
    currentFilters,
    statistics,

    // Loading states
    isLoading,
    isRefetching,
    isLoadingCategories,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isUploadingImage: uploadImageMutation.isPending,
    isDeletingImage: deleteImageMutation.isPending,

    // Error
    error,

    // Pagination info
    pagination: {
      page: productsData?.page || 1,
      limit: productsData?.limit || 10,
      totalPages: productsData?.totalPages || 0,
      hasNextPage: (productsData?.page || 1) < (productsData?.totalPages || 0),
      hasPrevPage: (productsData?.page || 1) > 1,
    },

    // Actions
    refetch,
    updateFilters,
    searchProducts,
    filterByCategory,
    filterByStatus,
    changePage,
    changePageSize,
    sortProducts,
    getCategoryById,
    getCategoryPath,

    // CRUD operations
    createProduct: createMutation.mutateAsync,
    updateProduct: updateMutation.mutate,
    deleteProduct: deleteMutation.mutate,
    bulkDeleteProducts: bulkDeleteMutation.mutate,

    // Image operations
    uploadProductImage: uploadImageMutation.mutate,
    deleteProductImage: deleteImageMutation.mutate,

    // Category operations
    createCategory: createCategoryMutation.mutate,
    updateCategory: updateCategoryMutation.mutate,
    deleteCategory: deleteCategoryMutation.mutate,
  };
};

// Hook for single product
export const useProduct = (id: string | undefined) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const {
    data: product,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['product', id],
    queryFn: () => productsApi.getProduct(id!),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });

  // Update product mutation
  const updateMutation = useMutation({
    mutationFn: (data: UpdateProductDto) => productsApi.updateProduct(id!, data),
    onSuccess: (updatedProduct) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['product', id] });
      toast.success(t('products.messages.updated', 'تم تحديث المنتج بنجاح'));
      return updatedProduct;
    },
    onError: (error: Error) => {
      const message = error.message || t('products.errors.updateFailed', 'فشل في تحديث المنتج');
      toast.error(message);
    },
  });

  // Update stock mutation
  const updateStockMutation = useMutation({
    mutationFn: ({ newStock, reason }: { newStock: number; reason?: string }) =>
      productsApi.updateStock(id!, newStock, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product', id] });
      toast.success(t('products.messages.stockUpdated', 'تم تحديث المخزون بنجاح'));
    },
    onError: (error: Error) => {
      const message = error.message || t('products.errors.stockUpdateFailed', 'فشل في تحديث المخزون');
      toast.error(message);
    },
  });

  return {
    product,
    isLoading,
    error,
    refetch,
    isUpdating: updateMutation.isPending,
    isUpdatingStock: updateStockMutation.isPending,
    updateProduct: updateMutation.mutate,
    updateStock: updateStockMutation.mutate,
  };
};

// Hook for product search suggestions
export const useProductSearch = () => {
  const [query, setQuery] = useState('');

  const {
    data: suggestions,
    isLoading,
  } = useQuery({
    queryKey: ['product-suggestions', query],
    queryFn: () => productsApi.getSearchSuggestions(query),
    enabled: query.length >= 2,
    staleTime: 30 * 1000, // 30 seconds
  });

  return {
    query,
    setQuery,
    suggestions: suggestions || [],
    isLoading,
  };
};
