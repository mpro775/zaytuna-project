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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PermissionController = void 0;
const common_1 = require("@nestjs/common");
const permission_service_1 = require("./permission.service");
const permissions_decorator_1 = require("../../common/decorators/permissions.decorator");
let PermissionController = class PermissionController {
    permissionService;
    constructor(permissionService) {
        this.permissionService = permissionService;
    }
    getAllPermissions() {
        return this.permissionService.getAllPermissions();
    }
    getCategories() {
        const categories = this.permissionService.getCategories();
        return { categories };
    }
    getPermissionsByCategory(category) {
        return this.permissionService.getPermissionsByCategory(category);
    }
    validatePermission(permission) {
        const isValid = this.permissionService.isValidPermission(permission);
        const details = this.permissionService.getPermissionDetails(permission);
        return {
            permission,
            isValid,
            details,
        };
    }
};
exports.PermissionController = PermissionController;
__decorate([
    (0, common_1.Get)(),
    (0, permissions_decorator_1.Permissions)('roles.read'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], PermissionController.prototype, "getAllPermissions", null);
__decorate([
    (0, common_1.Get)('categories'),
    (0, permissions_decorator_1.Permissions)('roles.read'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], PermissionController.prototype, "getCategories", null);
__decorate([
    (0, common_1.Get)('category/:category'),
    (0, permissions_decorator_1.Permissions)('roles.read'),
    __param(0, (0, common_1.Query)('category')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], PermissionController.prototype, "getPermissionsByCategory", null);
__decorate([
    (0, common_1.Get)('validate/:permission'),
    (0, permissions_decorator_1.Permissions)('roles.read'),
    __param(0, (0, common_1.Query)('permission')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], PermissionController.prototype, "validatePermission", null);
exports.PermissionController = PermissionController = __decorate([
    (0, common_1.Controller)('permissions'),
    __metadata("design:paramtypes", [permission_service_1.PermissionService])
], PermissionController);
//# sourceMappingURL=permission.controller.js.map