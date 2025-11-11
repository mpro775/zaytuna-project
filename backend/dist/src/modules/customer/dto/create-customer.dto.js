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
exports.CreateCustomerDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
class CreateCustomerDto {
    name;
    phone;
    email;
    address;
    taxNumber;
    creditLimit;
    birthday;
    gender;
    marketingConsent;
    isActive;
}
exports.CreateCustomerDto = CreateCustomerDto;
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'اسم العميل مطلوب' }),
    (0, class_validator_1.IsString)({ message: 'اسم العميل يجب أن يكون نص' }),
    __metadata("design:type", String)
], CreateCustomerDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'رقم الهاتف يجب أن يكون نص' }),
    __metadata("design:type", String)
], CreateCustomerDto.prototype, "phone", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEmail)({}, { message: 'البريد الإلكتروني غير صحيح' }),
    __metadata("design:type", String)
], CreateCustomerDto.prototype, "email", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'العنوان يجب أن يكون نص' }),
    __metadata("design:type", String)
], CreateCustomerDto.prototype, "address", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'الرقم الضريبي يجب أن يكون نص' }),
    __metadata("design:type", String)
], CreateCustomerDto.prototype, "taxNumber", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)({ maxDecimalPlaces: 2 }, { message: 'حد الائتمان يجب أن يكون رقم' }),
    (0, class_validator_1.Min)(0, { message: 'حد الائتمان يجب أن يكون موجب' }),
    (0, class_transformer_1.Transform)(({ value }) => value ? parseFloat(value) : undefined),
    __metadata("design:type", Number)
], CreateCustomerDto.prototype, "creditLimit", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)({}, { message: 'تاريخ الميلاد غير صحيح' }),
    __metadata("design:type", String)
], CreateCustomerDto.prototype, "birthday", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'الجنس يجب أن يكون نص' }),
    __metadata("design:type", String)
], CreateCustomerDto.prototype, "gender", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)({ message: 'موافقة التسويق يجب أن تكون منطقية' }),
    __metadata("design:type", Boolean)
], CreateCustomerDto.prototype, "marketingConsent", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)({ message: 'حالة النشاط يجب أن تكون منطقية' }),
    __metadata("design:type", Boolean)
], CreateCustomerDto.prototype, "isActive", void 0);
//# sourceMappingURL=create-customer.dto.js.map