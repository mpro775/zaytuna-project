import axios, { AxiosError } from 'axios';
import type { AxiosInstance, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { toast } from 'react-hot-toast';
import { isMockModeEnabled } from '@/config/mock.config';
import { mockApi } from '@/mocks/services/mock-api';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';
const TIMEOUT = parseInt(import.meta.env.VITE_API_TIMEOUT || '10000');

// Types for our API responses
export interface ApiResponse<T = unknown> {
  data: T;
  message?: string;
  statusCode?: number;
}

export interface ApiError {
  message: string;
  statusCode: number;
  errors?: Record<string, string[]>;
}

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Override request method to support mock mode
const originalRequest = api.request.bind(api);
const originalPost = api.post.bind(api);
const originalGet = api.get.bind(api);
const originalPut = api.put.bind(api);
const originalPatch = api.patch.bind(api);
const originalDelete = api.delete.bind(api);

// Track if mock services are loaded
let mockServicesLoaded = false;

// Helper function to handle mock requests
async function handleMockRequest<T = any, R = AxiosResponse<T, any, unknown>, D = any>(
  config: AxiosRequestConfig<D>
): Promise<R> {
  // طلبات Mock تتجاوز معالج الطلبات - تأكد من إضافة التوكن للطلبات المحمية
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers = (config.headers || {}) as Record<string, string>;
      (config.headers as Record<string, string>).Authorization = `Bearer ${token}`;
    }
  }
  // Ensure config has full URL
  if (config.url && !config.url.startsWith('http')) {
    config.url = `${BASE_URL}${config.url.startsWith('/') ? '' : '/'}${config.url}`;
  }
  
  // Initialize mock services if not already done
  if (!mockServicesLoaded) {
    if (import.meta.env.DEV) {
      console.log('📦 Loading mock services...');
    }
    await import('@/mocks/services');
    mockServicesLoaded = true;
    if (import.meta.env.DEV) {
      console.log('✅ Mock services loaded. Handlers:', mockApi.getRegisteredHandlers());
    }
  }
  
  if (import.meta.env.DEV) {
    console.log('🔵 Mock API handling request:', config.method, config.url);
  }
  
  // Handle request through mock API
  return await mockApi.handleRequest(config) as R;
}

// Override request method
api.request = async function <T = any, R = AxiosResponse<T, any, unknown>, D = any>(
  config: AxiosRequestConfig<D>
): Promise<R> {
  // Check if mock mode is enabled
  const mockEnabled = isMockModeEnabled();
  
  if (import.meta.env.DEV) {
    console.log('🔍 Mock mode check:', mockEnabled, 'for', config.method, config.url);
  }
  
  if (mockEnabled) {
    try {
      return await handleMockRequest<T, R, D>(config);
    } catch (error: any) {
      // If mock handler fails, fall through to real API (or rethrow)
      if (error.response) {
        throw error;
      }
      // If no handler found, try real API
      if (import.meta.env.DEV) {
        console.warn('⚠️ Mock handler failed, falling back to real API:', error);
      }
      return originalRequest<T, R, D>(config);
    }
  }
  
  // Use real API
  if (import.meta.env.DEV) {
    console.log('🌐 Using real API for:', config.method, config.url);
  }
  return originalRequest<T, R, D>(config);
};

// Override post method
api.post = async function <T = any, R = AxiosResponse<T, any, unknown>, D = any>(
  url: string,
  data?: D,
  config?: AxiosRequestConfig<D>
): Promise<R> {
  const mockEnabled = isMockModeEnabled();
  
  if (import.meta.env.DEV) {
    console.log('📮 api.post called:', url, 'Mock enabled:', mockEnabled);
  }
  
  if (mockEnabled) {
    try {
      const mockConfig: AxiosRequestConfig<D> = { ...config, method: 'POST', url };
      if (data !== undefined) {
        mockConfig.data = data;
      }
      return await handleMockRequest<T, R, D>(mockConfig);
    } catch (error: any) {
      if (import.meta.env.DEV) {
        console.error('❌ Mock post failed:', error);
      }
      if (error.response) {
        throw error;
      }
      return originalPost<T, R, D>(url, data, config);
    }
  }
  
  if (import.meta.env.DEV) {
    console.log('🌐 Using real API for POST:', url);
  }
  return originalPost<T, R, D>(url, data, config);
};

// Override get method
api.get = async function <T = any, R = AxiosResponse<T, any, unknown>, D = any>(
  url: string,
  config?: AxiosRequestConfig<D>
): Promise<R> {
  if (isMockModeEnabled()) {
    try {
      return await handleMockRequest<T, R, D>({ ...config, method: 'GET', url });
    } catch (error: any) {
      if (error.response) {
        throw error;
      }
      return originalGet<T, R, D>(url, config);
    }
  }
  return originalGet<T, R, D>(url, config);
};

// Override put method
api.put = async function <T = any, R = AxiosResponse<T, any, unknown>, D = any>(
  url: string,
  data?: D,
  config?: AxiosRequestConfig<D>
): Promise<R> {
  if (isMockModeEnabled()) {
    try {
      const mockConfig: AxiosRequestConfig<D> = { ...config, method: 'PUT', url };
      if (data !== undefined) {
        mockConfig.data = data;
      }
      return await handleMockRequest<T, R, D>(mockConfig);
    } catch (error: any) {
      if (error.response) {
        throw error;
      }
      return originalPut<T, R, D>(url, data, config);
    }
  }
  return originalPut<T, R, D>(url, data, config);
};

// Override patch method
api.patch = async function <T = any, R = AxiosResponse<T, any, unknown>, D = any>(
  url: string,
  data?: D,
  config?: AxiosRequestConfig<D>
): Promise<R> {
  if (isMockModeEnabled()) {
    try {
      const mockConfig: AxiosRequestConfig<D> = { ...config, method: 'PATCH', url };
      if (data !== undefined) {
        mockConfig.data = data;
      }
      return await handleMockRequest<T, R, D>(mockConfig);
    } catch (error: any) {
      if (error.response) {
        throw error;
      }
      return originalPatch<T, R, D>(url, data, config);
    }
  }
  return originalPatch<T, R, D>(url, data, config);
};

// Override delete method
api.delete = async function <T = any, R = AxiosResponse<T, any, unknown>, D = any>(
  url: string,
  config?: AxiosRequestConfig<D>
): Promise<R> {
  if (isMockModeEnabled()) {
    try {
      return await handleMockRequest<T, R, D>({ ...config, method: 'DELETE', url });
    } catch (error: any) {
      if (error.response) {
        throw error;
      }
      return originalDelete<T, R, D>(url, config);
    }
  }
  return originalDelete<T, R, D>(url, config);
};

// Request interceptor for adding auth token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
    const token = localStorage.getItem('accessToken');

    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Add request ID for tracing
    if (config.headers) {
      config.headers['X-Request-ID'] = Date.now().toString();
    }

    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response interceptor for handling errors and token refresh
api.interceptors.response.use(
  (response: AxiosResponse): AxiosResponse => {
    return response;
  },
  async (error: AxiosError): Promise<AxiosResponse | AxiosError | undefined> => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

    // Handle network errors
    if (!error.response) {
      toast.error('خطأ في الشبكة. يرجى التحقق من اتصال الإنترنت.');
      return Promise.reject(error);
    }

    const { status, data } = error.response;
    const errorMessage = (data as { message?: string })?.message || 'حدث خطأ غير متوقع';

    // Handle unauthorized errors - لا تحاول refresh إذا كان الطلب الفاشل هو طلب refresh نفسه
    const isRefreshRequest = originalRequest.url?.includes('/auth/refresh') ?? false;
    if (status === 401 && !originalRequest._retry && !isRefreshRequest) {
      originalRequest._retry = true;

      try {
        // Try to refresh token - استخدم api بدل axios ليدعم وضع Mock
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          const response = await api.post<{ data?: { accessToken: string; refreshToken: string }; accessToken?: string; refreshToken?: string }>('/auth/refresh', {
            refreshToken,
          });

          // دعم هيكل الاستجابة: { data: { data: {...} } } أو { data: {...} }
          const responseData = (response.data as { data?: { accessToken: string; refreshToken: string } })?.data ?? response.data as { accessToken: string; refreshToken: string };
          const { accessToken, refreshToken: newRefreshToken } = responseData;

          if (accessToken && newRefreshToken) {
            // Save new tokens
            localStorage.setItem('accessToken', accessToken);
            localStorage.setItem('refreshToken', newRefreshToken);

            // Retry original request with new token
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${accessToken}`;
            }

            return api(originalRequest);
          }
        }
      } catch (refreshError) {
        // Refresh failed, redirect to login
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    // Handle specific error codes
    switch (status) {
      case 400:
        toast.error('بيانات غير صحيحة. يرجى التحقق من المدخلات.');
        break;
      case 403:
        toast.error('ليس لديك صلاحية للوصول إلى هذا المورد.');
        break;
      case 404:
        toast.error('المورد المطلوب غير موجود.');
        break;
      case 409:
        toast.error('حدث تعارض في البيانات.');
        break;
      case 422:
        toast.error('بيانات التحقق غير صحيحة.');
        break;
      case 429:
        toast.error('تم تجاوز الحد المسموح من الطلبات. يرجى المحاولة لاحقاً.');
        break;
      case 500:
        toast.error('خطأ في الخادم. يرجى المحاولة لاحقاً.');
        break;
      default:
        toast.error(errorMessage);
    }

    return Promise.reject(error);
  }
);

export default api;
