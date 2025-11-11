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
exports.UpdateProductVariantDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
class UpdateProductVariantDto {
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
exports.UpdateProductVariantDto = UpdateProductVariantDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'اسم المتغير يجب أن يكون نص' }),
    __metadata("design:type", String)
], UpdateProductVariantDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'رمز SKU يجب أن يكون نص' }),
    __metadata("design:type", String)
], UpdateProductVariantDto.prototype, "sku", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'الباركود يجب أن يكون نص' }),
    __metadata("design:type", String)
], UpdateProductVariantDto.prototype, "barcode", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)({ maxDecimalPlaces: 2 }, { message: 'السعر يجب أن يكون رقم' }),
    (0, class_transformer_1.Transform)(({ value }) => value ? parseFloat(value) : undefined),
    __metadata("design:type", Number)
], UpdateProductVariantDto.prototype, "price", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)({ maxDecimalPlaces: 2 }, { message: 'سعر التكلفة يجب أن يكون رقم' }),
    (0, class_transformer_1.Transform)(({ value }) => value ? parseFloat(value) : undefined),
    __metadata("design:type", Number)
], UpdateProductVariantDto.prototype, "costPrice", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)({ maxDecimalPlaces: 3 }, { message: 'الوزن يجب أن يكون رقم' }),
    (0, class_transformer_1.Transform)(({ value }) => value ? parseFloat(value) : undefined),
    __metadata("design:type", Number)
], UpdateProductVariantDto.prototype, "weight", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Object),
    __metadata("design:type", Object)
], UpdateProductVariantDto.prototype, "dimensions", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Object),
    __metadata("design:type", Object)
], UpdateProductVariantDto.prototype, "attributes", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'رابط الصورة يجب أن يكون نص' }),
    __metadata("design:type", String)
], UpdateProductVariantDto.prototype, "imageUrl", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)({ message: 'حالة النشاط يجب أن تكون قيمة منطقية' }),
    __metadata("design:type", Boolean)
], UpdateProductVariantDto.prototype, "isActive", void 0);
//# sourceMappingURL=update-product-variant.dto.js.map