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
exports.CreateBranchDto = void 0;
const class_validator_1 = require("class-validator");
class CreateBranchDto {
    name;
    code;
    address;
    phone;
    email;
    companyId;
    managerId;
    isActive;
}
exports.CreateBranchDto = CreateBranchDto;
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'اسم الفرع مطلوب' }),
    (0, class_validator_1.IsString)({ message: 'اسم الفرع يجب أن يكون نص' }),
    (0, class_validator_1.MaxLength)(255, { message: 'اسم الفرع يجب ألا يزيد عن 255 حرف' }),
    __metadata("design:type", String)
], CreateBranchDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'كود الفرع مطلوب' }),
    (0, class_validator_1.IsString)({ message: 'كود الفرع يجب أن يكون نص' }),
    (0, class_validator_1.MaxLength)(50, { message: 'كود الفرع يجب ألا يزيد عن 50 حرف' }),
    __metadata("design:type", String)
], CreateBranchDto.prototype, "code", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'العنوان يجب أن يكون نص' }),
    __metadata("design:type", String)
], CreateBranchDto.prototype, "address", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'رقم الهاتف يجب أن يكون نص' }),
    (0, class_validator_1.MaxLength)(50, { message: 'رقم الهاتف يجب ألا يزيد عن 50 حرف' }),
    __metadata("design:type", String)
], CreateBranchDto.prototype, "phone", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEmail)({}, { message: 'البريد الإلكتروني غير صحيح' }),
    __metadata("design:type", String)
], CreateBranchDto.prototype, "email", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'معرف الشركة مطلوب' }),
    (0, class_validator_1.IsUUID)('4', { message: 'معرف الشركة غير صحيح' }),
    __metadata("design:type", String)
], CreateBranchDto.prototype, "companyId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)('4', { message: 'معرف المدير غير صحيح' }),
    __metadata("design:type", String)
], CreateBranchDto.prototype, "managerId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)({ message: 'حالة النشاط يجب أن تكون قيمة منطقية' }),
    __metadata("design:type", Boolean)
], CreateBranchDto.prototype, "isActive", void 0);
//# sourceMappingURL=create-branch.dto.js.map