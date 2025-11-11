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
exports.UpdateSupplierDto = void 0;
const class_validator_1 = require("class-validator");
class UpdateSupplierDto {
    name;
    contactName;
    phone;
    email;
    address;
    taxNumber;
    paymentTerms;
    isActive;
}
exports.UpdateSupplierDto = UpdateSupplierDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'اسم المورد يجب أن يكون نص' }),
    __metadata("design:type", String)
], UpdateSupplierDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'اسم جهة الاتصال يجب أن يكون نص' }),
    __metadata("design:type", String)
], UpdateSupplierDto.prototype, "contactName", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'رقم الهاتف يجب أن يكون نص' }),
    __metadata("design:type", String)
], UpdateSupplierDto.prototype, "phone", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEmail)({}, { message: 'البريد الإلكتروني غير صحيح' }),
    __metadata("design:type", String)
], UpdateSupplierDto.prototype, "email", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'العنوان يجب أن يكون نص' }),
    __metadata("design:type", String)
], UpdateSupplierDto.prototype, "address", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'الرقم الضريبي يجب أن يكون نص' }),
    __metadata("design:type", String)
], UpdateSupplierDto.prototype, "taxNumber", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'شروط الدفع يجب أن تكون نص' }),
    __metadata("design:type", String)
], UpdateSupplierDto.prototype, "paymentTerms", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)({ message: 'حالة النشاط يجب أن تكون منطقية' }),
    __metadata("design:type", Boolean)
], UpdateSupplierDto.prototype, "isActive", void 0);
//# sourceMappingURL=update-supplier.dto.js.map