import { PrismaService } from '../../shared/database/prisma.service';
import { CacheService } from '../../shared/cache/cache.service';
import { CreateWarehouseDto } from './dto/create-warehouse.dto';
import { UpdateWarehouseDto } from './dto/update-warehouse.dto';
export interface WarehouseWithDetails {
    id: string;
    name: string;
    code: string;
    address?: string;
    phone?: string;
    email?: string;
    managerId?: string;
    branchId: string;
    isActive: boolean;
    manager?: {
        id: string;
        username: string;
        email: string;
    };
    branch: {
        id: string;
        name: string;
        code: string;
    };
    stockItemCount: number;
    createdAt: Date;
    updatedAt: Date;
}
export declare class WarehouseService {
    private readonly prisma;
    private readonly cacheService;
    private readonly logger;
    private readonly warehousesCacheKey;
    private readonly warehouseCacheKey;
    constructor(prisma: PrismaService, cacheService: CacheService);
    create(createWarehouseDto: CreateWarehouseDto): Promise<WarehouseWithDetails>;
    findAll(branchId?: string): Promise<WarehouseWithDetails[]>;
    findOne(id: string): Promise<WarehouseWithDetails>;
    update(id: string, updateWarehouseDto: UpdateWarehouseDto): Promise<WarehouseWithDetails>;
    remove(id: string): Promise<{
        message: string;
    }>;
    getStockItemsByWarehouse(warehouseId: string): Promise<{
        id: string;
        productVariantId: string;
        quantity: number;
        minStock: number;
        maxStock: number;
        createdAt: Date;
        updatedAt: Date;
    }[]>;
    getWarehouseStats(): Promise<{
        totalWarehouses: number;
        activeWarehouses: number;
        inactiveWarehouses: number;
        totalStockItems: number;
        totalStockQuantity: number | import("@prisma/client/runtime/library").Decimal;
        averageWarehousesPerBranch: string | number;
    }>;
    transferStock(fromWarehouseId: string, toWarehouseId: string, productVariantId: string, quantity: number, notes?: string): Promise<{
        message: string;
    }>;
    private invalidateWarehousesCache;
}
