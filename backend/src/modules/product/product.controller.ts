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
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ProductService } from './product.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { StorageService } from '../storage/storage.service';

@Controller('products')
export class ProductController {
  constructor(
    private readonly productService: ProductService,
    private readonly storageService: StorageService,
  ) {}

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

  @Post(':id/images')
  @UseInterceptors(FileInterceptor('file'))
  @Permissions('products.update')
  uploadImage(
    @Param('id') id: string,
    @UploadedFile() file: any,
    @Query('userId') userId?: string,
  ) {
    return this.storageService.attachProductImage(id, file, userId);
  }

  @Get(':id/images')
  @Permissions('products.read')
  listImages(@Param('id') id: string) {
    return this.storageService.listProductImages(id);
  }

  @Delete(':id/images/:fileId')
  @Permissions('products.update')
  deleteImage(@Param('fileId') fileId: string) {
    return this.storageService.deleteFile(fileId);
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
