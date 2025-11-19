// Services exports
export * from './common';
export * from './api';
export * from './auth';
export * from './reports';
export * from './products';
export * from './sales';
export * from './users';
export * from './accounting';
export * from './customers';
export * from './suppliers';
export * from './branches';
export * from './warehouses';
export * from './settings';

// Resolve naming conflicts with named exports
export type { ProductVariant as InventoryProductVariant } from './inventory';
export type { StockItem as InventoryStockItem } from './inventory';
export type { Warehouse as InventoryWarehouse } from './inventory';
export type { TransferStockDto as InventoryTransferStockDto } from './inventory';