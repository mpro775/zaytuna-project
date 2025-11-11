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
exports.RegisterDto = void 0;
const class_validator_1 = require("class-validator");
class RegisterDto {
    username;
    email;
    password;
    phone;
    roleId;
    branchId;
}
exports.RegisterDto = RegisterDto;
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'اسم المستخدم مطلوب' }),
    (0, class_validator_1.IsString)({ message: 'اسم المستخدم يجب أن يكون نص' }),
    __metadata("design:type", String)
], RegisterDto.prototype, "username", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'البريد الإلكتروني مطلوب' }),
    (0, class_validator_1.IsEmail)({}, { message: 'البريد الإلكتروني غير صحيح' }),
    __metadata("design:type", String)
], RegisterDto.prototype, "email", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'كلمة المرور مطلوبة' }),
    (0, class_validator_1.IsString)({ message: 'كلمة المرور يجب أن تكون نص' }),
    (0, class_validator_1.MinLength)(6, { message: 'كلمة المرور يجب أن تكون على الأقل 6 أحرف' }),
    __metadata("design:type", String)
], RegisterDto.prototype, "password", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'رقم الهاتف يجب أن يكون نص' }),
    __metadata("design:type", String)
], RegisterDto.prototype, "phone", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'معرف الدور مطلوب' }),
    (0, class_validator_1.IsUUID)('4', { message: 'معرف الدور غير صحيح' }),
    __metadata("design:type", String)
], RegisterDto.prototype, "roleId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)('4', { message: 'معرف الفرع غير صحيح' }),
    __metadata("design:type", String)
], RegisterDto.prototype, "branchId", void 0);
//# sourceMappingURL=register.dto.js.map