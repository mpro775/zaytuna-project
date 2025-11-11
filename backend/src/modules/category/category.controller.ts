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
import { CategoryService } from './category.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { Permissions } from '../../common/decorators/permissions.decorator';

@Controller('categories')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  /**
   * إنشاء فئة جديدة
   */
  @Post()
  @Permissions('products.create')
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createCategoryDto: CreateCategoryDto) {
    return this.categoryService.create(createCategoryDto);
  }

  /**
   * الحصول على جميع الفئات
   */
  @Get()
  @Permissions('products.read')
  findAll(@Query('includeInactive') includeInactive?: boolean) {
    return this.categoryService.findAll(includeInactive === true);
  }

  /**
   * الحصول على الفئات الجذر
   */
  @Get('root')
  @Permissions('products.read')
  findRootCategories() {
    return this.categoryService.findRootCategories();
  }

  /**
   * الحصول على إحصائيات الفئات
   */
  @Get('stats')
  @Permissions('products.read')
  getCategoryStats() {
    return this.categoryService.getCategoryStats();
  }

  /**
   * الحصول على فئة بالمعرف
   */
  @Get(':id')
  @Permissions('products.read')
  findOne(@Param('id') id: string) {
    return this.categoryService.findOne(id);
  }

  /**
   * الحصول على الفئات الفرعية
   */
  @Get(':id/subcategories')
  @Permissions('products.read')
  findSubCategories(@Param('id') id: string) {
    return this.categoryService.findSubCategories(id);
  }

  /**
   * تحديث فئة
   */
  @Patch(':id')
  @Permissions('products.update')
  @HttpCode(HttpStatus.OK)
  update(@Param('id') id: string, @Body() updateCategoryDto: UpdateCategoryDto) {
    return this.categoryService.update(id, updateCategoryDto);
  }

  /**
   * حذف فئة
   */
  @Delete(':id')
  @Permissions('products.delete')
  @HttpCode(HttpStatus.OK)
  remove(@Param('id') id: string) {
    return this.categoryService.remove(id);
  }
}
