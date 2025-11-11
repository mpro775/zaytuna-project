import { InventoryService } from './inventory.service';
import { CreateStockItemDto } from './dto/create-stock-item.dto';
import { UpdateStockItemDto } from './dto/update-stock-item.dto';
import { AdjustStockDto } from './dto/adjust-stock.dto';
export declare class InventoryController {
    private readonly inventoryService;
    constructor(inventoryService: InventoryService);
    createStockItem(createStockItemDto: CreateStockItemDto): Promise<import("./inventory.service").StockItemWithDetails>;
    findAllStockItems(warehouseId?: string, lowStockOnly?: boolean): Promise<import("./inventory.service").StockItemWithDetails[]>;
    findStockItemById(id: string): Promise<import("./inventory.service").StockItemWithDetails>;
    updateStockItem(id: string, updateStockItemDto: UpdateStockItemDto): Promise<import("./inventory.service").StockItemWithDetails>;
    adjustStock(warehouseId: string, productVariantId: string, adjustStockDto: AdjustStockDto): Promise<import("./inventory.service").StockItemWithDetails>;
    findStockMovements(warehouseId?: string, productVariantId?: string, limit?: number): Promise<import("./inventory.service").StockMovementWithDetails[]>;
    getLowStockAlerts(): Promise<import("./inventory.service").StockItemWithDetails[]>;
    getInventoryStats(): Promise<{
        totalItems: number;
        totalValue: number;
        lowStockItems: number;
        outOfStockItems: number;
        overStockItems: number;
        totalMovements: number;
    }>;
    getProductStockAcrossWarehouses(productVariantId: string): Promise<import("./inventory.service").StockItemWithDetails[]>;
    getWarehouseStock(warehouseId: string): Promise<import("./inventory.service").StockItemWithDetails[]>;
}
