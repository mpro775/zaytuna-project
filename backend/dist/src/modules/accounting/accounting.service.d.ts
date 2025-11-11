import { PrismaService } from '../../shared/database/prisma.service';
import { CacheService } from '../../shared/cache/cache.service';
import { CreateGLAccountDto } from './dto/create-gl-account.dto';
import { UpdateGLAccountDto } from './dto/update-gl-account.dto';
import { CreateJournalEntryDto } from './dto/create-journal-entry.dto';
export interface GLAccountWithDetails {
    id: string;
    accountCode: string;
    name: string;
    description?: string;
    accountType: string;
    parentId?: string;
    parent?: GLAccountWithDetails;
    children: GLAccountWithDetails[];
    isActive: boolean;
    isSystem: boolean;
    debitBalance: number;
    creditBalance: number;
    netBalance: number;
    createdAt: Date;
    updatedAt: Date;
}
export interface JournalEntryWithDetails {
    id: string;
    entryNumber: string;
    entryDate: Date;
    description: string;
    referenceType?: string;
    referenceId?: string;
    sourceModule?: string;
    status: string;
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
    lines: JournalEntryLineWithDetails[];
    createdAt: Date;
    updatedAt: Date;
}
export interface JournalEntryLineWithDetails {
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
    createdAt: Date;
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
export declare class AccountingService {
    private readonly prisma;
    private readonly cacheService;
    private readonly logger;
    private readonly glAccountsCacheKey;
    private readonly journalEntriesCacheKey;
    private readonly systemAccounts;
    constructor(prisma: PrismaService, cacheService: CacheService);
    createGLAccount(createGLAccountDto: CreateGLAccountDto): Promise<GLAccountWithDetails>;
    findAllGLAccounts(includeInactive?: boolean, accountType?: string): Promise<GLAccountWithDetails[]>;
    findGLAccountById(id: string): Promise<GLAccountWithDetails>;
    updateGLAccount(id: string, updateGLAccountDto: UpdateGLAccountDto): Promise<GLAccountWithDetails>;
    removeGLAccount(id: string): Promise<void>;
    createJournalEntry(createJournalEntryDto: CreateJournalEntryDto, userId: string): Promise<JournalEntryWithDetails>;
    findAllJournalEntries(status?: string, sourceModule?: string, startDate?: Date, endDate?: Date, limit?: number): Promise<JournalEntryWithDetails[]>;
    findJournalEntryById(id: string): Promise<JournalEntryWithDetails>;
    postJournalEntry(id: string): Promise<JournalEntryWithDetails>;
    unpostJournalEntry(id: string): Promise<JournalEntryWithDetails>;
    getAccountingStats(startDate?: Date, endDate?: Date): Promise<AccountingStats>;
    createDefaultSystemAccounts(): Promise<void>;
    createSalesJournalEntry(salesInvoiceId: string, customerId: string, totalAmount: number, taxAmount: number, userId: string): Promise<JournalEntryWithDetails>;
    createPurchaseJournalEntry(purchaseInvoiceId: string, supplierId: string, totalAmount: number, taxAmount: number, userId: string): Promise<JournalEntryWithDetails>;
    private buildGLAccountWithDetails;
    private buildJournalEntryWithDetails;
    private wouldCreateCycle;
    private invalidateGLAccountsCache;
    private invalidateJournalEntriesCache;
}
