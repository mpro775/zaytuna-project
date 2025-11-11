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
exports.CreateWarehouseDto = void 0;
const class_validator_1 = require("class-validator");
class CreateWarehouseDto {
    name;
    code;
    address;
    phone;
    email;
    branchId;
    managerId;
    isActive;
}
exports.CreateWarehouseDto = CreateWarehouseDto;
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'اسم المخزن مطلوب' }),
    (0, class_validator_1.IsString)({ message: 'اسم المخزن يجب أن يكون نص' }),
    (0, class_validator_1.MaxLength)(255, { message: 'اسم المخزن يجب ألا يزيد عن 255 حرف' }),
    __metadata("design:type", String)
], CreateWarehouseDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'كود المخزن مطلوب' }),
    (0, class_validator_1.IsString)({ message: 'كود المخزن يجب أن يكون نص' }),
    (0, class_validator_1.MaxLength)(50, { message: 'كود المخزن يجب ألا يزيد عن 50 حرف' }),
    __metadata("design:type", String)
], CreateWarehouseDto.prototype, "code", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'العنوان يجب أن يكون نص' }),
    __metadata("design:type", String)
], CreateWarehouseDto.prototype, "address", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'رقم الهاتف يجب أن يكون نص' }),
    (0, class_validator_1.MaxLength)(50, { message: 'رقم الهاتف يجب ألا يزيد عن 50 حرف' }),
    __metadata("design:type", String)
], CreateWarehouseDto.prototype, "phone", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEmail)({}, { message: 'البريد الإلكتروني غير صحيح' }),
    __metadata("design:type", String)
], CreateWarehouseDto.prototype, "email", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'معرف الفرع مطلوب' }),
    (0, class_validator_1.IsUUID)('4', { message: 'معرف الفرع غير صحيح' }),
    __metadata("design:type", String)
], CreateWarehouseDto.prototype, "branchId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)('4', { message: 'معرف المدير غير صحيح' }),
    __metadata("design:type", String)
], CreateWarehouseDto.prototype, "managerId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)({ message: 'حالة النشاط يجب أن تكون قيمة منطقية' }),
    __metadata("design:type", Boolean)
], CreateWarehouseDto.prototype, "isActive", void 0);
//# sourceMappingURL=create-warehouse.dto.js.map