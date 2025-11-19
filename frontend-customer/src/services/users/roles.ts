import { api } from '../api';
import {
  Role,
  CreateRoleDto,
  UpdateRoleDto,
  AssignRoleDto,
  RoleStats,
  UsersApiResponse,
} from './types';

/**
 * خدمة الأدوار - Roles Service
 * مرتبطة بـ backend/src/modules/auth/role
 */
export class RolesService {
  private static readonly BASE_URL = '/roles';

  /**
   * إنشاء دور جديد
   * POST /roles
   */
  static async createRole(data: CreateRoleDto): Promise<UsersApiResponse<Role>> {
    const response = await api.post(`${this.BASE_URL}`, data);
    return response.data;
  }

  /**
   * الحصول على جميع الأدوار
   * GET /roles
   */
  static async getRoles(): Promise<UsersApiResponse<Role[]>> {
    const response = await api.get(`${this.BASE_URL}`);
    return response.data;
  }

  /**
   * الحصول على دور بالمعرف
   * GET /roles/:id
   */
  static async getRoleById(id: string): Promise<UsersApiResponse<Role>> {
    const response = await api.get(`${this.BASE_URL}/${id}`);
    return response.data;
  }

  /**
   * الحصول على المستخدمين بالدور
   * GET /roles/:id/users
   */
  static async getUsersByRole(id: string): Promise<UsersApiResponse<any[]>> {
    const response = await api.get(`${this.BASE_URL}/${id}/users`);
    return response.data;
  }

  /**
   * تحديث دور
   * PATCH /roles/:id
   */
  static async updateRole(
    id: string,
    data: UpdateRoleDto
  ): Promise<UsersApiResponse<Role>> {
    const response = await api.patch(`${this.BASE_URL}/${id}`, data);
    return response.data;
  }

  /**
   * حذف دور
   * DELETE /roles/:id
   */
  static async deleteRole(id: string): Promise<UsersApiResponse<{ message: string }>> {
    const response = await api.delete(`${this.BASE_URL}/${id}`);
    return response.data;
  }

  /**
   * تعيين دور لمستخدم
   * POST /roles/assign
   */
  static async assignRoleToUser(
    data: AssignRoleDto
  ): Promise<UsersApiResponse<{ message: string }>> {
    const response = await api.post(`${this.BASE_URL}/assign`, data);
    return response.data;
  }

  /**
   * الحصول على إحصائيات الأدوار
   * GET /roles/stats
   */
  static async getRoleStats(): Promise<UsersApiResponse<RoleStats>> {
    const response = await api.get(`${this.BASE_URL}/stats`);
    return response.data;
  }
}
