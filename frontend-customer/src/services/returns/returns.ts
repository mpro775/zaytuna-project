import { api } from '../api';
import type {
  Return,
  CreditNote,
  ReturnsFilters,
  CreditNotesFilters,
  CreateReturnDto,
} from './types';

// ============================================
// Returns API
// ============================================

export const getReturns = async (filters?: ReturnsFilters) => {
  const params = new URLSearchParams();
  if (filters?.search) params.append('search', filters.search);
  if (filters?.customerId) params.append('customerId', filters.customerId);
  if (filters?.salesInvoiceId) params.append('salesInvoiceId', filters.salesInvoiceId);
  if (filters?.status) params.append('status', filters.status);
  if (filters?.refundStatus) params.append('refundStatus', filters.refundStatus);
  if (filters?.startDate) params.append('startDate', filters.startDate);
  if (filters?.endDate) params.append('endDate', filters.endDate);
  if (filters?.page) params.append('page', filters.page.toString());
  if (filters?.limit) params.append('limit', filters.limit.toString());

  const response = await api.get(`/returns?${params.toString()}`);
  return response.data;
};

export const getReturn = async (id: string): Promise<Return> => {
  const response = await api.get(`/returns/${id}`);
  return response.data;
};

export const createReturn = async (data: CreateReturnDto): Promise<Return> => {
  const response = await api.post('/returns', data);
  return response.data;
};

export const confirmReturn = async (id: string): Promise<Return> => {
  const response = await api.post(`/returns/${id}/confirm`);
  return response.data;
};

export const cancelReturn = async (id: string, reason: string): Promise<void> => {
  await api.post(`/returns/${id}/cancel`, { reason });
};

export const processRefund = async (id: string, data: {
  refundMethod: 'cash' | 'card' | 'credit_note';
  amount: number;
  notes?: string;
}): Promise<Return> => {
  const response = await api.post(`/returns/${id}/refund`, data);
  return response.data;
};

// ============================================
// Credit Notes API
// ============================================

export const getCreditNotes = async (filters?: CreditNotesFilters) => {
  const params = new URLSearchParams();
  if (filters?.search) params.append('search', filters.search);
  if (filters?.customerId) params.append('customerId', filters.customerId);
  if (filters?.status) params.append('status', filters.status);
  if (filters?.page) params.append('page', filters.page.toString());
  if (filters?.limit) params.append('limit', filters.limit.toString());

  const response = await api.get(`/credit-notes?${params.toString()}`);
  return response.data;
};

export const getCreditNote = async (id: string): Promise<CreditNote> => {
  const response = await api.get(`/credit-notes/${id}`);
  return response.data;
};

export const applyCreditNote = async (creditNoteId: string, salesInvoiceId: string, amount: number) => {
  const response = await api.post(`/credit-notes/${creditNoteId}/apply`, {
    salesInvoiceId,
    amount,
  });
  return response.data;
};

export const cancelCreditNote = async (id: string, reason: string): Promise<void> => {
  await api.post(`/credit-notes/${id}/cancel`, { reason });
};

// ============================================
// Statistics API
// ============================================

export const getReturnsStats = async () => {
  const response = await api.get('/returns/stats');
  return response.data;
};
