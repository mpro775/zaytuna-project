import { CustomerService } from './customer.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
export declare class CustomerController {
    private readonly customerService;
    constructor(customerService: CustomerService);
    create(createCustomerDto: CreateCustomerDto): Promise<import("./customer.service").CustomerWithDetails>;
    findAll(search?: string, isActive?: string, loyaltyTier?: string, limit?: number): Promise<import("./customer.service").CustomerWithDetails[]>;
    searchCustomers(query: string, loyaltyTier?: string, minPurchases?: number, maxPurchases?: number, hasMarketingConsent?: string, gender?: string, limit?: number): Promise<import("./customer.service").CustomerWithDetails[]>;
    findOne(id: string): Promise<import("./customer.service").CustomerWithDetails>;
    update(id: string, updateCustomerDto: UpdateCustomerDto): Promise<import("./customer.service").CustomerWithDetails>;
    remove(id: string): Promise<void>;
    getLoyaltyStats(id: string): Promise<import("./customer.service").CustomerLoyaltyStats>;
    updateLoyaltyPoints(id: string, pointsChange: number, reason: string): Promise<import("./customer.service").CustomerWithDetails>;
    getCustomerStats(startDate?: string, endDate?: string): Promise<{
        overview: {
            total: number;
            active: number;
            inactive: number;
            totalLoyaltyPoints: number;
            newThisMonth: number;
        };
        tierBreakdown: Record<string, number>;
        topCustomers: {
            id: string;
            name: string;
            totalPurchases: number;
            tier: string;
        }[];
    }>;
    getTopCustomers(limit?: number): {
        message: string;
    };
    exportCustomers(filters?: string): {
        message: string;
    };
    sendMarketingMessage(customerIds: string[], message: string, subject?: string): {
        message: string;
    };
}
