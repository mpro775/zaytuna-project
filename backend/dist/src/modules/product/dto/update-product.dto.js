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
exports.UpdateProductDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
class UpdateProductDto {
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
exports.UpdateProductDto = UpdateProductDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'اسم المنتج يجب أن يكون نص' }),
    __metadata("design:type", String)
], UpdateProductDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'وصف المنتج يجب أن يكون نص' }),
    __metadata("design:type", String)
], UpdateProductDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'الباركود يجب أن يكون نص' }),
    __metadata("design:type", String)
], UpdateProductDto.prototype, "barcode", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'رمز SKU يجب أن يكون نص' }),
    __metadata("design:type", String)
], UpdateProductDto.prototype, "sku", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)('4', { message: 'معرف الفئة غير صحيح' }),
    __metadata("design:type", String)
], UpdateProductDto.prototype, "categoryId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)({ maxDecimalPlaces: 2 }, { message: 'السعر الأساسي يجب أن يكون رقم' }),
    (0, class_validator_1.Min)(0, { message: 'السعر الأساسي يجب أن يكون أكبر من أو يساوي صفر' }),
    (0, class_transformer_1.Transform)(({ value }) => value ? parseFloat(value) : undefined),
    __metadata("design:type", Number)
], UpdateProductDto.prototype, "basePrice", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)({ maxDecimalPlaces: 2 }, { message: 'سعر التكلفة يجب أن يكون رقم' }),
    (0, class_validator_1.Min)(0, { message: 'سعر التكلفة يجب أن يكون أكبر من أو يساوي صفر' }),
    (0, class_transformer_1.Transform)(({ value }) => value ? parseFloat(value) : undefined),
    __metadata("design:type", Number)
], UpdateProductDto.prototype, "costPrice", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)('4', { message: 'معرف الضريبة غير صحيح' }),
    __metadata("design:type", String)
], UpdateProductDto.prototype, "taxId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)({ message: 'حالة التتبع يجب أن تكون قيمة منطقية' }),
    __metadata("design:type", Boolean)
], UpdateProductDto.prototype, "trackInventory", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)({}, { message: 'نقطة إعادة الطلب يجب أن تكون رقم' }),
    (0, class_validator_1.Min)(0, { message: 'نقطة إعادة الطلب يجب أن تكون أكبر من أو تساوي صفر' }),
    (0, class_transformer_1.Transform)(({ value }) => value ? parseInt(value) : undefined),
    __metadata("design:type", Number)
], UpdateProductDto.prototype, "reorderPoint", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'رابط الصورة يجب أن يكون نص' }),
    __metadata("design:type", String)
], UpdateProductDto.prototype, "imageUrl", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)({ message: 'حالة النشاط يجب أن تكون قيمة منطقية' }),
    __metadata("design:type", Boolean)
], UpdateProductDto.prototype, "isActive", void 0);
//# sourceMappingURL=update-product.dto.js.map