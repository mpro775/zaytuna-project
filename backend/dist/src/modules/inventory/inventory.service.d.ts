import { PrismaService } from '../../shared/database/prisma.service';
import { CacheService } from '../../shared/cache/cache.service';
import { CreateStockItemDto } from './dto/create-stock-item.dto';
import { UpdateStockItemDto } from './dto/update-stock-item.dto';
import { AdjustStockDto } from './dto/adjust-stock.dto';
export interface StockItemWithDetails {
    id: string;
    warehouseId: string;
    productVariantId: string;
    quantity: number;
    minStock: number;
    maxStock: number;
    warehouse: {
        id: string;
        name: string;
        code: string;
    };
    productVariant: {
        id: string;
        name: string;
        sku?: string;
        barcode?: string;
        product: {
            id: string;
            name: string;
        };
    };
    isLowStock: boolean;
    isOverStock: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export interface StockMovementWithDetails {
    id: string;
    warehouseId: string;
    productVariantId: string;
    movementType: string;
    quantity: number;
    referenceType?: string;
    referenceId?: string;
    reason?: string;
    performedBy?: string;
    warehouse: {
        id: string;
        name: string;
        code: string;
    };
    productVariant: {
        id: string;
        name: string;
        product: {
            id: string;
            name: string;
        };
    };
    createdAt: Date;
}
export declare class InventoryService {
    private readonly prisma;
    private readonly cacheService;
    private readonly logger;
    private readonly stockItemsCacheKey;
    private readonly stockMovementsCacheKey;
    constructor(prisma: PrismaService, cacheService: CacheService);
    createStockItem(createStockItemDto: CreateStockItemDto): Promise<StockItemWithDetails>;
    findAllStockItems(warehouseId?: string, lowStockOnly?: boolean): Promise<StockItemWithDetails[]>;
    findStockItemById(id: string): Promise<StockItemWithDetails>;
    findStockItemByWarehouseAndVariant(warehouseId: string, productVariantId: string): Promise<StockItemWithDetails | null>;
    updateStockItem(id: string, updateStockItemDto: UpdateStockItemDto): Promise<StockItemWithDetails>;
    adjustStock(warehouseId: string, productVariantId: string, adjustStockDto: AdjustStockDto, performedBy?: string): Promise<StockItemWithDetails>;
    findStockMovements(warehouseId?: string, productVariantId?: string, limit?: number): Promise<StockMovementWithDetails[]>;
    getLowStockAlerts(): Promise<StockItemWithDetails[]>;
    getInventoryStats(): Promise<{
        totalItems: number;
        totalValue: number;
        lowStockItems: number;
        outOfStockItems: number;
        overStockItems: number;
        totalMovements: number;
    }>;
    private buildStockItemWithDetails;
    private invalidateStockCache;
}
