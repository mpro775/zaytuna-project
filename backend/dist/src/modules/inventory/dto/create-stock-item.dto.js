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
exports.CreateStockItemDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
class CreateStockItemDto {
    warehouseId;
    productVariantId;
    quantity;
    minStock;
    maxStock;
}
exports.CreateStockItemDto = CreateStockItemDto;
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'معرف المخزن مطلوب' }),
    (0, class_validator_1.IsUUID)('4', { message: 'معرف المخزن غير صحيح' }),
    __metadata("design:type", String)
], CreateStockItemDto.prototype, "warehouseId", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'معرف متغير المنتج مطلوب' }),
    (0, class_validator_1.IsUUID)('4', { message: 'معرف متغير المنتج غير صحيح' }),
    __metadata("design:type", String)
], CreateStockItemDto.prototype, "productVariantId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)({ maxDecimalPlaces: 3 }, { message: 'الكمية يجب أن تكون رقم' }),
    (0, class_validator_1.Min)(0, { message: 'الكمية يجب أن تكون أكبر من أو تساوي صفر' }),
    (0, class_transformer_1.Transform)(({ value }) => value ? parseFloat(value) : 0),
    __metadata("design:type", Number)
], CreateStockItemDto.prototype, "quantity", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)({ maxDecimalPlaces: 3 }, { message: 'الحد الأدنى يجب أن يكون رقم' }),
    (0, class_validator_1.Min)(0, { message: 'الحد الأدنى يجب أن يكون أكبر من أو يساوي صفر' }),
    (0, class_transformer_1.Transform)(({ value }) => value ? parseFloat(value) : 0),
    __metadata("design:type", Number)
], CreateStockItemDto.prototype, "minStock", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)({ maxDecimalPlaces: 3 }, { message: 'الحد الأقصى يجب أن يكون رقم' }),
    (0, class_validator_1.Min)(0, { message: 'الحد الأقصى يجب أن يكون أكبر من أو يساوي صفر' }),
    (0, class_transformer_1.Transform)(({ value }) => value ? parseFloat(value) : 1000),
    __metadata("design:type", Number)
], CreateStockItemDto.prototype, "maxStock", void 0);
//# sourceMappingURL=create-stock-item.dto.js.map