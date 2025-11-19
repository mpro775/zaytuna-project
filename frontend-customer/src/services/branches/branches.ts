import { api } from '../api';
import type { ApiResponse } from '../api';

// Branch types
export interface Branch {
  id: string;
  name: string;
  code: string;
  address?: string;
  phone?: string;
  email?: string;
  companyId: string;
  managerId?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  manager?: {
    id: string;
    name: string;
    email: string;
  };
  warehousesCount?: number;
  usersCount?: number;
}

export interface CreateBranchDto {
  name: string;
  code: string;
  address?: string;
  phone?: string;
  email?: string;
  companyId: string;
  managerId?: string;
  isActive?: boolean;
}

export interface UpdateBranchDto {
  name?: string;
  code?: string;
  address?: string;
  phone?: string;
  email?: string;
  managerId?: string;
  isActive?: boolean;
}

export interface BranchFilters {
  page?: number;
  limit?: number;
  search?: string;
  companyId?: string;
  isActive?: boolean;
  sortBy?: 'name' | 'code' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

export interface BranchesResponse {
  data: Branch[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface BranchStats {
  totalBranches: number;
  activeBranches: number;
  inactiveBranches: number;
  totalWarehouses: number;
  totalUsers: number;
}

// API functions
export const branchesApi = {
  // Get all branches
  getBranches: async (filters: BranchFilters = {}): Promise<BranchesResponse> => {
    const response = await api.get<ApiResponse<BranchesResponse>>('/branches', { params: filters });
    return response.data.data;
  },

  // Get branch by ID
  getBranch: async (id: string): Promise<Branch> => {
    const response = await api.get<ApiResponse<Branch>>(`/branches/${id}`);
    return response.data.data;
  },

  // Create branch
  createBranch: async (data: CreateBranchDto): Promise<Branch> => {
    const response = await api.post<ApiResponse<Branch>>('/branches', data);
    return response.data.data;
  },

  // Update branch
  updateBranch: async (id: string, data: UpdateBranchDto): Promise<Branch> => {
    const response = await api.patch<ApiResponse<Branch>>(`/branches/${id}`, data);
    return response.data.data;
  },

  // Delete branch
  deleteBranch: async (id: string): Promise<void> => {
    await api.delete(`/branches/${id}`);
  },

  // Get branch statistics
  getBranchStats: async (): Promise<BranchStats> => {
    const response = await api.get<ApiResponse<BranchStats>>('/branches/stats');
    return response.data.data;
  },

  // Get users by branch
  getUsersByBranch: async (branchId: string): Promise<any[]> => {
    const response = await api.get<ApiResponse<any[]>>(`/branches/${branchId}/users`);
    return response.data.data;
  },

  // Switch to branch (client-side utility)
  switchToBranch: async (branchId: string): Promise<void> => {
    // This would typically update user context/selected branch
    localStorage.setItem('selectedBranchId', branchId);
  },

  // Get current selected branch
  getCurrentBranch: (): string | null => {
    return localStorage.getItem('selectedBranchId');
  },
};
