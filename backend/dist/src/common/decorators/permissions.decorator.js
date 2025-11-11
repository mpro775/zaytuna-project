"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PermissionChecker = exports.RequireAdmin = exports.RequireDelete = exports.RequireUpdate = exports.RequireCreate = exports.RequireWrite = exports.RequireRead = exports.Public = exports.Permissions = exports.IS_PUBLIC_KEY = exports.PERMISSIONS_KEY = void 0;
const common_1 = require("@nestjs/common");
exports.PERMISSIONS_KEY = 'permissions';
exports.IS_PUBLIC_KEY = 'isPublic';
const Permissions = (...permissions) => {
    return (0, common_1.SetMetadata)(exports.PERMISSIONS_KEY, permissions);
};
exports.Permissions = Permissions;
const Public = () => {
    return (0, common_1.SetMetadata)(exports.IS_PUBLIC_KEY, true);
};
exports.Public = Public;
const RequireRead = () => {
    return (0, exports.Permissions)('read');
};
exports.RequireRead = RequireRead;
const RequireWrite = () => {
    return (0, exports.Permissions)('write');
};
exports.RequireWrite = RequireWrite;
const RequireCreate = () => {
    return (0, exports.Permissions)('create');
};
exports.RequireCreate = RequireCreate;
const RequireUpdate = () => {
    return (0, exports.Permissions)('update');
};
exports.RequireUpdate = RequireUpdate;
const RequireDelete = () => {
    return (0, exports.Permissions)('delete');
};
exports.RequireDelete = RequireDelete;
const RequireAdmin = () => {
    return (0, exports.Permissions)('admin');
};
exports.RequireAdmin = RequireAdmin;
class PermissionChecker {
    reflector;
    constructor(reflector) {
        this.reflector = reflector;
    }
    getRequiredPermissions(context) {
        return this.reflector.getAllAndOverride(exports.PERMISSIONS_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);
    }
    isPublic(context) {
        return this.reflector.getAllAndOverride(exports.IS_PUBLIC_KEY, [
            context.getHandler(),
            context.getClass(),
        ]) ?? false;
    }
    hasRequiredPermissions(requiredPermissions, userPermissions) {
        if (!requiredPermissions || requiredPermissions.length === 0) {
            return true;
        }
        return requiredPermissions.some(requiredPerm => userPermissions.some(userPerm => this.matchesPermission(userPerm, requiredPerm)));
    }
    matchesPermission(userPermission, requiredPermission) {
        if (userPermission === requiredPermission) {
            return true;
        }
        if (requiredPermission.includes('*')) {
            const regex = new RegExp(requiredPermission.replace(/\*/g, '.*').replace(/\./g, '\\.'));
            return regex.test(userPermission);
        }
        if (userPermission.startsWith(requiredPermission + '.')) {
            return true;
        }
        return false;
    }
}
exports.PermissionChecker = PermissionChecker;
//# sourceMappingURL=permissions.decorator.js.map