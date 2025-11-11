export interface PermissionDefinition {
    name: string;
    description: string;
    category: string;
    children?: string[];
}
export declare class PermissionService {
    private readonly logger;
    private readonly permissions;
    getAllPermissions(): PermissionDefinition[];
    getPermissionsByCategory(category: string): PermissionDefinition[];
    getCategories(): string[];
    isValidPermission(permission: string): boolean;
    getPermissionDetails(permission: string): PermissionDefinition | null;
    getChildPermissions(parentPermission: string): string[];
    hasChildren(permission: string): boolean;
    expandPermissions(userPermissions: string[]): string[];
    private getParentPermissions;
    hasPermission(userPermissions: string[], requiredPermission: string): boolean;
    hasAnyPermission(userPermissions: string[], requiredPermissions: string[]): boolean;
    hasAllPermissions(userPermissions: string[], requiredPermissions: string[]): boolean;
    getMissingPermissions(userPermissions: string[], requiredPermissions: string[]): string[];
    filterPermissions(permissions: string[], pattern: string): string[];
}
