import { RoleService } from './role.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { AssignRoleDto } from './dto/assign-role.dto';
export declare class RoleController {
    private readonly roleService;
    constructor(roleService: RoleService);
    create(createRoleDto: CreateRoleDto): Promise<import("./role.service").RoleWithPermissions>;
    findAll(): Promise<import("./role.service").RoleWithPermissions[]>;
    getRoleStats(): Promise<{
        totalRoles: number;
        systemRoles: number;
        customRoles: number;
        totalUsers: number;
        activeUsers: number;
    }>;
    findOne(id: string): Promise<import("./role.service").RoleWithPermissions>;
    getUsersByRole(id: string): Promise<{
        id: string;
        email: string;
        isActive: boolean;
        createdAt: Date;
        username: string;
        lastLoginAt: Date | null;
    }[]>;
    update(id: string, updateRoleDto: UpdateRoleDto): Promise<import("./role.service").RoleWithPermissions>;
    assignRoleToUser(assignRoleDto: AssignRoleDto): Promise<{
        message: string;
    }>;
    remove(id: string): Promise<{
        message: string;
    }>;
}
