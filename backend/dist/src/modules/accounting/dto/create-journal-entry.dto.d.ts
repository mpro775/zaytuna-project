declare class JournalEntryLineDto {
    debitAccountId: string;
    creditAccountId: string;
    amount: number;
    description?: string;
    referenceType?: string;
    referenceId?: string;
}
export declare class CreateJournalEntryDto {
    entryNumber: string;
    entryDate?: string;
    description: string;
    referenceType?: string;
    referenceId?: string;
    sourceModule?: string;
    status?: string;
    isSystem?: boolean;
    lines: JournalEntryLineDto[];
}
export {};
