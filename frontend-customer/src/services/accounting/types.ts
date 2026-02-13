// Accounting Service Types - مرتبط بـ backend/src/modules/accounting


export interface GLAccount {
  id: string;
  accountCode: string;
  name: string;
  description?: string;
  accountType: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
  parentId?: string;
  parent?: GLAccount;
  children: GLAccount[];
  isActive: boolean;
  isSystem: boolean;
  debitBalance: number;
  creditBalance: number;
  netBalance: number;
  createdAt: string;
  updatedAt: string;
}

export interface JournalEntryLine {
  id: string;
  journalEntryId: string;
  lineNumber: number;
  debitAccountId: string;
  debitAccount: {
    id: string;
    accountCode: string;
    name: string;
  };
  creditAccountId: string;
  creditAccount: {
    id: string;
    accountCode: string;
    name: string;
  };
  amount: number;
  description?: string;
  referenceType?: string;
  referenceId?: string;
  createdAt: string;
}

export interface JournalEntry {
  id: string;
  entryNumber: string;
  entryDate: string;
  description: string;
  referenceType?: string;
  referenceId?: string;
  sourceModule?: string;
  status: 'draft' | 'posted';
  isSystem: boolean;
  totalDebit: number;
  totalCredit: number;
  isBalanced: boolean;
  createdBy?: string;
  creator?: {
    id: string;
    username: string;
    email: string;
  };
  lines: JournalEntryLine[];
  createdAt: string;
  updatedAt: string;
}

export interface AccountingStats {
  glAccounts: {
    total: number;
    active: number;
    byType: Record<string, number>;
  };
  journalEntries: {
    total: number;
    posted: number;
    draft: number;
    system: number;
    manual: number;
  };
  balances: {
    totalAssets: number;
    totalLiabilities: number;
    totalEquity: number;
    totalRevenue: number;
    totalExpenses: number;
    netProfit: number;
  };
}

export interface BalanceSheetReport {
  assets: {
    currentAssets: number;
    fixedAssets: number;
    totalAssets: number;
  };
  liabilities: {
    currentLiabilities: number;
    longTermLiabilities: number;
    totalLiabilities: number;
  };
  equity: {
    capital: number;
    retainedEarnings: number;
    totalEquity: number;
  };
  totalLiabilitiesAndEquity: number;
}

export interface ProfitLossReport {
  revenue: {
    salesRevenue: number;
    otherIncome: number;
    totalRevenue: number;
  };
  expenses: {
    costOfGoodsSold: number;
    operatingExpenses: number;
    totalExpenses: number;
  };
  netProfit: number;
  grossMargin: number;
  netMargin: number;
}

export interface AccountMovementReport {
  accountId: string;
  accountCode: string;
  accountName: string;
  movements: Array<{
    date: string;
    description: string;
    debit: number;
    credit: number;
    balance: number;
    referenceType?: string;
    referenceId?: string;
  }>;
  summary: {
    openingBalance: number;
    totalDebits: number;
    totalCredits: number;
    closingBalance: number;
  };
}

export interface CreateGLAccountDto {
  accountCode: string;
  name: string;
  description?: string;
  accountType: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
  parentId?: string;
  isActive?: boolean;
  isSystem?: boolean;
}

export interface UpdateGLAccountDto {
  accountCode?: string;
  name?: string;
  description?: string;
  accountType?: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
  parentId?: string;
  isActive?: boolean;
}

export interface CreateJournalEntryLineDto {
  debitAccountId: string;
  creditAccountId: string;
  amount: number;
  description?: string;
  referenceType?: string;
  referenceId?: string;
}

export interface CreateJournalEntryDto {
  entryNumber: string;
  entryDate?: string;
  description: string;
  referenceType?: string;
  referenceId?: string;
  sourceModule?: string;
  status?: 'draft' | 'posted';
  isSystem?: boolean;
  lines: CreateJournalEntryLineDto[];
}

export interface AccountingFilters {
  search?: string;
  includeInactive?: boolean;
  accountType?: string;
  status?: string;
  sourceModule?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
}

export interface AccountingApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

