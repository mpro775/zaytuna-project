import { api } from '../api';
import { Permission, UsersApiResponse } from './types';

/**
 * خدمة الصلاحيات - Permissions Service
 * مرتبطة بـ backend/src/modules/auth/permission
 */
export class PermissionsService {
  private static readonly BASE_URL = '/permissions';

  /**
   * الحصول على جميع الصلاحيات
   * GET /permissions
   */
  static async getAllPermissions(): Promise<UsersApiResponse<Permission[]>> {
    const response = await api.get(`${this.BASE_URL}`);
    return response.data;
  }

  /**
   * الحصول على الصلاحيات بالفئة
   * GET /permissions/categories
   */
  static async getCategories(): Promise<UsersApiResponse<{ categories: string[] }>> {
    const response = await api.get(`${this.BASE_URL}/categories`);
    return response.data;
  }

  /**
   * الحصول على الصلاحيات بالفئة المحددة
   * GET /permissions/category/:category
   */
  static async getPermissionsByCategory(category: string): Promise<UsersApiResponse<Permission[]>> {
    const response = await api.get(`${this.BASE_URL}/category/${category}`);
    return response.data;
  }

  /**
   * التحقق من صحة الصلاحية
   * GET /permissions/validate/:permission
   */
  static async validatePermission(
    permission: string
  ): Promise<UsersApiResponse<{
    permission: string;
    isValid: boolean;
    details?: any;
  }>> {
    const response = await api.get(`${this.BASE_URL}/validate/${permission}`);
    return response.data;
  }
}
