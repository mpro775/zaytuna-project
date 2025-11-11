import { PermissionService } from './permission.service';
export declare class PermissionController {
    private readonly permissionService;
    constructor(permissionService: PermissionService);
    getAllPermissions(): import("./permission.service").PermissionDefinition[];
    getCategories(): {
        categories: string[];
    };
    getPermissionsByCategory(category: string): import("./permission.service").PermissionDefinition[];
    validatePermission(permission: string): {
        permission: string;
        isValid: boolean;
        details: import("./permission.service").PermissionDefinition | null;
    };
}
