import { PrismaService } from '../../shared/database/prisma.service';
import { CacheService } from '../../shared/cache/cache.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { AssignRoleDto } from './dto/assign-role.dto';
import { PermissionService } from './permission.service';
export interface RoleWithPermissions {
    id: string;
    name: string;
    description?: string;
    permissions: string[];
    userCount: number;
    isSystemRole: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export declare class RoleService {
    private readonly prisma;
    private readonly cacheService;
    private readonly permissionService;
    private readonly logger;
    private readonly rolesCacheKey;
    private readonly userRolesCacheKey;
    constructor(prisma: PrismaService, cacheService: CacheService, permissionService: PermissionService);
    create(createRoleDto: CreateRoleDto): Promise<RoleWithPermissions>;
    findAll(): Promise<RoleWithPermissions[]>;
    findOne(id: string): Promise<RoleWithPermissions>;
    update(id: string, updateRoleDto: UpdateRoleDto): Promise<RoleWithPermissions>;
    remove(id: string): Promise<{
        message: string;
    }>;
    assignRoleToUser(assignRoleDto: AssignRoleDto): Promise<{
        message: string;
    }>;
    getUserRole(userId: string): Promise<RoleWithPermissions | null>;
    getUsersByRole(roleId: string): Promise<{
        id: string;
        email: string;
        isActive: boolean;
        createdAt: Date;
        username: string;
        lastLoginAt: Date | null;
    }[]>;
    getRoleStats(): Promise<{
        totalRoles: number;
        systemRoles: number;
        customRoles: number;
        totalUsers: number;
        activeUsers: number;
    }>;
    private validatePermissions;
    private invalidateRolesCache;
    private invalidateUserRolesCache;
}
