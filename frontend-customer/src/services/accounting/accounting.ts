import { api } from '../api';
import type {
  GLAccount,
  JournalEntry,
  AccountingStats,
  BalanceSheetReport,
  ProfitLossReport,
  AccountMovementReport,
  CreateGLAccountDto,
  UpdateGLAccountDto,
  CreateJournalEntryDto,
  AccountingFilters,
  AccountingApiResponse,
} from './types';

/**
 * خدمة المحاسبة - Accounting Service
 * مرتبطة بـ backend/src/modules/accounting/accounting.controller.ts
 */
export class AccountingService {
  private static readonly BASE_URL = '/accounting';

  // ========== GL ACCOUNTS ENDPOINTS ==========

  /**
   * إنشاء حساب GL جديد
   * POST /accounting/gl-accounts
   */
  static async createGLAccount(data: CreateGLAccountDto): Promise<AccountingApiResponse<GLAccount>> {
    const response = await api.post(`${this.BASE_URL}/gl-accounts`, data);
    return response.data;
  }

  /**
   * الحصول على حسابات GL مع الفلترة
   * GET /accounting/gl-accounts
   */
  static async getGLAccounts(filters: AccountingFilters = {}): Promise<AccountingApiResponse<GLAccount[]>> {
    const params = new URLSearchParams();

    if (filters.includeInactive !== undefined) {
      params.append('includeInactive', filters.includeInactive.toString());
    }
    if (filters.accountType) params.append('accountType', filters.accountType);

    const response = await api.get(`${this.BASE_URL}/gl-accounts?${params.toString()}`);
    return response.data;
  }

  /**
   * الحصول على حساب GL بالمعرف
   * GET /accounting/gl-accounts/:id
   */
  static async getGLAccountById(id: string): Promise<AccountingApiResponse<GLAccount>> {
    const response = await api.get(`${this.BASE_URL}/gl-accounts/${id}`);
    return response.data;
  }

  /**
   * تحديث حساب GL
   * PATCH /accounting/gl-accounts/:id
   */
  static async updateGLAccount(
    id: string,
    data: UpdateGLAccountDto
  ): Promise<AccountingApiResponse<GLAccount>> {
    const response = await api.patch(`${this.BASE_URL}/gl-accounts/${id}`, data);
    return response.data;
  }

  /**
   * حذف حساب GL
   * DELETE /accounting/gl-accounts/:id
   */
  static async deleteGLAccount(id: string): Promise<AccountingApiResponse<{ message: string }>> {
    const response = await api.delete(`${this.BASE_URL}/gl-accounts/${id}`);
    return response.data;
  }

  // ========== JOURNAL ENTRIES ENDPOINTS ==========

  /**
   * إنشاء قيد يومي جديد
   * POST /accounting/journal-entries
   */
  static async createJournalEntry(data: CreateJournalEntryDto): Promise<AccountingApiResponse<JournalEntry>> {
    const response = await api.post(`${this.BASE_URL}/journal-entries`, data);
    return response.data;
  }

  /**
   * الحصول على القيود اليومية مع الفلترة
   * GET /accounting/journal-entries
   */
  static async getJournalEntries(filters: AccountingFilters = {}): Promise<AccountingApiResponse<JournalEntry[]>> {
    const params = new URLSearchParams();

    if (filters.search) params.append('search', filters.search);
    if (filters.status) params.append('status', filters.status);
    if (filters.sourceModule) params.append('sourceModule', filters.sourceModule);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    if (filters.limit) params.append('limit', filters.limit.toString());

    const response = await api.get(`${this.BASE_URL}/journal-entries?${params.toString()}`);
    return response.data;
  }

  /**
   * الحصول على قيد يومي بالمعرف
   * GET /accounting/journal-entries/:id
   */
  static async getJournalEntryById(id: string): Promise<AccountingApiResponse<JournalEntry>> {
    const response = await api.get(`${this.BASE_URL}/journal-entries/${id}`);
    return response.data;
  }

  /**
   * اعتماد قيد يومي
   * PATCH /accounting/journal-entries/:id/post
   */
  static async postJournalEntry(id: string): Promise<AccountingApiResponse<JournalEntry>> {
    const response = await api.patch(`${this.BASE_URL}/journal-entries/${id}/post`);
    return response.data;
  }

  /**
   * إلغاء اعتماد قيد يومي
   * PATCH /accounting/journal-entries/:id/unpost
   */
  static async unpostJournalEntry(id: string): Promise<AccountingApiResponse<JournalEntry>> {
    const response = await api.patch(`${this.BASE_URL}/journal-entries/${id}/unpost`);
    return response.data;
  }

  // ========== SYSTEM ENDPOINTS ==========

  /**
   * إنشاء حسابات النظام الافتراضية
   * POST /accounting/setup/system-accounts
   */
  static async createDefaultSystemAccounts(): Promise<AccountingApiResponse<{ message: string }>> {
    const response = await api.post(`${this.BASE_URL}/setup/system-accounts`);
    return response.data;
  }

  /**
   * الحصول على إحصائيات المحاسبة
   * GET /accounting/stats/overview
   */
  static async getAccountingStats(filters: AccountingFilters = {}): Promise<AccountingApiResponse<AccountingStats>> {
    const params = new URLSearchParams();

    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);

    const response = await api.get(`${this.BASE_URL}/stats/overview?${params.toString()}`);
    return response.data;
  }

  // ========== AUTOMATIC JOURNAL ENTRIES ==========

  /**
   * إنشاء قيد تلقائي للمبيعات
   * POST /accounting/auto/sales/:salesInvoiceId
   */
  static async createSalesJournalEntry(
    salesInvoiceId: string,
    customerId: string,
    totalAmount: number,
    taxAmount: number
  ): Promise<AccountingApiResponse<JournalEntry>> {
    const response = await api.post(`${this.BASE_URL}/auto/sales/${salesInvoiceId}`, {
      customerId,
      totalAmount,
      taxAmount,
    });
    return response.data;
  }

  /**
   * إنشاء قيد تلقائي للمشتريات
   * POST /accounting/auto/purchase/:purchaseInvoiceId
   */
  static async createPurchaseJournalEntry(
    purchaseInvoiceId: string,
    supplierId: string,
    totalAmount: number,
    taxAmount: number
  ): Promise<AccountingApiResponse<JournalEntry>> {
    const response = await api.post(`${this.BASE_URL}/auto/purchase/${purchaseInvoiceId}`, {
      supplierId,
      totalAmount,
      taxAmount,
    });
    return response.data;
  }

  // ========== REPORTS ENDPOINTS ==========

  /**
   * تقرير الميزانية العمومية
   * GET /accounting/reports/balance-sheet
   */
  static async getBalanceSheetReport(asOfDate?: string): Promise<AccountingApiResponse<BalanceSheetReport>> {
    const params = new URLSearchParams();
    if (asOfDate) params.append('asOfDate', asOfDate);

    const response = await api.get(`${this.BASE_URL}/reports/balance-sheet?${params.toString()}`);
    return response.data;
  }

  /**
   * تقرير الأرباح والخسائر
   * GET /accounting/reports/profit-loss
   */
  static async getProfitLossReport(
    startDate: string,
    endDate: string
  ): Promise<AccountingApiResponse<ProfitLossReport>> {
    const params = new URLSearchParams();
    params.append('startDate', startDate);
    params.append('endDate', endDate);

    const response = await api.get(`${this.BASE_URL}/reports/profit-loss?${params.toString()}`);
    return response.data;
  }

  /**
   * تقرير حركة الحسابات
   * GET /accounting/reports/account-movement/:accountId
   */
  static async getAccountMovementReport(
    accountId: string,
    startDate: string,
    endDate: string
  ): Promise<AccountingApiResponse<AccountMovementReport>> {
    const params = new URLSearchParams();
    params.append('startDate', startDate);
    params.append('endDate', endDate);

    const response = await api.get(`${this.BASE_URL}/reports/account-movement/${accountId}?${params.toString()}`);
    return response.data;
  }

  // ========== EXPORT ENDPOINTS ==========

  /**
   * تصدير ميزان المراجعة
   * GET /accounting/export/trial-balance
   */
  static async exportTrialBalance(asOfDate?: string): Promise<Blob> {
    const params = new URLSearchParams();
    if (asOfDate) params.append('asOfDate', asOfDate);

    const response = await api.get(`${this.BASE_URL}/export/trial-balance?${params.toString()}`, {
      responseType: 'blob',
    });
    return response.data;
  }

  /**
   * تصدير القيود اليومية
   * GET /accounting/export/journal-entries
   */
  static async exportJournalEntries(
    startDate?: string,
    endDate?: string,
    format: 'excel' | 'pdf' = 'excel'
  ): Promise<Blob> {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    params.append('format', format);

    const response = await api.get(`${this.BASE_URL}/export/journal-entries?${params.toString()}`, {
      responseType: 'blob',
    });
    return response.data;
  }
}
