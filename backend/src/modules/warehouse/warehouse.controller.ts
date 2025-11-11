import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  Query,
} from '@nestjs/common';
import { WarehouseService } from './warehouse.service';
import { CreateWarehouseDto } from './dto/create-warehouse.dto';
import { UpdateWarehouseDto } from './dto/update-warehouse.dto';
import { TransferStockDto } from './dto/transfer-stock.dto';
import { Permissions } from '../../common/decorators/permissions.decorator';

@Controller('warehouses')
export class WarehouseController {
  constructor(private readonly warehouseService: WarehouseService) {}

  /**
   * إنشاء مخزن جديد
   */
  @Post()
  @Permissions('branches.manage')
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createWarehouseDto: CreateWarehouseDto) {
    return this.warehouseService.create(createWarehouseDto);
  }

  /**
   * الحصول على جميع المخازن
   */
  @Get()
  @Permissions('inventory.read')
  findAll(@Query('branchId') branchId?: string) {
    return this.warehouseService.findAll(branchId);
  }

  /**
   * الحصول على إحصائيات المخازن
   */
  @Get('stats')
  @Permissions('inventory.read')
  getWarehouseStats() {
    return this.warehouseService.getWarehouseStats();
  }

  /**
   * الحصول على مخزن بالمعرف
   */
  @Get(':id')
  @Permissions('inventory.read')
  findOne(@Param('id') id: string) {
    return this.warehouseService.findOne(id);
  }

  /**
   * الحصول على عناصر المخزون بالمخزن
   */
  @Get(':id/stock')
  @Permissions('inventory.read')
  getStockItemsByWarehouse(@Param('id') id: string) {
    return this.warehouseService.getStockItemsByWarehouse(id);
  }

  /**
   * تحديث مخزن
   */
  @Patch(':id')
  @Permissions('branches.manage')
  @HttpCode(HttpStatus.OK)
  update(@Param('id') id: string, @Body() updateWarehouseDto: UpdateWarehouseDto) {
    return this.warehouseService.update(id, updateWarehouseDto);
  }

  /**
   * نقل المخزون بين المخازن
   */
  @Post('transfer-stock')
  @Permissions('inventory.transfer')
  @HttpCode(HttpStatus.OK)
  transferStock(@Body() transferStockDto: TransferStockDto) {
    return this.warehouseService.transferStock(
      transferStockDto.fromWarehouseId,
      transferStockDto.toWarehouseId,
      transferStockDto.productVariantId,
      transferStockDto.quantity,
      transferStockDto.notes,
    );
  }

  /**
   * حذف مخزن
   */
  @Delete(':id')
  @Permissions('branches.manage')
  @HttpCode(HttpStatus.OK)
  remove(@Param('id') id: string) {
    return this.warehouseService.remove(id);
  }
}
