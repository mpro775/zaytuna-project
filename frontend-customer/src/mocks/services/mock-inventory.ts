/**
 * Mock Inventory Service
 * Handles inventory and stock movements mock API calls
 */

import stockItemsData from '../data/stock-items.json';
import stockMovementsData from '../data/stock-movements.json';
import { mockApi } from './mock-api';
import {
  filterData,
  sortData,
  paginateData,
  generateId,
  getMockDataFromStorage,
  saveMockDataToStorage,
} from './mock-utils';
import type { MockRequest, MockResponse } from '../types';

// Load data with localStorage persistence
const stockItems = getMockDataFromStorage('stockItems', stockItemsData);
const stockMovements = getMockDataFromStorage('stockMovements', stockMovementsData);

// Register handlers
mockApi.registerHandler(
  'GET:/inventory/stock-items',
  async (request: MockRequest): Promise<MockResponse> => {
    let filtered = filterData(stockItems, request.params || {});

    if (request.params?.lowStockOnly) {
      filtered = filtered.filter(item => item.isLowStock);
    }

    if (request.params?.sortBy) {
      filtered = sortData(filtered, request.params.sortBy, request.params.sortOrder || 'asc');
    }

    return {
      data: filtered,
      statusCode: 200,
    };
  }
);

mockApi.registerHandler(
  'GET:/inventory/stock-items/:id',
  async (request: MockRequest): Promise<MockResponse> => {
    const id = request.params?.id;
    const item = stockItems.find(item => item.id === id);

    if (!item) {
      throw {
        response: {
          status: 404,
          data: {
            message: 'عنصر المخزون غير موجود',
            statusCode: 404,
          },
        },
      };
    }

    return {
      data: item,
      statusCode: 200,
    };
  }
);

mockApi.registerHandler(
  'POST:/inventory/stock-items',
  async (request: MockRequest): Promise<MockResponse> => {
    const newItem = {
      id: generateId(),
      ...request.data,
      quantity: request.data?.quantity || 0,
      isLowStock: false,
      isOverStock: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Check low/over stock
    if (newItem.quantity < newItem.minStock) {
      newItem.isLowStock = true;
    }
    if (newItem.quantity > newItem.maxStock) {
      newItem.isOverStock = true;
    }

    stockItems.push(newItem);
    saveMockDataToStorage('stockItems', stockItems);

    return {
      data: newItem,
      statusCode: 201,
    };
  }
);

mockApi.registerHandler(
  'PATCH:/inventory/stock-items/:id',
  async (request: MockRequest): Promise<MockResponse> => {
    const id = request.params?.id;
    const index = stockItems.findIndex(item => item.id === id);

    if (index === -1) {
      throw {
        response: {
          status: 404,
          data: {
            message: 'عنصر المخزون غير موجود',
            statusCode: 404,
          },
        },
      };
    }

    stockItems[index] = {
      ...stockItems[index],
      ...request.data,
      updatedAt: new Date().toISOString(),
    };

    // Recheck low/over stock
    const item = stockItems[index]!;
    if (item.quantity < item.minStock) {
      item.isLowStock = true;
    } else {
      item.isLowStock = false;
    }

    if (item.quantity > item.maxStock) {
      item.isOverStock = true;
    } else {
      item.isOverStock = false;
    }

    saveMockDataToStorage('stockItems', stockItems);

    return {
      data: item,
      statusCode: 200,
    };
  }
);

mockApi.registerHandler(
  'POST:/inventory/stock-items/:warehouseId/:productVariantId/adjust',
  async (request: MockRequest): Promise<MockResponse> => {
    const warehouseId = request.params?.warehouseId;
    const productVariantId = request.params?.productVariantId;

    let item = stockItems.find(
      item => item.warehouseId === warehouseId && item.productVariantId === productVariantId
    );

    if (!item) {
      // Create new item
      item = {
        id: generateId(),
        warehouseId: warehouseId!,
        productVariantId: productVariantId!,
        quantity: request.data.quantity || 0,
        minStock: 0,
        maxStock: 1000,
        isLowStock: false,
        isOverStock: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        warehouse: { id: warehouseId!, name: '', code: '' }, // Mock data
        productVariant: { id: productVariantId!, name: '', sku: '', product: { id: '', name: '' } }, // Mock data
      };
      stockItems.push(item);
    }

    // Adjust quantity
    item.quantity += request.data.quantity || 0;
    item.updatedAt = new Date().toISOString();

    // Check low/over stock
    if (item.quantity < item.minStock) {
      item.isLowStock = true;
    } else {
      item.isLowStock = false;
    }

    if (item.quantity > item.maxStock) {
      item.isOverStock = true;
    } else {
      item.isOverStock = false;
    }

    // Create movement record
    const movement = {
      id: generateId(),
      warehouseId: warehouseId!,
      productVariantId: productVariantId!,
      movementType: request.data.movementType || 'adjustment',
      quantity: request.data.quantity || 0,
      referenceType: request.data.referenceType || 'adjustment',
      referenceId: request.data.referenceId || generateId(),
      reason: request.data.reason || 'تعديل مخزون',
      performedBy: 'user-5',
      createdAt: new Date().toISOString(),
      warehouse: { id: warehouseId!, name: '', code: '' }, // Mock data
      productVariant: { id: productVariantId!, name: '', sku: '', product: { id: '', name: '' } }, // Mock data
    };

    stockMovements.push(movement);
    saveMockDataToStorage('stockItems', stockItems);
    saveMockDataToStorage('stockMovements', stockMovements);

    return {
      data: item,
      statusCode: 200,
    };
  }
);

mockApi.registerHandler(
  'GET:/inventory/movements',
  async (request: MockRequest): Promise<MockResponse> => {
    let filtered = filterData(stockMovements, request.params || {});

    // Default sort by createdAt desc
    filtered = sortData(filtered, 'createdAt', 'desc');

    const limit = request.params?.limit || 50;
    const result = paginateData(filtered, 1, limit);

    return {
      data: result.data,
      statusCode: 200,
    };
  }
);

mockApi.registerHandler('GET:/inventory/alerts/low-stock', async (): Promise<MockResponse> => {
  const lowStockItems = stockItems.filter(item => item.isLowStock);

  return {
    data: lowStockItems,
    statusCode: 200,
  };
});

mockApi.registerHandler('GET:/inventory/stats', async (): Promise<MockResponse> => {
  const totalItems = stockItems.length;
  const totalValue = stockItems.reduce((sum, item) => {
    // Estimate value (in real app, would use product cost price)
    return sum + item.quantity * 1000; // Mock value
  }, 0);
  const lowStockItems = stockItems.filter(item => item.isLowStock).length;
  const outOfStockItems = stockItems.filter(item => item.quantity === 0).length;
  const overStockItems = stockItems.filter(item => item.isOverStock).length;
  const totalMovements = stockMovements.length;

  return {
    data: {
      totalItems,
      totalValue,
      lowStockItems,
      outOfStockItems,
      overStockItems,
      totalMovements,
    },
    statusCode: 200,
  };
});

mockApi.registerHandler(
  'GET:/inventory/products/:productVariantId/stock',
  async (request: MockRequest): Promise<MockResponse> => {
    const productVariantId = request.params?.productVariantId;
    const items = stockItems.filter(item => item.productVariantId === productVariantId);

    return {
      data: items,
      statusCode: 200,
    };
  }
);

mockApi.registerHandler(
  'GET:/inventory/warehouses/:warehouseId/stock',
  async (request: MockRequest): Promise<MockResponse> => {
    const warehouseId = request.params?.warehouseId;
    const items = stockItems.filter(item => item.warehouseId === warehouseId);

    return {
      data: items,
      statusCode: 200,
    };
  }
);

mockApi.registerHandler(
  'POST:/warehouses/transfer-stock',
  async (request: MockRequest): Promise<MockResponse> => {
    const { fromWarehouseId, toWarehouseId, productVariantId, quantity, notes } = request.data;

    // Find source item
    const sourceItem = stockItems.find(
      item => item.warehouseId === fromWarehouseId && item.productVariantId === productVariantId
    );

    if (!sourceItem || sourceItem.quantity < quantity) {
      throw {
        response: {
          status: 400,
          data: {
            message: 'المخزون غير كافٍ',
            statusCode: 400,
          },
        },
      };
    }

    // Find or create destination item
    let destItem = stockItems.find(
      item => item.warehouseId === toWarehouseId && item.productVariantId === productVariantId
    );

    if (!destItem) {
      destItem = {
        id: generateId(),
        warehouseId: toWarehouseId,
        productVariantId: productVariantId,
        quantity: 0,
        minStock: sourceItem.minStock,
        maxStock: sourceItem.maxStock,
        isLowStock: false,
        isOverStock: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        warehouse: sourceItem.warehouse, // Copy warehouse info
        productVariant: sourceItem.productVariant, // Copy product variant info
      };
      stockItems.push(destItem);
    }

    // Transfer
    sourceItem.quantity -= quantity;
    destItem.quantity += quantity;
    sourceItem.updatedAt = new Date().toISOString();
    destItem.updatedAt = new Date().toISOString();

    // Create movements
    const referenceId = generateId();
    const outMovement = {
      id: generateId(),
      warehouseId: fromWarehouseId,
      productVariantId: productVariantId,
      movementType: 'transfer_out',
      quantity: -quantity,
      referenceType: 'warehouse_transfer',
      referenceId,
      reason: notes || 'نقل بين المخازن',
      performedBy: 'user-5',
      createdAt: new Date().toISOString(),
      warehouse: sourceItem.warehouse,
      productVariant: sourceItem.productVariant,
    };

    const inMovement = {
      id: generateId(),
      warehouseId: toWarehouseId,
      productVariantId: productVariantId,
      movementType: 'transfer_in',
      quantity: quantity,
      referenceType: 'warehouse_transfer',
      referenceId,
      reason: notes || 'نقل بين المخازن',
      performedBy: 'user-5',
      createdAt: new Date().toISOString(),
      warehouse: destItem.warehouse,
      productVariant: destItem.productVariant,
    };

    stockMovements.push(outMovement, inMovement);
    saveMockDataToStorage('stockItems', stockItems);
    saveMockDataToStorage('stockMovements', stockMovements);

    return {
      data: { message: 'تم نقل المخزون بنجاح' },
      statusCode: 200,
    };
  }
);
