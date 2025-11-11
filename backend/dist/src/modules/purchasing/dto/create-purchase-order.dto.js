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
exports.CreatePurchaseOrderDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
class PurchaseOrderLineDto {
    productId;
    quantity;
    unitCost;
}
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'معرف المنتج مطلوب' }),
    (0, class_validator_1.IsUUID)('4', { message: 'معرف المنتج غير صحيح' }),
    __metadata("design:type", String)
], PurchaseOrderLineDto.prototype, "productId", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'الكمية مطلوبة' }),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], PurchaseOrderLineDto.prototype, "quantity", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'التكلفة الوحدية مطلوبة' }),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], PurchaseOrderLineDto.prototype, "unitCost", void 0);
class CreatePurchaseOrderDto {
    supplierId;
    warehouseId;
    lines;
    expectedDate;
    notes;
}
exports.CreatePurchaseOrderDto = CreatePurchaseOrderDto;
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'معرف المورد مطلوب' }),
    (0, class_validator_1.IsUUID)('4', { message: 'معرف المورد غير صحيح' }),
    __metadata("design:type", String)
], CreatePurchaseOrderDto.prototype, "supplierId", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'معرف المخزن مطلوب' }),
    (0, class_validator_1.IsUUID)('4', { message: 'معرف المخزن غير صحيح' }),
    __metadata("design:type", String)
], CreatePurchaseOrderDto.prototype, "warehouseId", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'بنود أمر الشراء مطلوبة' }),
    (0, class_validator_1.IsArray)({ message: 'بنود أمر الشراء يجب أن تكون مصفوفة' }),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => PurchaseOrderLineDto),
    __metadata("design:type", Array)
], CreatePurchaseOrderDto.prototype, "lines", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)({}, { message: 'تاريخ المتوقع غير صحيح' }),
    __metadata("design:type", String)
], CreatePurchaseOrderDto.prototype, "expectedDate", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'ملاحظات يجب أن تكون نص' }),
    __metadata("design:type", String)
], CreatePurchaseOrderDto.prototype, "notes", void 0);
//# sourceMappingURL=create-purchase-order.dto.js.map