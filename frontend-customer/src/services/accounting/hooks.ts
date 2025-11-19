import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AccountingService, AccountingFilters } from './accounting';

// Query Keys
export const ACCOUNTING_QUERY_KEYS = {
  all: ['accounting'] as const,
  glAccounts: () => [...ACCOUNTING_QUERY_KEYS.all, 'gl-accounts'] as const,
  glAccount: (id: string) => [...ACCOUNTING_QUERY_KEYS.glAccounts(), id] as const,
  journalEntries: () => [...ACCOUNTING_QUERY_KEYS.all, 'journal-entries'] as const,
  journalEntry: (id: string) => [...ACCOUNTING_QUERY_KEYS.journalEntries(), id] as const,
  stats: () => [...ACCOUNTING_QUERY_KEYS.all, 'stats'] as const,
  reports: () => [...ACCOUNTING_QUERY_KEYS.all, 'reports'] as const,
  balanceSheet: (asOfDate?: string) => [...ACCOUNTING_QUERY_KEYS.reports(), 'balance-sheet', asOfDate] as const,
  profitLoss: (filters: AccountingFilters) => [...ACCOUNTING_QUERY_KEYS.reports(), 'profit-loss', filters] as const,
  accountMovement: (accountId: string, filters: AccountingFilters) => [
    ...ACCOUNTING_QUERY_KEYS.reports(),
    'account-movement',
    accountId,
    filters,
  ] as const,
};

/**
 * GL Accounts Hooks
 */
export const useGLAccounts = (filters: AccountingFilters = {}) => {
  return useQuery({
    queryKey: [...ACCOUNTING_QUERY_KEYS.glAccounts(), filters],
    queryFn: () => AccountingService.getGLAccounts(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useGLAccount = (id: string) => {
  return useQuery({
    queryKey: ACCOUNTING_QUERY_KEYS.glAccount(id),
    queryFn: () => AccountingService.getGLAccountById(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
};

export const useCreateGLAccount = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: AccountingService.createGLAccount,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ACCOUNTING_QUERY_KEYS.glAccounts() });
      queryClient.invalidateQueries({ queryKey: ACCOUNTING_QUERY_KEYS.stats() });
    },
  });
};

export const useUpdateGLAccount = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      AccountingService.updateGLAccount(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ACCOUNTING_QUERY_KEYS.glAccount(id) });
      queryClient.invalidateQueries({ queryKey: ACCOUNTING_QUERY_KEYS.glAccounts() });
    },
  });
};

export const useDeleteGLAccount = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: AccountingService.deleteGLAccount,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ACCOUNTING_QUERY_KEYS.glAccounts() });
      queryClient.invalidateQueries({ queryKey: ACCOUNTING_QUERY_KEYS.stats() });
    },
  });
};

/**
 * Journal Entries Hooks
 */
export const useJournalEntries = (filters: AccountingFilters = {}) => {
  return useQuery({
    queryKey: [...ACCOUNTING_QUERY_KEYS.journalEntries(), filters],
    queryFn: () => AccountingService.getJournalEntries(filters),
    staleTime: 2 * 60 * 1000, // 2 minutes - journal entries change more frequently
  });
};

export const useJournalEntry = (id: string) => {
  return useQuery({
    queryKey: ACCOUNTING_QUERY_KEYS.journalEntry(id),
    queryFn: () => AccountingService.getJournalEntryById(id),
    enabled: !!id,
    staleTime: 2 * 60 * 1000,
  });
};

export const useCreateJournalEntry = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: AccountingService.createJournalEntry,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ACCOUNTING_QUERY_KEYS.journalEntries() });
      queryClient.invalidateQueries({ queryKey: ACCOUNTING_QUERY_KEYS.stats() });
      queryClient.invalidateQueries({ queryKey: ACCOUNTING_QUERY_KEYS.glAccounts() });
      queryClient.invalidateQueries({ queryKey: ACCOUNTING_QUERY_KEYS.reports() });
    },
  });
};

export const usePostJournalEntry = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: AccountingService.postJournalEntry,
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ACCOUNTING_QUERY_KEYS.journalEntry(id) });
      queryClient.invalidateQueries({ queryKey: ACCOUNTING_QUERY_KEYS.journalEntries() });
      queryClient.invalidateQueries({ queryKey: ACCOUNTING_QUERY_KEYS.stats() });
      queryClient.invalidateQueries({ queryKey: ACCOUNTING_QUERY_KEYS.glAccounts() });
      queryClient.invalidateQueries({ queryKey: ACCOUNTING_QUERY_KEYS.reports() });
    },
  });
};

export const useUnpostJournalEntry = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: AccountingService.unpostJournalEntry,
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ACCOUNTING_QUERY_KEYS.journalEntry(id) });
      queryClient.invalidateQueries({ queryKey: ACCOUNTING_QUERY_KEYS.journalEntries() });
      queryClient.invalidateQueries({ queryKey: ACCOUNTING_QUERY_KEYS.stats() });
      queryClient.invalidateQueries({ queryKey: ACCOUNTING_QUERY_KEYS.glAccounts() });
      queryClient.invalidateQueries({ queryKey: ACCOUNTING_QUERY_KEYS.reports() });
    },
  });
};

/**
 * System Setup Hooks
 */
export const useCreateDefaultSystemAccounts = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: AccountingService.createDefaultSystemAccounts,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ACCOUNTING_QUERY_KEYS.glAccounts() });
      queryClient.invalidateQueries({ queryKey: ACCOUNTING_QUERY_KEYS.stats() });
    },
  });
};

/**
 * Statistics Hooks
 */
export const useAccountingStats = (filters: AccountingFilters = {}) => {
  return useQuery({
    queryKey: [...ACCOUNTING_QUERY_KEYS.stats(), filters],
    queryFn: () => AccountingService.getAccountingStats(filters),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

/**
 * Reports Hooks
 */
export const useBalanceSheetReport = (asOfDate?: string) => {
  return useQuery({
    queryKey: ACCOUNTING_QUERY_KEYS.balanceSheet(asOfDate),
    queryFn: () => AccountingService.getBalanceSheetReport(asOfDate),
    staleTime: 10 * 60 * 1000,
  });
};

export const useProfitLossReport = (startDate: string, endDate: string) => {
  return useQuery({
    queryKey: ACCOUNTING_QUERY_KEYS.profitLoss({ startDate, endDate }),
    queryFn: () => AccountingService.getProfitLossReport(startDate, endDate),
    enabled: !!(startDate && endDate),
    staleTime: 10 * 60 * 1000,
  });
};

export const useAccountMovementReport = (accountId: string, startDate: string, endDate: string) => {
  return useQuery({
    queryKey: ACCOUNTING_QUERY_KEYS.accountMovement(accountId, { startDate, endDate }),
    queryFn: () => AccountingService.getAccountMovementReport(accountId, startDate, endDate),
    enabled: !!(accountId && startDate && endDate),
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Export Hooks
 */
export const useExportTrialBalance = () => {
  return useMutation({
    mutationFn: (asOfDate?: string) => AccountingService.exportTrialBalance(asOfDate),
  });
};

export const useExportJournalEntries = () => {
  return useMutation({
    mutationFn: ({ startDate, endDate, format }: {
      startDate?: string;
      endDate?: string;
      format?: 'excel' | 'pdf';
    }) => AccountingService.exportJournalEntries(startDate, endDate, format),
  });
};

/**
 * Utility function to download blob as file
 */
export const downloadBlob = (blob: Blob, filename: string) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};
