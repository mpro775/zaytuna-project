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
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateRoleDto = void 0;
const class_validator_1 = require("class-validator");
class CreateRoleDto {
    name;
    description;
    permissions;
    isSystemRole;
}
exports.CreateRoleDto = CreateRoleDto;
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'اسم الدور مطلوب' }),
    (0, class_validator_1.IsString)({ message: 'اسم الدور يجب أن يكون نص' }),
    (0, class_validator_1.MaxLength)(50, { message: 'اسم الدور يجب ألا يزيد عن 50 حرف' }),
    __metadata("design:type", String)
], CreateRoleDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'وصف الدور يجب أن يكون نص' }),
    (0, class_validator_1.MaxLength)(200, { message: 'وصف الدور يجب ألا يزيد عن 200 حرف' }),
    __metadata("design:type", String)
], CreateRoleDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)({ message: 'الصلاحيات يجب أن تكون مصفوفة' }),
    (0, class_validator_1.IsString)({ each: true, message: 'كل صلاحية يجب أن تكون نص' }),
    __metadata("design:type", Array)
], CreateRoleDto.prototype, "permissions", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)({ message: 'حالة الدور النظامي يجب أن تكون قيمة منطقية' }),
    __metadata("design:type", Boolean)
], CreateRoleDto.prototype, "isSystemRole", void 0);
//# sourceMappingURL=create-role.dto.js.map