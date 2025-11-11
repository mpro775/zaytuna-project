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
exports.CreateReturnDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
class ReturnLineDto {
    productVariantId;
    quantity;
    unitPrice;
    discountAmount;
    taxAmount;
    lineTotal;
    reason;
}
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'معرف متغير المنتج مطلوب' }),
    (0, class_validator_1.IsUUID)('4', { message: 'معرف متغير المنتج غير صحيح' }),
    __metadata("design:type", String)
], ReturnLineDto.prototype, "productVariantId", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'الكمية مطلوبة' }),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], ReturnLineDto.prototype, "quantity", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], ReturnLineDto.prototype, "unitPrice", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], ReturnLineDto.prototype, "discountAmount", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], ReturnLineDto.prototype, "taxAmount", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], ReturnLineDto.prototype, "lineTotal", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'السبب يجب أن يكون نص' }),
    __metadata("design:type", String)
], ReturnLineDto.prototype, "reason", void 0);
class CreateReturnDto {
    returnNumber;
    salesInvoiceId;
    warehouseId;
    reason;
    lines;
    status;
    notes;
}
exports.CreateReturnDto = CreateReturnDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'رقم المرتجع يجب أن يكون نص' }),
    __metadata("design:type", String)
], CreateReturnDto.prototype, "returnNumber", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'معرف فاتورة المبيعات مطلوب' }),
    (0, class_validator_1.IsUUID)('4', { message: 'معرف فاتورة المبيعات غير صحيح' }),
    __metadata("design:type", String)
], CreateReturnDto.prototype, "salesInvoiceId", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'معرف المخزن مطلوب' }),
    (0, class_validator_1.IsUUID)('4', { message: 'معرف المخزن غير صحيح' }),
    __metadata("design:type", String)
], CreateReturnDto.prototype, "warehouseId", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'السبب مطلوب' }),
    (0, class_validator_1.IsString)({ message: 'السبب يجب أن يكون نص' }),
    __metadata("design:type", String)
], CreateReturnDto.prototype, "reason", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'بنود المرتجع مطلوبة' }),
    (0, class_validator_1.IsArray)({ message: 'بنود المرتجع يجب أن تكون مصفوفة' }),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => ReturnLineDto),
    __metadata("design:type", Array)
], CreateReturnDto.prototype, "lines", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'الحالة يجب أن تكون نص' }),
    __metadata("design:type", String)
], CreateReturnDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'ملاحظات يجب أن تكون نص' }),
    __metadata("design:type", String)
], CreateReturnDto.prototype, "notes", void 0);
//# sourceMappingURL=create-return.dto.js.map