import { WarehouseService } from './warehouse.service';
import { CreateWarehouseDto } from './dto/create-warehouse.dto';
import { UpdateWarehouseDto } from './dto/update-warehouse.dto';
import { TransferStockDto } from './dto/transfer-stock.dto';
export declare class WarehouseController {
    private readonly warehouseService;
    constructor(warehouseService: WarehouseService);
    create(createWarehouseDto: CreateWarehouseDto): Promise<import("./warehouse.service").WarehouseWithDetails>;
    findAll(branchId?: string): Promise<import("./warehouse.service").WarehouseWithDetails[]>;
    getWarehouseStats(): Promise<{
        totalWarehouses: number;
        activeWarehouses: number;
        inactiveWarehouses: number;
        totalStockItems: number;
        totalStockQuantity: number | import("@prisma/client/runtime/library").Decimal;
        averageWarehousesPerBranch: string | number;
    }>;
    findOne(id: string): Promise<import("./warehouse.service").WarehouseWithDetails>;
    getStockItemsByWarehouse(id: string): Promise<{
        id: string;
        productVariantId: string;
        quantity: number;
        minStock: number;
        maxStock: number;
        createdAt: Date;
        updatedAt: Date;
    }[]>;
    update(id: string, updateWarehouseDto: UpdateWarehouseDto): Promise<import("./warehouse.service").WarehouseWithDetails>;
    transferStock(transferStockDto: TransferStockDto): Promise<{
        message: string;
    }>;
    remove(id: string): Promise<{
        message: string;
    }>;
}
