import { ReturnsService } from './returns.service';
import { CreateReturnDto } from './dto/create-return.dto';
import { UpdateReturnDto } from './dto/update-return.dto';
import { CreateCreditNoteDto } from './dto/create-credit-note.dto';
export declare class ReturnsController {
    private readonly returnsService;
    constructor(returnsService: ReturnsService);
    createReturn(createReturnDto: CreateReturnDto, req: any): Promise<import("./returns.service").ReturnWithDetails>;
    findAllReturns(salesInvoiceId?: string, customerId?: string, status?: string, refundStatus?: string, limit?: number): Promise<import("./returns.service").ReturnWithDetails[]>;
    findOneReturn(id: string): Promise<import("./returns.service").ReturnWithDetails>;
    updateReturn(id: string, updateReturnDto: UpdateReturnDto): Promise<import("./returns.service").ReturnWithDetails>;
    cancelReturn(id: string, reason: string, req: any): Promise<import("./returns.service").ReturnWithDetails>;
    createCreditNote(id: string, createCreditNoteDto: CreateCreditNoteDto, req: any): Promise<any>;
    getReturnsStats(startDate?: string, endDate?: string): Promise<{
        totalReturns: number;
        confirmedReturns: number;
        cancelledReturns: number;
        totalReturnValue: number;
        totalCreditNotes: number;
        refundedReturns: number;
        pendingRefunds: number;
        averageReturnValue: number;
    }>;
    getSalesInvoiceReturns(salesInvoiceId: string): Promise<import("./returns.service").ReturnWithDetails[]>;
    getCustomerReturns(customerId: string): Promise<import("./returns.service").ReturnWithDetails[]>;
}
