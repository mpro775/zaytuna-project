import { BranchService } from './branch.service';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';
export declare class BranchController {
    private readonly branchService;
    constructor(branchService: BranchService);
    create(createBranchDto: CreateBranchDto): Promise<import("./branch.service").BranchWithDetails>;
    findAll(companyId?: string): Promise<import("./branch.service").BranchWithDetails[]>;
    getBranchStats(): Promise<{
        totalBranches: number;
        activeBranches: number;
        inactiveBranches: number;
        totalCompanies: number;
        averageBranchesPerCompany: string | number;
        totalUsers: number;
        totalWarehouses: number;
    }>;
    findOne(id: string): Promise<import("./branch.service").BranchWithDetails>;
    getUsersByBranch(id: string): Promise<{
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
    update(id: string, updateBranchDto: UpdateBranchDto): Promise<import("./branch.service").BranchWithDetails>;
    remove(id: string): Promise<{
        message: string;
    }>;
}
