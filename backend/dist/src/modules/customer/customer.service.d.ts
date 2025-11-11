import { PrismaService } from '../../shared/database/prisma.service';
import { CacheService } from '../../shared/cache/cache.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
export interface CustomerWithDetails {
    id: string;
    name: string;
    phone?: string;
    email?: string;
    address?: string;
    taxNumber?: string;
    creditLimit?: number;
    loyaltyPoints: number;
    loyaltyTier: string;
    totalPurchases: number;
    lastPurchaseDate?: Date;
    preferredPaymentMethod?: string;
    birthday?: Date;
    gender?: string;
    marketingConsent: boolean;
    isActive: boolean;
    totalInvoices: number;
    totalReturns: number;
    totalPaid: number;
    outstandingBalance: number;
    createdAt: Date;
    updatedAt: Date;
}
export interface CustomerLoyaltyStats {
    currentTier: string;
    pointsToNextTier: number;
    nextTier: string;
    tierBenefits: string[];
    recentTransactions: Array<{
        id: string;
        type: 'sale' | 'return' | 'payment';
        amount: number;
        pointsEarned: number;
        date: Date;
    }>;
}
export declare class CustomerService {
    private readonly prisma;
    private readonly cacheService;
    private readonly logger;
    private readonly customersCacheKey;
    private readonly customerCacheKey;
    private readonly loyaltyTiers;
    constructor(prisma: PrismaService, cacheService: CacheService);
    create(createCustomerDto: CreateCustomerDto): Promise<CustomerWithDetails>;
    findAll(search?: string, isActive?: boolean, loyaltyTier?: string, limit?: number): Promise<CustomerWithDetails[]>;
    findOne(id: string): Promise<CustomerWithDetails>;
    update(id: string, updateCustomerDto: UpdateCustomerDto): Promise<CustomerWithDetails>;
    remove(id: string): Promise<void>;
    updateLoyaltyPoints(customerId: string, pointsChange: number, reason: string): Promise<CustomerWithDetails>;
    updateCustomerStatsOnSale(customerId: string, saleAmount: number, paymentMethod?: string): Promise<void>;
    getLoyaltyStats(customerId: string): Promise<CustomerLoyaltyStats>;
    getCustomerStats(startDate?: Date, endDate?: Date): Promise<{
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
    searchCustomers(query: string, filters?: {
        loyaltyTier?: string;
        minPurchases?: number;
        maxPurchases?: number;
        hasMarketingConsent?: boolean;
        gender?: string;
    }, limit?: number): Promise<CustomerWithDetails[]>;
    private buildCustomerWithDetails;
    private calculateLoyaltyTier;
    private getNextTierInfo;
    private invalidateCustomersCache;
}
