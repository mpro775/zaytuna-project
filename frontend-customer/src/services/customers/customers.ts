import { api } from '../api';
import type { ApiResponse } from '../api';

// Customer types
export interface Customer {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  taxNumber?: string;
  creditLimit?: number;
  birthday?: string;
  gender?: 'male' | 'female' | 'other';
  marketingConsent?: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  // Loyalty related fields
  loyaltyPoints?: number;
  loyaltyTier?: 'bronze' | 'silver' | 'gold' | 'platinum';
  totalPurchases?: number;
  lastPurchaseDate?: string;
}

export interface CreateCustomerDto {
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  taxNumber?: string;
  creditLimit?: number;
  birthday?: string;
  gender?: 'male' | 'female' | 'other';
  marketingConsent?: boolean;
  isActive?: boolean;
}

export interface UpdateCustomerDto {
  name?: string;
  phone?: string;
  email?: string;
  address?: string;
  taxNumber?: string;
  creditLimit?: number;
  birthday?: string;
  gender?: 'male' | 'female' | 'other';
  marketingConsent?: boolean;
  isActive?: boolean;
}

export interface CustomerFilters {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
  loyaltyTier?: string;
  gender?: string;
  hasMarketingConsent?: boolean;
  minPurchases?: number;
  maxPurchases?: number;
}

export interface CustomersResponse {
  data: Customer[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CustomerStats {
  totalCustomers: number;
  activeCustomers: number;
  inactiveCustomers: number;
  totalLoyaltyPoints: number;
  averagePurchaseValue: number;
  topTierDistribution: {
    bronze: number;
    silver: number;
    gold: number;
    platinum: number;
  };
}

export interface LoyaltyStats {
  currentPoints: number;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  nextTierThreshold?: number;
  pointsToNextTier?: number;
  totalPurchases: number;
  lastPurchaseDate?: string;
  tierBenefits: string[];
}

export interface CustomerSearchFilters {
  loyaltyTier?: string;
  minPurchases?: number;
  maxPurchases?: number;
  hasMarketingConsent?: boolean;
  gender?: string;
}

// API functions
export const customersApi = {
  // Get all customers
  getCustomers: async (filters: CustomerFilters = {}): Promise<CustomersResponse> => {
    const response = await api.get<ApiResponse<CustomersResponse>>('/customers', { params: filters });
    return response.data.data;
  },

  // Search customers
  searchCustomers: async (query: string, filters: CustomerSearchFilters = {}, limit?: number): Promise<CustomersResponse> => {
    const params = {
      query,
      ...filters,
      limit: limit || 50,
    };
    const response = await api.get<ApiResponse<CustomersResponse>>('/customers/search', { params });
    return response.data.data;
  },

  // Get customer by ID
  getCustomer: async (id: string): Promise<Customer> => {
    const response = await api.get<ApiResponse<Customer>>(`/customers/${id}`);
    return response.data.data;
  },

  // Create customer
  createCustomer: async (data: CreateCustomerDto): Promise<Customer> => {
    const response = await api.post<ApiResponse<Customer>>('/customers', data);
    return response.data.data;
  },

  // Update customer
  updateCustomer: async (id: string, data: UpdateCustomerDto): Promise<Customer> => {
    const response = await api.patch<ApiResponse<Customer>>(`/customers/${id}`, data);
    return response.data.data;
  },

  // Delete customer
  deleteCustomer: async (id: string): Promise<void> => {
    await api.delete(`/customers/${id}`);
  },

  // Get customer statistics
  getCustomerStats: async (startDate?: string, endDate?: string): Promise<CustomerStats> => {
    const params = { startDate, endDate };
    const response = await api.get<ApiResponse<CustomerStats>>('/customers/stats/overview', { params });
    return response.data.data;
  },

  // Get customer loyalty stats
  getLoyaltyStats: async (customerId: string): Promise<LoyaltyStats> => {
    const response = await api.get<ApiResponse<LoyaltyStats>>(`/customers/${customerId}/loyalty`);
    return response.data.data;
  },

  // Update customer loyalty points
  updateLoyaltyPoints: async (customerId: string, pointsChange: number, reason: string): Promise<Customer> => {
    const response = await api.patch<ApiResponse<Customer>>(`/customers/${customerId}/loyalty-points`, {
      pointsChange,
      reason,
    });
    return response.data.data;
  },

  // Get top customers
  getTopCustomers: async (limit?: number): Promise<Customer[]> => {
    const params = { limit: limit || 10 };
    const response = await api.get<ApiResponse<Customer[]>>('/customers/stats/top-customers', { params });
    return response.data.data;
  },

  // Export customers
  exportCustomers: async (filters?: CustomerFilters): Promise<Blob> => {
    const response = await api.get('/customers/export/csv', {
      params: filters,
      responseType: 'blob',
    });
    return response.data;
  },

  // Send marketing message
  sendMarketingMessage: async (customerIds: string[], message: string, subject?: string): Promise<void> => {
    await api.post('/customers/marketing/send', {
      customerIds,
      message,
      subject,
    });
  },
};
