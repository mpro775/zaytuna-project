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
exports.CreatePurchasePaymentDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
class CreatePurchasePaymentDto {
    amount;
    paymentMethod;
    referenceNumber;
    notes;
}
exports.CreatePurchasePaymentDto = CreatePurchasePaymentDto;
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'المبلغ مطلوب' }),
    (0, class_validator_1.IsNumber)({ maxDecimalPlaces: 2 }, { message: 'المبلغ يجب أن يكون رقم' }),
    (0, class_transformer_1.Transform)(({ value }) => parseFloat(value)),
    __metadata("design:type", Number)
], CreatePurchasePaymentDto.prototype, "amount", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'طريقة الدفع مطلوبة' }),
    (0, class_validator_1.IsString)({ message: 'طريقة الدفع يجب أن تكون نص' }),
    __metadata("design:type", String)
], CreatePurchasePaymentDto.prototype, "paymentMethod", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'الرقم المرجعي يجب أن يكون نص' }),
    __metadata("design:type", String)
], CreatePurchasePaymentDto.prototype, "referenceNumber", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'ملاحظات يجب أن تكون نص' }),
    __metadata("design:type", String)
], CreatePurchasePaymentDto.prototype, "notes", void 0);
//# sourceMappingURL=create-purchase-payment.dto.js.map