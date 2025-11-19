import { api } from '../api';
import {
  type User,
  type CreateUserDto,
  type UpdateUserDto,
  type ChangeUserPasswordDto,
  type UsersFilters,
  type UserStats,
  type UsersApiResponse,
} from './types';

/**
 * خدمة المستخدمين - Users Service
 * مرتبطة بـ backend/src/modules/user
 */
export class UsersService {
  private static readonly BASE_URL = '/users';

  /**
   * إنشاء مستخدم جديد
   * POST /users
   */
  static async createUser(data: CreateUserDto): Promise<UsersApiResponse<User>> {
    const response = await api.post(`${this.BASE_URL}`, data);
    return response.data;
  }

  /**
   * الحصول على المستخدمين مع الفلترة
   * GET /users
   */
  static async getUsers(filters: UsersFilters = {}): Promise<UsersApiResponse<User[]>> {
    const params = new URLSearchParams();

    if (filters.branchId) params.append('branchId', filters.branchId);
    if (filters.roleId) params.append('roleId', filters.roleId);
    if (filters.isActive !== undefined) params.append('isActive', filters.isActive.toString());
    if (filters.search) params.append('search', filters.search);

    const response = await api.get(`${this.BASE_URL}?${params.toString()}`);
    return response.data;
  }

  /**
   * الحصول على مستخدم بالمعرف
   * GET /users/:id
   */
  static async getUserById(id: string): Promise<UsersApiResponse<User>> {
    const response = await api.get(`${this.BASE_URL}/${id}`);
    return response.data;
  }

  /**
   * تحديث مستخدم
   * PATCH /users/:id
   */
  static async updateUser(
    id: string,
    data: UpdateUserDto
  ): Promise<UsersApiResponse<User>> {
    const response = await api.patch(`${this.BASE_URL}/${id}`, data);
    return response.data;
  }

  /**
   * حذف مستخدم
   * DELETE /users/:id
   */
  static async deleteUser(id: string): Promise<UsersApiResponse<{ message: string }>> {
    const response = await api.delete(`${this.BASE_URL}/${id}`);
    return response.data;
  }

  /**
   * تغيير كلمة مرور المستخدم
   * PATCH /users/:id/password
   */
  static async changeUserPassword(
    id: string,
    data: ChangeUserPasswordDto
  ): Promise<UsersApiResponse<{ message: string }>> {
    const response = await api.patch(`${this.BASE_URL}/${id}/password`, data);
    return response.data;
  }

  /**
   * تبديل حالة المستخدم (تفعيل/إلغاء تفعيل)
   * PUT /users/:id/toggle-status
   */
  static async toggleUserStatus(id: string): Promise<UsersApiResponse<User>> {
    const response = await api.put(`${this.BASE_URL}/${id}/toggle-status`);
    return response.data;
  }

  /**
   * الحصول على إحصائيات المستخدمين
   * GET /users/stats/overview
   */
  static async getUserStats(): Promise<UsersApiResponse<UserStats>> {
    const response = await api.get(`${this.BASE_URL}/stats/overview`);
    return response.data;
  }
}
