import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  HttpCode,
  HttpStatus,
  Query,
} from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { CreateStockItemDto } from './dto/create-stock-item.dto';
import { UpdateStockItemDto } from './dto/update-stock-item.dto';
import { AdjustStockDto } from './dto/adjust-stock.dto';
import { Permissions } from '../../common/decorators/permissions.decorator';

@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  /**
   * إنشاء عنصر مخزون جديد
   */
  @Post('stock-items')
  @Permissions('inventory.create')
  @HttpCode(HttpStatus.CREATED)
  createStockItem(@Body() createStockItemDto: CreateStockItemDto) {
    return this.inventoryService.createStockItem(createStockItemDto);
  }

  /**
   * الحصول على عناصر المخزون
   */
  @Get('stock-items')
  @Permissions('inventory.read')
  findAllStockItems(
    @Query('warehouseId') warehouseId?: string,
    @Query('lowStockOnly') lowStockOnly?: boolean,
  ) {
    return this.inventoryService.findAllStockItems(warehouseId, lowStockOnly === true);
  }

  /**
   * الحصول على عنصر مخزون بالمعرف
   */
  @Get('stock-items/:id')
  @Permissions('inventory.read')
  findStockItemById(@Param('id') id: string) {
    return this.inventoryService.findStockItemById(id);
  }

  /**
   * تحديث عنصر مخزون
   */
  @Patch('stock-items/:id')
  @Permissions('inventory.update')
  @HttpCode(HttpStatus.OK)
  updateStockItem(@Param('id') id: string, @Body() updateStockItemDto: UpdateStockItemDto) {
    return this.inventoryService.updateStockItem(id, updateStockItemDto);
  }

  /**
   * تعديل كمية المخزون
   */
  @Post('stock-items/:warehouseId/:productVariantId/adjust')
  @Permissions('inventory.update')
  @HttpCode(HttpStatus.OK)
  adjustStock(
    @Param('warehouseId') warehouseId: string,
    @Param('productVariantId') productVariantId: string,
    @Body() adjustStockDto: AdjustStockDto,
  ) {
    return this.inventoryService.adjustStock(warehouseId, productVariantId, adjustStockDto);
  }

  /**
   * الحصول على حركات المخزون
   */
  @Get('movements')
  @Permissions('inventory.read')
  findStockMovements(
    @Query('warehouseId') warehouseId?: string,
    @Query('productVariantId') productVariantId?: string,
    @Query('limit') limit?: number,
  ) {
    return this.inventoryService.findStockMovements(
      warehouseId,
      productVariantId,
      limit ? parseInt(limit.toString()) : 50,
    );
  }

  /**
   * الحصول على تنبيهات المخزون المنخفض
   */
  @Get('alerts/low-stock')
  @Permissions('inventory.read')
  getLowStockAlerts() {
    return this.inventoryService.getLowStockAlerts();
  }

  /**
   * الحصول على إحصائيات المخزون
   */
  @Get('stats')
  @Permissions('inventory.read')
  getInventoryStats() {
    return this.inventoryService.getInventoryStats();
  }

  /**
   * الحصول على مخزون منتج في جميع المخازن
   */
  @Get('products/:productVariantId/stock')
  @Permissions('inventory.read')
  async getProductStockAcrossWarehouses(@Param('productVariantId') productVariantId: string) {
    // البحث عن جميع عناصر المخزون لهذا المنتج
    return this.inventoryService.findAllStockItems().then(items =>
      items.filter(item => item.productVariantId === productVariantId)
    );
  }

  /**
   * الحصول على مخزون مخزن محدد
   */
  @Get('warehouses/:warehouseId/stock')
  @Permissions('inventory.read')
  getWarehouseStock(@Param('warehouseId') warehouseId: string) {
    return this.inventoryService.findAllStockItems(warehouseId);
  }
}
