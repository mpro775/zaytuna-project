/**
 * Mock Utilities
 * Helper functions for filtering, pagination, searching, and data manipulation
 */

import type { FilterParams } from '../types';

/**
 * Simulate network delay
 */
export const simulateDelay = (min: number = 100, max: number = 500): Promise<void> => {
  const delay = Math.floor(Math.random() * (max - min + 1)) + min;
  return new Promise((resolve) => setTimeout(resolve, delay));
};

/**
 * Generate a unique ID
 */
export const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Filter data based on criteria
 */
export const filterData = <T extends Record<string, any>>(
  data: T[],
  filters: FilterParams
): T[] => {
  let filtered = [...data];

  // Text search
  if (filters.search) {
    const searchTerm = filters.search.toLowerCase();
    filtered = filtered.filter((item) => {
      return Object.values(item).some((value) => {
        if (typeof value === 'string') {
          return value.toLowerCase().includes(searchTerm);
        }
        if (typeof value === 'number') {
          return value.toString().includes(searchTerm);
        }
        return false;
      });
    });
  }

  // Apply other filters
  Object.keys(filters).forEach((key) => {
    if (key === 'search' || key === 'page' || key === 'limit' || key === 'sortBy' || key === 'sortOrder') {
      return;
    }

    const filterValue = filters[key];
    if (filterValue !== undefined && filterValue !== null && filterValue !== '') {
      filtered = filtered.filter((item) => {
        const itemValue = item[key];
        
        // Handle boolean filters
        if (typeof filterValue === 'boolean') {
          return itemValue === filterValue;
        }
        
        // Handle array filters (e.g., categoryId in array)
        if (Array.isArray(filterValue)) {
          return filterValue.includes(itemValue);
        }
        
        // Handle range filters (e.g., minPrice, maxPrice)
        if (key.startsWith('min') && typeof filterValue === 'number') {
          const fieldName = key.replace('min', '').charAt(0).toLowerCase() + key.replace('min', '').slice(1);
          return item[fieldName] >= filterValue;
        }
        if (key.startsWith('max') && typeof filterValue === 'number') {
          const fieldName = key.replace('max', '').charAt(0).toLowerCase() + key.replace('max', '').slice(1);
          return item[fieldName] <= filterValue;
        }
        
        // Exact match
        return itemValue === filterValue || itemValue?.toString() === filterValue?.toString();
      });
    }
  });

  return filtered;
};

/**
 * Sort data
 */
export const sortData = <T extends Record<string, any>>(
  data: T[],
  sortBy?: string,
  sortOrder: 'asc' | 'desc' = 'asc'
): T[] => {
  if (!sortBy) return data;

  const sorted = [...data].sort((a, b) => {
    let aValue = a[sortBy];
    let bValue = b[sortBy];

    // Handle nested properties (e.g., category.name)
    if (sortBy.includes('.')) {
      const keys = sortBy.split('.');
      aValue = keys.reduce((obj, key) => obj?.[key], a);
      bValue = keys.reduce((obj, key) => obj?.[key], b);
    }

    // Handle null/undefined
    if (aValue == null && bValue == null) return 0;
    if (aValue == null) return 1;
    if (bValue == null) return -1;

    // Compare values
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return aValue.localeCompare(bValue, 'ar', { numeric: true });
    }
    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return aValue - bValue;
    }
    if (aValue instanceof Date && bValue instanceof Date) {
      return aValue.getTime() - bValue.getTime();
    }
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      // Try to parse as date
      const aDate = new Date(aValue);
      const bDate = new Date(bValue);
      if (!isNaN(aDate.getTime()) && !isNaN(bDate.getTime())) {
        return aDate.getTime() - bDate.getTime();
      }
    }

    return String(aValue).localeCompare(String(bValue), 'ar', { numeric: true });
  });

  return sortOrder === 'desc' ? sorted.reverse() : sorted;
};

/**
 * Paginate data (offset-based)
 */
export const paginateData = <T>(
  data: T[],
  page: number = 1,
  limit: number = 10
): { data: T[]; total: number; page: number; limit: number; totalPages: number } => {
  const total = data.length;
  const totalPages = Math.ceil(total / limit);
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedData = data.slice(startIndex, endIndex);

  return {
    data: paginatedData,
    total,
    page,
    limit,
    totalPages,
  };
};

/**
 * Search data by text
 */
export const searchData = <T extends Record<string, any>>(
  data: T[],
  query: string,
  fields?: string[]
): T[] => {
  if (!query) return data;

  const searchTerm = query.toLowerCase();
  const searchFields = fields || Object.keys(data[0] || {});

  return data.filter((item) => {
    return searchFields.some((field) => {
      const value = item[field];
      if (value == null) return false;
      
      if (typeof value === 'string') {
        return value.toLowerCase().includes(searchTerm);
      }
      if (typeof value === 'number') {
        return value.toString().includes(searchTerm);
      }
      if (typeof value === 'object' && value !== null) {
        // Handle nested objects (e.g., category.name)
        const stringValue = JSON.stringify(value).toLowerCase();
        return stringValue.includes(searchTerm);
      }
      return false;
    });
  });
};

/**
 * Find related data
 */
export const findRelations = <T extends Record<string, any>>(
  data: T[],
  relationKey: string,
  relationValue: any
): T[] => {
  return data.filter((item) => item[relationKey] === relationValue);
};

/**
 * Simulate error based on error rate
 */
export const simulateError = (errorRate: number): boolean => {
  return Math.random() < errorRate;
};

/**
 * Create error response
 */
export const createErrorResponse = (
  statusCode: number,
  message: string,
  errors?: Record<string, string[]>
) => {
  const error = new Error(message) as any;
  error.statusCode = statusCode;
  error.response = {
    status: statusCode,
    data: {
      message,
      statusCode,
      errors,
    },
  };
  return error;
};

/**
 * Get data from localStorage or return default
 */
export const getMockDataFromStorage = <T>(key: string, defaultValue: T[]): T[] => {
  try {
    const stored = localStorage.getItem(`mockData_${key}`);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.warn(`Failed to load mock data from storage for ${key}:`, error);
  }
  return defaultValue;
};

/**
 * Get single object from localStorage or return default
 */
export const getMockObjectFromStorage = <T>(key: string, defaultValue: T): T => {
  try {
    const stored = localStorage.getItem(`mockData_${key}`);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.warn(`Failed to load mock data from storage for ${key}:`, error);
  }
  return defaultValue;
};

/**
 * Save single object to localStorage
 */
export const saveMockObjectToStorage = <T>(key: string, data: T): void => {
  try {
    localStorage.setItem(`mockData_${key}`, JSON.stringify(data));
  } catch (error) {
    console.warn(`Failed to save mock data to storage for ${key}:`, error);
  }
};

/**
 * Save data to localStorage
 */
export const saveMockDataToStorage = <T>(key: string, data: T[]): void => {
  try {
    localStorage.setItem(`mockData_${key}`, JSON.stringify(data));
  } catch (error) {
    console.warn(`Failed to save mock data to storage for ${key}:`, error);
  }
};

/**
 * Format date for mock data
 */
export const formatDate = (daysAgo: number = 0): string => {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString();
};

/**
 * Generate random date within range
 */
export const randomDate = (startDaysAgo: number, endDaysAgo: number): string => {
  const start = new Date();
  start.setDate(start.getDate() - startDaysAgo);
  const end = new Date();
  end.setDate(end.getDate() - endDaysAgo);
  
  const randomTime = start.getTime() + Math.random() * (end.getTime() - start.getTime());
  return new Date(randomTime).toISOString();
};

/**
 * Generate random number in range
 */
export const randomNumber = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

/**
 * Generate random YER amount
 */
export const randomYER = (min: number, max: number): number => {
  return Math.round((Math.random() * (max - min) + min) / 100) * 100; // Round to nearest 100
};

