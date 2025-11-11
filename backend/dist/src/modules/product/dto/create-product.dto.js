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
exports.CreateProductDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
class CreateProductDto {
    name;
    description;
    barcode;
    sku;
    categoryId;
    basePrice;
    costPrice;
    taxId;
    trackInventory;
    reorderPoint;
    imageUrl;
    isActive;
}
exports.CreateProductDto = CreateProductDto;
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'اسم المنتج مطلوب' }),
    (0, class_validator_1.IsString)({ message: 'اسم المنتج يجب أن يكون نص' }),
    (0, class_validator_1.MaxLength)(255, { message: 'اسم المنتج يجب ألا يزيد عن 255 حرف' }),
    __metadata("design:type", String)
], CreateProductDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'وصف المنتج يجب أن يكون نص' }),
    __metadata("design:type", String)
], CreateProductDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'الباركود يجب أن يكون نص' }),
    (0, class_validator_1.MaxLength)(100, { message: 'الباركود يجب ألا يزيد عن 100 حرف' }),
    __metadata("design:type", String)
], CreateProductDto.prototype, "barcode", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'رمز SKU يجب أن يكون نص' }),
    (0, class_validator_1.MaxLength)(100, { message: 'رمز SKU يجب ألا يزيد عن 100 حرف' }),
    __metadata("design:type", String)
], CreateProductDto.prototype, "sku", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'معرف الفئة مطلوب' }),
    (0, class_validator_1.IsUUID)('4', { message: 'معرف الفئة غير صحيح' }),
    __metadata("design:type", String)
], CreateProductDto.prototype, "categoryId", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'السعر الأساسي مطلوب' }),
    (0, class_validator_1.IsNumber)({ maxDecimalPlaces: 2 }, { message: 'السعر الأساسي يجب أن يكون رقم' }),
    (0, class_validator_1.Min)(0, { message: 'السعر الأساسي يجب أن يكون أكبر من أو يساوي صفر' }),
    (0, class_transformer_1.Transform)(({ value }) => parseFloat(value)),
    __metadata("design:type", Number)
], CreateProductDto.prototype, "basePrice", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)({ maxDecimalPlaces: 2 }, { message: 'سعر التكلفة يجب أن يكون رقم' }),
    (0, class_validator_1.Min)(0, { message: 'سعر التكلفة يجب أن يكون أكبر من أو يساوي صفر' }),
    (0, class_transformer_1.Transform)(({ value }) => value ? parseFloat(value) : undefined),
    __metadata("design:type", Number)
], CreateProductDto.prototype, "costPrice", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)('4', { message: 'معرف الضريبة غير صحيح' }),
    __metadata("design:type", String)
], CreateProductDto.prototype, "taxId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)({ message: 'حالة التتبع يجب أن تكون قيمة منطقية' }),
    __metadata("design:type", Boolean)
], CreateProductDto.prototype, "trackInventory", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)({}, { message: 'نقطة إعادة الطلب يجب أن تكون رقم' }),
    (0, class_validator_1.Min)(0, { message: 'نقطة إعادة الطلب يجب أن تكون أكبر من أو تساوي صفر' }),
    (0, class_transformer_1.Transform)(({ value }) => value ? parseInt(value) : undefined),
    __metadata("design:type", Number)
], CreateProductDto.prototype, "reorderPoint", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'رابط الصورة يجب أن يكون نص' }),
    __metadata("design:type", String)
], CreateProductDto.prototype, "imageUrl", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)({ message: 'حالة النشاط يجب أن تكون قيمة منطقية' }),
    __metadata("design:type", Boolean)
], CreateProductDto.prototype, "isActive", void 0);
//# sourceMappingURL=create-product.dto.js.map