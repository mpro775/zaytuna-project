import axios from 'axios';
import type { AxiosError, AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { toast } from 'react-hot-toast';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';
const TIMEOUT = Number.parseInt(import.meta.env.VITE_API_TIMEOUT || '10000', 10);

export interface PaginationMeta {
  page?: number;
  limit?: number;
  total?: number;
  totalPages?: number;
}

export interface ApiResponse<T = unknown> {
  success?: boolean;
  data: T;
  message?: string;
  meta?: PaginationMeta;
  statusCode?: number;
}

export interface ApiError {
  message: string;
  code?: string;
  status?: number;
  statusCode?: number;
  details?: unknown;
  errors?: Record<string, string[]>;
}

type FailedRequestConfig = InternalAxiosRequestConfig & { _retry?: boolean };

const api: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: TIMEOUT,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
});

export const normalizeApiError = (error: unknown): ApiError => {
  if (axios.isAxiosError(error)) {
    const responseData = error.response?.data as
      | {
          message?: string | string[];
          code?: string;
          details?: unknown;
          errors?: Record<string, string[]>;
        }
      | undefined;

    const rawMessage = responseData?.message;
    const message = Array.isArray(rawMessage)
      ? rawMessage.join('، ')
      : rawMessage || error.message || 'حدث خطأ غير متوقع';

    return {
      message,
      ...(responseData?.code ? { code: responseData.code } : {}),
      ...(error.response?.status ? { status: error.response.status, statusCode: error.response.status } : {}),
      ...(responseData?.details !== undefined ? { details: responseData.details } : {}),
      ...(responseData?.errors ? { errors: responseData.errors } : {}),
    };
  }

  if (error instanceof Error) {
    return { message: error.message };
  }

  return { message: 'حدث خطأ غير متوقع' };
};

const clearSession = (): void => {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
};

const getErrorToastMessage = (error: ApiError): string => {
  if (!error.status) {
    return 'تعذر الاتصال بالخادم. تحقق من تشغيل الـ Backend والاتصال بالشبكة.';
  }

  switch (error.status) {
    case 400:
    case 422:
      return error.message || 'البيانات المدخلة غير صحيحة.';
    case 403:
      return 'ليست لديك صلاحية لتنفيذ هذه العملية.';
    case 404:
      return 'المورد المطلوب غير موجود.';
    case 409:
      return error.message || 'حدث تعارض في البيانات.';
    case 429:
      return 'تم تجاوز الحد المسموح من الطلبات. حاول لاحقا.';
    case 500:
      return 'حدث خطأ في الخادم. حاول لاحقا.';
    default:
      return error.message;
  }
};

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
    const token = localStorage.getItem('accessToken');

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    config.headers['X-Request-ID'] = crypto.randomUUID?.() ?? Date.now().toString();
    return config;
  },
  (error: AxiosError) => Promise.reject(normalizeApiError(error))
);

api.interceptors.response.use(
  (response: AxiosResponse): AxiosResponse => response,
  async (error: AxiosError): Promise<AxiosResponse> => {
    const originalRequest = error.config as FailedRequestConfig | undefined;
    const apiError = normalizeApiError(error);
    const isRefreshRequest = originalRequest?.url?.includes('/auth/refresh') ?? false;

    if (apiError.status === 401 && originalRequest && !originalRequest._retry && !isRefreshRequest) {
      originalRequest._retry = true;

      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        try {
          const refreshResponse = await axios.post<ApiResponse<{ accessToken: string; refreshToken: string }>>(
            `${BASE_URL}/auth/refresh`,
            { refreshToken },
            { headers: { Accept: 'application/json', 'Content-Type': 'application/json' }, timeout: TIMEOUT }
          );

          const tokens = refreshResponse.data.data;
          localStorage.setItem('accessToken', tokens.accessToken);
          localStorage.setItem('refreshToken', tokens.refreshToken);
          originalRequest.headers.Authorization = `Bearer ${tokens.accessToken}`;

          return api(originalRequest);
        } catch (refreshError) {
          clearSession();
          window.dispatchEvent(new Event('zaytun-soft:session-expired'));
          if (window.location.pathname !== '/login') {
            window.location.assign('/login');
          }
          return Promise.reject(normalizeApiError(refreshError));
        }
      }

      clearSession();
      window.dispatchEvent(new Event('zaytun-soft:session-expired'));
      if (window.location.pathname !== '/login') {
        window.location.assign('/login');
      }
    }

    toast.error(getErrorToastMessage(apiError));
    return Promise.reject(apiError);
  }
);

export default api;
