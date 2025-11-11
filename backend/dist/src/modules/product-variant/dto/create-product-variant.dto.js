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
exports.CreateProductVariantDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
class CreateProductVariantDto {
    productId;
    name;
    sku;
    barcode;
    price;
    costPrice;
    weight;
    dimensions;
    attributes;
    imageUrl;
    isActive;
}
exports.CreateProductVariantDto = CreateProductVariantDto;
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'معرف المنتج مطلوب' }),
    (0, class_validator_1.IsUUID)('4', { message: 'معرف المنتج غير صحيح' }),
    __metadata("design:type", String)
], CreateProductVariantDto.prototype, "productId", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'اسم المتغير مطلوب' }),
    (0, class_validator_1.IsString)({ message: 'اسم المتغير يجب أن يكون نص' }),
    (0, class_validator_1.MaxLength)(255, { message: 'اسم المتغير يجب ألا يزيد عن 255 حرف' }),
    __metadata("design:type", String)
], CreateProductVariantDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'رمز SKU يجب أن يكون نص' }),
    (0, class_validator_1.MaxLength)(100, { message: 'رمز SKU يجب ألا يزيد عن 100 حرف' }),
    __metadata("design:type", String)
], CreateProductVariantDto.prototype, "sku", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'الباركود يجب أن يكون نص' }),
    (0, class_validator_1.MaxLength)(100, { message: 'الباركود يجب ألا يزيد عن 100 حرف' }),
    __metadata("design:type", String)
], CreateProductVariantDto.prototype, "barcode", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)({ maxDecimalPlaces: 2 }, { message: 'السعر يجب أن يكون رقم' }),
    (0, class_validator_1.Min)(0, { message: 'السعر يجب أن يكون أكبر من أو يساوي صفر' }),
    (0, class_transformer_1.Transform)(({ value }) => value ? parseFloat(value) : undefined),
    __metadata("design:type", Number)
], CreateProductVariantDto.prototype, "price", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)({ maxDecimalPlaces: 2 }, { message: 'سعر التكلفة يجب أن يكون رقم' }),
    (0, class_validator_1.Min)(0, { message: 'سعر التكلفة يجب أن يكون أكبر من أو يساوي صفر' }),
    (0, class_transformer_1.Transform)(({ value }) => value ? parseFloat(value) : undefined),
    __metadata("design:type", Number)
], CreateProductVariantDto.prototype, "costPrice", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)({ maxDecimalPlaces: 3 }, { message: 'الوزن يجب أن يكون رقم' }),
    (0, class_validator_1.Min)(0, { message: 'الوزن يجب أن يكون أكبر من أو يساوي صفر' }),
    (0, class_transformer_1.Transform)(({ value }) => value ? parseFloat(value) : undefined),
    __metadata("design:type", Number)
], CreateProductVariantDto.prototype, "weight", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Object),
    __metadata("design:type", Object)
], CreateProductVariantDto.prototype, "dimensions", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Object),
    __metadata("design:type", Object)
], CreateProductVariantDto.prototype, "attributes", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'رابط الصورة يجب أن يكون نص' }),
    __metadata("design:type", String)
], CreateProductVariantDto.prototype, "imageUrl", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)({ message: 'حالة النشاط يجب أن تكون قيمة منطقية' }),
    __metadata("design:type", Boolean)
], CreateProductVariantDto.prototype, "isActive", void 0);
//# sourceMappingURL=create-product-variant.dto.js.map