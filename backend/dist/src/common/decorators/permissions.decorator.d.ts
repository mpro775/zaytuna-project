import { Reflector } from '@nestjs/core';
export declare const PERMISSIONS_KEY = "permissions";
export declare const IS_PUBLIC_KEY = "isPublic";
export declare const Permissions: (...permissions: string[]) => import("@nestjs/common").CustomDecorator<string>;
export declare const Public: () => import("@nestjs/common").CustomDecorator<string>;
export declare const RequireRead: () => import("@nestjs/common").CustomDecorator<string>;
export declare const RequireWrite: () => import("@nestjs/common").CustomDecorator<string>;
export declare const RequireCreate: () => import("@nestjs/common").CustomDecorator<string>;
export declare const RequireUpdate: () => import("@nestjs/common").CustomDecorator<string>;
export declare const RequireDelete: () => import("@nestjs/common").CustomDecorator<string>;
export declare const RequireAdmin: () => import("@nestjs/common").CustomDecorator<string>;
export declare class PermissionChecker {
    private reflector;
    constructor(reflector: Reflector);
    getRequiredPermissions(context: any): string[] | undefined;
    isPublic(context: any): boolean;
    hasRequiredPermissions(requiredPermissions: string[], userPermissions: string[]): boolean;
    private matchesPermission;
}
