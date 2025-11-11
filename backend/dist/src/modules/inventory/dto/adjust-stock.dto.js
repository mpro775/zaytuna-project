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
exports.AdjustStockDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
class AdjustStockDto {
    quantity;
    movementType;
    referenceType;
    referenceId;
    reason;
}
exports.AdjustStockDto = AdjustStockDto;
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'الكمية مطلوبة' }),
    (0, class_validator_1.IsNumber)({ maxDecimalPlaces: 3 }, { message: 'الكمية يجب أن تكون رقم' }),
    (0, class_transformer_1.Transform)(({ value }) => parseFloat(value)),
    __metadata("design:type", Number)
], AdjustStockDto.prototype, "quantity", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'نوع الحركة يجب أن يكون نص' }),
    __metadata("design:type", String)
], AdjustStockDto.prototype, "movementType", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'نوع المرجع يجب أن يكون نص' }),
    __metadata("design:type", String)
], AdjustStockDto.prototype, "referenceType", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)('4', { message: 'معرف المرجع غير صحيح' }),
    __metadata("design:type", String)
], AdjustStockDto.prototype, "referenceId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'السبب يجب أن يكون نص' }),
    (0, class_validator_1.MaxLength)(500, { message: 'السبب يجب ألا يزيد عن 500 حرف' }),
    __metadata("design:type", String)
], AdjustStockDto.prototype, "reason", void 0);
//# sourceMappingURL=adjust-stock.dto.js.map