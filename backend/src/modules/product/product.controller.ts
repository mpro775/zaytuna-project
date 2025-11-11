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
import { ProductService } from './product.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Permissions } from '../../common/decorators/permissions.decorator';

@Controller('products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  /**
   * إنشاء منتج جديد
   */
  @Post()
  @Permissions('products.create')
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createProductDto: CreateProductDto) {
    return this.productService.create(createProductDto);
  }

  /**
   * الحصول على جميع المنتجات
   */
  @Get()
  @Permissions('products.read')
  findAll(
    @Query('categoryId') categoryId?: string,
    @Query('search') search?: string,
  ) {
    return this.productService.findAll(categoryId, search);
  }

  /**
   * الحصول على إحصائيات المنتجات
   */
  @Get('stats')
  @Permissions('products.read')
  getProductStats() {
    return this.productService.getProductStats();
  }

  /**
   * البحث عن منتج بالباركود أو SKU
   */
  @Get('lookup/:identifier')
  @Permissions('products.read')
  findByBarcodeOrSku(@Param('identifier') identifier: string) {
    return this.productService.findByBarcodeOrSku(identifier);
  }

  /**
   * الحصول على منتج بالمعرف
   */
  @Get(':id')
  @Permissions('products.read')
  findOne(@Param('id') id: string) {
    return this.productService.findOne(id);
  }

  /**
   * تحديث منتج
   */
  @Patch(':id')
  @Permissions('products.update')
  @HttpCode(HttpStatus.OK)
  update(@Param('id') id: string, @Body() updateProductDto: UpdateProductDto) {
    return this.productService.update(id, updateProductDto);
  }

  /**
   * حذف منتج
   */
  @Delete(':id')
  @Permissions('products.delete')
  @HttpCode(HttpStatus.OK)
  remove(@Param('id') id: string) {
    return this.productService.remove(id);
  }
}
