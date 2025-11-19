/**
 * Types for Mock Data System
 */

export interface MockRequest {
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE' | 'PUT';
  url: string;
  params?: Record<string, any>;
  data?: any;
  headers?: Record<string, string>;
}

export interface MockResponse<T = any> {
  data: T;
  message?: string;
  statusCode?: number;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  cursor?: string;
}

export interface FilterParams {
  search?: string;
  [key: string]: any;
}

export interface SortParams {
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface MockDataStore {
  [key: string]: any[];
}

