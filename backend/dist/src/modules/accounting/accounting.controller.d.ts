import { AccountingService } from './accounting.service';
import { CreateGLAccountDto } from './dto/create-gl-account.dto';
import { UpdateGLAccountDto } from './dto/update-gl-account.dto';
import { CreateJournalEntryDto } from './dto/create-journal-entry.dto';
export declare class AccountingController {
    private readonly accountingService;
    constructor(accountingService: AccountingService);
    createGLAccount(createGLAccountDto: CreateGLAccountDto): Promise<import("./accounting.service").GLAccountWithDetails>;
    findAllGLAccounts(includeInactive?: string, accountType?: string): Promise<import("./accounting.service").GLAccountWithDetails[]>;
    findGLAccountById(id: string): Promise<import("./accounting.service").GLAccountWithDetails>;
    updateGLAccount(id: string, updateGLAccountDto: UpdateGLAccountDto): Promise<import("./accounting.service").GLAccountWithDetails>;
    removeGLAccount(id: string): Promise<void>;
    createJournalEntry(createJournalEntryDto: CreateJournalEntryDto, req: any): Promise<import("./accounting.service").JournalEntryWithDetails>;
    findAllJournalEntries(status?: string, sourceModule?: string, startDate?: string, endDate?: string, limit?: number): Promise<import("./accounting.service").JournalEntryWithDetails[]>;
    findJournalEntryById(id: string): Promise<import("./accounting.service").JournalEntryWithDetails>;
    postJournalEntry(id: string): Promise<import("./accounting.service").JournalEntryWithDetails>;
    unpostJournalEntry(id: string): Promise<import("./accounting.service").JournalEntryWithDetails>;
    createDefaultSystemAccounts(): Promise<{
        message: string;
    }>;
    getAccountingStats(startDate?: string, endDate?: string): Promise<import("./accounting.service").AccountingStats>;
    createSalesJournalEntry(salesInvoiceId: string, customerId: string, totalAmount: number, taxAmount: number, req: any): Promise<import("./accounting.service").JournalEntryWithDetails>;
    createPurchaseJournalEntry(purchaseInvoiceId: string, supplierId: string, totalAmount: number, taxAmount: number, req: any): Promise<import("./accounting.service").JournalEntryWithDetails>;
    getBalanceSheetReport(asOfDate?: string): {
        message: string;
    };
    getProfitLossReport(startDate: string, endDate: string): {
        message: string;
    };
    getAccountMovementReport(accountId: string, startDate: string, endDate: string): {
        message: string;
    };
    exportTrialBalance(asOfDate?: string): {
        message: string;
    };
    exportJournalEntries(startDate?: string, endDate?: string, format?: string): {
        message: string;
    };
}
