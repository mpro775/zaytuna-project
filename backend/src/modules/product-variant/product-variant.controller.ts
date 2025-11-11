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
import { ProductVariantService } from './product-variant.service';
import { CreateProductVariantDto } from './dto/create-product-variant.dto';
import { UpdateProductVariantDto } from './dto/update-product-variant.dto';
import { Permissions } from '../../common/decorators/permissions.decorator';

@Controller('product-variants')
export class ProductVariantController {
  constructor(private readonly productVariantService: ProductVariantService) {}

  /**
   * إنشاء متغير منتج جديد
   */
  @Post()
  @Permissions('products.create')
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createProductVariantDto: CreateProductVariantDto) {
    return this.productVariantService.create(createProductVariantDto);
  }

  /**
   * الحصول على جميع متغيرات المنتج
   */
  @Get()
  @Permissions('products.read')
  findAll(@Query('productId') productId?: string) {
    return this.productVariantService.findAll(productId);
  }

  /**
   * البحث عن متغير منتج بالباركود أو SKU
   */
  @Get('lookup/:identifier')
  @Permissions('products.read')
  findByBarcodeOrSku(@Param('identifier') identifier: string) {
    return this.productVariantService.findByBarcodeOrSku(identifier);
  }

  /**
   * الحصول على متغير منتج بالمعرف
   */
  @Get(':id')
  @Permissions('products.read')
  findOne(@Param('id') id: string) {
    return this.productVariantService.findOne(id);
  }

  /**
   * تحديث متغير منتج
   */
  @Patch(':id')
  @Permissions('products.update')
  @HttpCode(HttpStatus.OK)
  update(@Param('id') id: string, @Body() updateProductVariantDto: UpdateProductVariantDto) {
    return this.productVariantService.update(id, updateProductVariantDto);
  }

  /**
   * حذف متغير منتج
   */
  @Delete(':id')
  @Permissions('products.delete')
  @HttpCode(HttpStatus.OK)
  remove(@Param('id') id: string) {
    return this.productVariantService.remove(id);
  }
}
