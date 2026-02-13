import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as returnsApi from './returns';
import type { ReturnsFilters, CreditNotesFilters, CreateReturnDto } from './types';

// Query Keys
export const returnsKeys = {
  all: ['returns'] as const,
  returns: (filters?: ReturnsFilters) => [...returnsKeys.all, 'list', filters] as const,
  return: (id: string) => [...returnsKeys.all, 'detail', id] as const,
  creditNotes: (filters?: CreditNotesFilters) => [...returnsKeys.all, 'credit-notes', filters] as const,
  creditNote: (id: string) => [...returnsKeys.all, 'credit-note', id] as const,
  stats: () => [...returnsKeys.all, 'stats'] as const,
};

// Returns Hooks
export const useReturns = (filters?: ReturnsFilters) => {
  return useQuery({
    queryKey: returnsKeys.returns(filters),
    queryFn: () => returnsApi.getReturns(filters),
  });
};

export const useReturn = (id: string) => {
  return useQuery({
    queryKey: returnsKeys.return(id),
    queryFn: () => returnsApi.getReturn(id),
    enabled: !!id,
  });
};

export const useCreateReturn = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateReturnDto) => returnsApi.createReturn(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: returnsKeys.returns() });
    },
  });
};

export const useConfirmReturn = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => returnsApi.confirmReturn(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: returnsKeys.returns() });
      queryClient.invalidateQueries({ queryKey: returnsKeys.return(id) });
    },
  });
};

export const useCancelReturn = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      returnsApi.cancelReturn(id, reason),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: returnsKeys.returns() });
      queryClient.invalidateQueries({ queryKey: returnsKeys.return(id) });
    },
  });
};

export const useProcessRefund = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof returnsApi.processRefund>[1] }) =>
      returnsApi.processRefund(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: returnsKeys.returns() });
      queryClient.invalidateQueries({ queryKey: returnsKeys.return(id) });
      queryClient.invalidateQueries({ queryKey: returnsKeys.creditNotes() });
    },
  });
};

// Credit Notes Hooks
export const useCreditNotes = (filters?: CreditNotesFilters) => {
  return useQuery({
    queryKey: returnsKeys.creditNotes(filters),
    queryFn: () => returnsApi.getCreditNotes(filters),
  });
};

export const useCreditNote = (id: string) => {
  return useQuery({
    queryKey: returnsKeys.creditNote(id),
    queryFn: () => returnsApi.getCreditNote(id),
    enabled: !!id,
  });
};

export const useApplyCreditNote = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ creditNoteId, salesInvoiceId, amount }: {
      creditNoteId: string;
      salesInvoiceId: string;
      amount: number;
    }) => returnsApi.applyCreditNote(creditNoteId, salesInvoiceId, amount),
    onSuccess: (_, { creditNoteId }) => {
      queryClient.invalidateQueries({ queryKey: returnsKeys.creditNotes() });
      queryClient.invalidateQueries({ queryKey: returnsKeys.creditNote(creditNoteId) });
    },
  });
};

export const useCancelCreditNote = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      returnsApi.cancelCreditNote(id, reason),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: returnsKeys.creditNotes() });
      queryClient.invalidateQueries({ queryKey: returnsKeys.creditNote(id) });
    },
  });
};

// Statistics Hooks
export const useReturnsStats = () => {
  return useQuery({
    queryKey: returnsKeys.stats(),
    queryFn: returnsApi.getReturnsStats,
  });
};
