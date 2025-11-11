import { Controller, Get, Query } from '@nestjs/common';
import { PermissionService } from './permission.service';
import { Permissions } from '../../common/decorators/permissions.decorator';

@Controller('permissions')
export class PermissionController {
  constructor(private readonly permissionService: PermissionService) {}

  /**
   * الحصول على جميع الصلاحيات
   */
  @Get()
  @Permissions('roles.read')
  getAllPermissions() {
    return this.permissionService.getAllPermissions();
  }

  /**
   * الحصول على الصلاحيات بالفئة
   */
  @Get('categories')
  @Permissions('roles.read')
  getCategories() {
    const categories = this.permissionService.getCategories();
    return { categories };
  }

  /**
   * الحصول على الصلاحيات بالفئة المحددة
   */
  @Get('category/:category')
  @Permissions('roles.read')
  getPermissionsByCategory(@Query('category') category: string) {
    return this.permissionService.getPermissionsByCategory(category);
  }

  /**
   * التحقق من صحة الصلاحية
   */
  @Get('validate/:permission')
  @Permissions('roles.read')
  validatePermission(@Query('permission') permission: string) {
    const isValid = this.permissionService.isValidPermission(permission);
    const details = this.permissionService.getPermissionDetails(permission);

    return {
      permission,
      isValid,
      details,
    };
  }
}
