import { api } from '../api';
import {
  SalesInvoice,
  CreateSalesInvoiceDto,
  UpdateSalesInvoiceDto,
  CreatePaymentDto,
  SalesStats,
  SalesFilters,
  SalesApiResponse,
  PaginatedResponse,
} from './types';

/**
 * خدمة المبيعات - Sales Service
 * مرتبطة بـ backend/src/modules/sales
 */
export class SalesService {
  private static readonly BASE_URL = '/sales';

  /**
   * إنشاء فاتورة مبيعات جديدة
   * POST /sales/invoices
   */
  static async createInvoice(
    data: CreateSalesInvoiceDto
  ): Promise<SalesApiResponse<SalesInvoice>> {
    const response = await api.post(`${this.BASE_URL}/invoices`, data);
    return response.data;
  }

  /**
   * الحصول على فواتير المبيعات مع الفلترة
   * GET /sales/invoices
   */
  static async getInvoices(
    filters: SalesFilters = {}
  ): Promise<SalesApiResponse<PaginatedResponse<SalesInvoice>>> {
    const params = new URLSearchParams();

    if (filters.branchId) params.append('branchId', filters.branchId);
    if (filters.customerId) params.append('customerId', filters.customerId);
    if (filters.status) params.append('status', filters.status);
    if (filters.paymentStatus) params.append('paymentStatus', filters.paymentStatus);
    if (filters.limit) params.append('limit', filters.limit.toString());

    const response = await api.get(`${this.BASE_URL}/invoices?${params.toString()}`);
    return response.data;
  }

  /**
   * الحصول على فاتورة مبيعات بالمعرف
   * GET /sales/invoices/:id
   */
  static async getInvoiceById(id: string): Promise<SalesApiResponse<SalesInvoice>> {
    const response = await api.get(`${this.BASE_URL}/invoices/${id}`);
    return response.data;
  }

  /**
   * تحديث فاتورة مبيعات
   * PATCH /sales/invoices/:id
   */
  static async updateInvoice(
    id: string,
    data: UpdateSalesInvoiceDto
  ): Promise<SalesApiResponse<SalesInvoice>> {
    const response = await api.patch(`${this.BASE_URL}/invoices/${id}`, data);
    return response.data;
  }

  /**
   * إلغاء فاتورة مبيعات
   * DELETE /sales/invoices/:id/cancel
   */
  static async cancelInvoice(
    id: string,
    reason: string
  ): Promise<SalesApiResponse<SalesInvoice>> {
    const response = await api.delete(`${this.BASE_URL}/invoices/${id}/cancel`, {
      data: { reason }
    });
    return response.data;
  }

  /**
   * إضافة دفعة لفاتورة
   * POST /sales/invoices/:id/payments
   */
  static async addPayment(
    invoiceId: string,
    data: CreatePaymentDto
  ): Promise<SalesApiResponse<any>> {
    const response = await api.post(`${this.BASE_URL}/invoices/${invoiceId}/payments`, data);
    return response.data;
  }

  /**
   * الحصول على إحصائيات المبيعات
   * GET /sales/stats
   */
  static async getSalesStats(
    branchId?: string,
    startDate?: string,
    endDate?: string
  ): Promise<SalesApiResponse<SalesStats>> {
    const params = new URLSearchParams();

    if (branchId) params.append('branchId', branchId);
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    const response = await api.get(`${this.BASE_URL}/stats?${params.toString()}`);
    return response.data;
  }

  /**
   * طباعة فاتورة مبيعات
   * GET /sales/invoices/:id/print
   */
  static async printInvoice(id: string): Promise<SalesApiResponse<any>> {
    const response = await api.get(`${this.BASE_URL}/invoices/${id}/print`);
    return response.data;
  }

  /**
   * الحصول على فواتير العميل
   * GET /sales/customers/:customerId/invoices
   */
  static async getCustomerInvoices(
    customerId: string
  ): Promise<SalesApiResponse<SalesInvoice[]>> {
    const response = await api.get(`${this.BASE_URL}/customers/${customerId}/invoices`);
    return response.data;
  }

  /**
   * الحصول على فواتير الفرع
   * GET /sales/branches/:branchId/invoices
   */
  static async getBranchInvoices(
    branchId: string
  ): Promise<SalesApiResponse<SalesInvoice[]>> {
    const response = await api.get(`${this.BASE_URL}/branches/${branchId}/invoices`);
    return response.data;
  }
}
