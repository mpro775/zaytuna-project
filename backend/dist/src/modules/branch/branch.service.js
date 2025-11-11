"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var BranchService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.BranchService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../shared/database/prisma.service");
const cache_service_1 = require("../../shared/cache/cache.service");
let BranchService = BranchService_1 = class BranchService {
    prisma;
    cacheService;
    logger = new common_1.Logger(BranchService_1.name);
    branchesCacheKey = 'branches';
    branchCacheKey = 'branch';
    constructor(prisma, cacheService) {
        this.prisma = prisma;
        this.cacheService = cacheService;
    }
    async create(createBranchDto) {
        try {
            this.logger.log(`إنشاء فرع جديد: ${createBranchDto.name}`);
            const existingBranch = await this.prisma.branch.findUnique({
                where: { code: createBranchDto.code },
            });
            if (existingBranch) {
                throw new common_1.ConflictException('كود الفرع موجود بالفعل');
            }
            const company = await this.prisma.company.findUnique({
                where: { id: createBranchDto.companyId },
            });
            if (!company) {
                throw new common_1.NotFoundException('الشركة غير موجودة');
            }
            if (createBranchDto.managerId) {
                const manager = await this.prisma.user.findUnique({
                    where: { id: createBranchDto.managerId },
                });
                if (!manager) {
                    throw new common_1.NotFoundException('المدير غير موجود');
                }
            }
            const branch = await this.prisma.branch.create({
                data: {
                    name: createBranchDto.name,
                    code: createBranchDto.code,
                    address: createBranchDto.address,
                    phone: createBranchDto.phone,
                    email: createBranchDto.email,
                    managerId: createBranchDto.managerId,
                    companyId: createBranchDto.companyId,
                    isActive: createBranchDto.isActive ?? true,
                },
                include: {
                    company: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                    _count: {
                        select: {
                            users: true,
                            warehouses: true,
                        },
                    },
                },
            });
            await this.invalidateBranchesCache();
            const branchWithDetails = {
                id: branch.id,
                name: branch.name,
                code: branch.code,
                address: branch.address || undefined,
                phone: branch.phone || undefined,
                email: branch.email || undefined,
                managerId: branch.managerId || undefined,
                companyId: branch.companyId,
                isActive: branch.isActive,
                company: branch.company,
                warehouseCount: branch._count.warehouses,
                userCount: branch._count.users,
                createdAt: branch.createdAt,
                updatedAt: branch.updatedAt,
            };
            this.logger.log(`تم إنشاء الفرع بنجاح: ${branch.name}`);
            return branchWithDetails;
        }
        catch (error) {
            this.logger.error(`فشل في إنشاء الفرع: ${createBranchDto.name}`, error);
            throw error;
        }
    }
    async findAll(companyId) {
        try {
            const cacheKey = companyId ? `${this.branchesCacheKey}:company:${companyId}` : this.branchesCacheKey;
            const cachedBranches = await this.cacheService.get(cacheKey);
            if (cachedBranches) {
                return cachedBranches;
            }
            const where = companyId ? { companyId, isActive: true } : { isActive: true };
            const branches = await this.prisma.branch.findMany({
                where,
                include: {
                    company: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                    _count: {
                        select: {
                            users: true,
                            warehouses: true,
                        },
                    },
                },
                orderBy: { name: 'asc' },
            });
            const branchesWithDetails = branches.map(branch => ({
                id: branch.id,
                name: branch.name,
                code: branch.code,
                address: branch.address || undefined,
                phone: branch.phone || undefined,
                email: branch.email || undefined,
                managerId: branch.managerId || undefined,
                companyId: branch.companyId,
                isActive: branch.isActive,
                company: branch.company,
                warehouseCount: branch._count.warehouses,
                userCount: branch._count.users,
                createdAt: branch.createdAt,
                updatedAt: branch.updatedAt,
            }));
            await this.cacheService.set(cacheKey, branchesWithDetails, { ttl: 600 });
            return branchesWithDetails;
        }
        catch (error) {
            this.logger.error('فشل في الحصول على الفروع', error);
            throw error;
        }
    }
    async findOne(id) {
        try {
            const cacheKey = `${this.branchCacheKey}:${id}`;
            const cachedBranch = await this.cacheService.get(cacheKey);
            if (cachedBranch) {
                return cachedBranch;
            }
            const branch = await this.prisma.branch.findUnique({
                where: { id },
                include: {
                    company: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                    _count: {
                        select: {
                            users: true,
                            warehouses: true,
                        },
                    },
                },
            });
            if (!branch) {
                throw new common_1.NotFoundException('الفرع غير موجود');
            }
            const branchWithDetails = {
                id: branch.id,
                name: branch.name,
                code: branch.code,
                address: branch.address || undefined,
                phone: branch.phone || undefined,
                email: branch.email || undefined,
                managerId: branch.managerId || undefined,
                companyId: branch.companyId,
                isActive: branch.isActive,
                company: branch.company,
                warehouseCount: branch._count.warehouses,
                userCount: branch._count.users,
                createdAt: branch.createdAt,
                updatedAt: branch.updatedAt,
            };
            await this.cacheService.set(cacheKey, branchWithDetails, { ttl: 1800 });
            return branchWithDetails;
        }
        catch (error) {
            this.logger.error(`فشل في الحصول على الفرع: ${id}`, error);
            throw error;
        }
    }
    async update(id, updateBranchDto) {
        try {
            this.logger.log(`تحديث الفرع: ${id}`);
            const existingBranch = await this.prisma.branch.findUnique({
                where: { id },
            });
            if (!existingBranch) {
                throw new common_1.NotFoundException('الفرع غير موجود');
            }
            if (updateBranchDto.code && updateBranchDto.code !== existingBranch.code) {
                const branchWithSameCode = await this.prisma.branch.findUnique({
                    where: { code: updateBranchDto.code },
                });
                if (branchWithSameCode) {
                    throw new common_1.ConflictException('كود الفرع موجود بالفعل');
                }
            }
            if (updateBranchDto.managerId) {
                const manager = await this.prisma.user.findUnique({
                    where: { id: updateBranchDto.managerId },
                });
                if (!manager) {
                    throw new common_1.NotFoundException('المدير غير موجود');
                }
            }
            const branch = await this.prisma.branch.update({
                where: { id },
                data: {
                    name: updateBranchDto.name,
                    code: updateBranchDto.code,
                    address: updateBranchDto.address,
                    phone: updateBranchDto.phone,
                    email: updateBranchDto.email,
                    managerId: updateBranchDto.managerId,
                    isActive: updateBranchDto.isActive,
                },
                include: {
                    company: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                    _count: {
                        select: {
                            users: true,
                            warehouses: true,
                        },
                    },
                },
            });
            await this.invalidateBranchesCache();
            await this.cacheService.delete(`${this.branchCacheKey}:${id}`);
            const branchWithDetails = {
                id: branch.id,
                name: branch.name,
                code: branch.code,
                address: branch.address || undefined,
                phone: branch.phone || undefined,
                email: branch.email || undefined,
                managerId: branch.managerId || undefined,
                companyId: branch.companyId,
                isActive: branch.isActive,
                company: branch.company,
                warehouseCount: branch._count.warehouses,
                userCount: branch._count.users,
                createdAt: branch.createdAt,
                updatedAt: branch.updatedAt,
            };
            this.logger.log(`تم تحديث الفرع بنجاح: ${branch.name}`);
            return branchWithDetails;
        }
        catch (error) {
            this.logger.error(`فشل في تحديث الفرع: ${id}`, error);
            throw error;
        }
    }
    async remove(id) {
        try {
            this.logger.log(`حذف الفرع: ${id}`);
            const branch = await this.prisma.branch.findUnique({
                where: { id },
                include: {
                    _count: {
                        select: {
                            users: true,
                            warehouses: true,
                        },
                    },
                },
            });
            if (!branch) {
                throw new common_1.NotFoundException('الفرع غير موجود');
            }
            if (branch._count.users > 0) {
                throw new common_1.BadRequestException('لا يمكن حذف فرع مرتبط بمستخدمين');
            }
            if (branch._count.warehouses > 0) {
                throw new common_1.BadRequestException('لا يمكن حذف فرع مرتبط بمخازن');
            }
            await this.prisma.branch.delete({
                where: { id },
            });
            await this.invalidateBranchesCache();
            await this.cacheService.delete(`${this.branchCacheKey}:${id}`);
            this.logger.log(`تم حذف الفرع بنجاح: ${branch.name}`);
            return { message: 'تم حذف الفرع بنجاح' };
        }
        catch (error) {
            this.logger.error(`فشل في حذف الفرع: ${id}`, error);
            throw error;
        }
    }
    async getUsersByBranch(branchId) {
        try {
            const users = await this.prisma.user.findMany({
                where: { branchId, isActive: true },
                select: {
                    id: true,
                    username: true,
                    email: true,
                    phone: true,
                    role: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                    createdAt: true,
                },
                orderBy: { username: 'asc' },
            });
            return users;
        }
        catch (error) {
            this.logger.error(`فشل في الحصول على المستخدمين بالفرع: ${branchId}`, error);
            throw error;
        }
    }
    async getBranchStats() {
        try {
            const totalBranches = await this.prisma.branch.count();
            const activeBranches = await this.prisma.branch.count({
                where: { isActive: true },
            });
            const companiesWithBranches = await this.prisma.company.findMany({
                include: {
                    _count: {
                        select: { branches: true },
                    },
                },
            });
            const totalUsers = await this.prisma.user.count({
                where: { isActive: true },
            });
            const totalWarehouses = await this.prisma.warehouse.count();
            return {
                totalBranches,
                activeBranches,
                inactiveBranches: totalBranches - activeBranches,
                totalCompanies: companiesWithBranches.length,
                averageBranchesPerCompany: companiesWithBranches.length > 0
                    ? (totalBranches / companiesWithBranches.length).toFixed(1)
                    : 0,
                totalUsers,
                totalWarehouses,
            };
        }
        catch (error) {
            this.logger.error('فشل في الحصول على إحصائيات الفروع', error);
            throw error;
        }
    }
    async invalidateBranchesCache() {
        await this.cacheService.delete(this.branchesCacheKey);
        const companyKeys = await this.cacheService.getKeys(`${this.branchesCacheKey}:company:*`);
        for (const key of companyKeys) {
            await this.cacheService.delete(key);
        }
    }
};
exports.BranchService = BranchService;
exports.BranchService = BranchService = BranchService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        cache_service_1.CacheService])
], BranchService);
//# sourceMappingURL=branch.service.js.map