import { PrismaService } from '../../shared/database/prisma.service';
import { CacheService } from '../../shared/cache/cache.service';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';
export interface BranchWithDetails {
    id: string;
    name: string;
    code: string;
    address?: string;
    phone?: string;
    email?: string;
    managerId?: string;
    companyId: string;
    isActive: boolean;
    company: {
        id: string;
        name: string;
    };
    warehouseCount: number;
    userCount: number;
    createdAt: Date;
    updatedAt: Date;
}
export declare class BranchService {
    private readonly prisma;
    private readonly cacheService;
    private readonly logger;
    private readonly branchesCacheKey;
    private readonly branchCacheKey;
    constructor(prisma: PrismaService, cacheService: CacheService);
    create(createBranchDto: CreateBranchDto): Promise<BranchWithDetails>;
    findAll(companyId?: string): Promise<BranchWithDetails[]>;
    findOne(id: string): Promise<BranchWithDetails>;
    update(id: string, updateBranchDto: UpdateBranchDto): Promise<BranchWithDetails>;
    remove(id: string): Promise<{
        message: string;
    }>;
    getUsersByBranch(branchId: string): Promise<{
        id: string;
        phone: string | null;
        email: string;
        createdAt: Date;
        role: {
            id: string;
            name: string;
        };
        username: string;
    }[]>;
    getBranchStats(): Promise<{
        totalBranches: number;
        activeBranches: number;
        inactiveBranches: number;
        totalCompanies: number;
        averageBranchesPerCompany: string | number;
        totalUsers: number;
        totalWarehouses: number;
    }>;
    private invalidateBranchesCache;
}
