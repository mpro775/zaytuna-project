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
exports.CreatePurchaseInvoiceDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
class PurchaseInvoiceLineDto {
    productVariantId;
    quantity;
    unitCost;
    discountAmount;
    taxAmount;
    lineTotal;
}
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'معرف متغير المنتج مطلوب' }),
    (0, class_validator_1.IsUUID)('4', { message: 'معرف متغير المنتج غير صحيح' }),
    __metadata("design:type", String)
], PurchaseInvoiceLineDto.prototype, "productVariantId", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'الكمية مطلوبة' }),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], PurchaseInvoiceLineDto.prototype, "quantity", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'التكلفة الوحدية مطلوبة' }),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], PurchaseInvoiceLineDto.prototype, "unitCost", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], PurchaseInvoiceLineDto.prototype, "discountAmount", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], PurchaseInvoiceLineDto.prototype, "taxAmount", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], PurchaseInvoiceLineDto.prototype, "lineTotal", void 0);
class CreatePurchaseInvoiceDto {
    invoiceNumber;
    supplierId;
    warehouseId;
    purchaseOrderId;
    currencyId;
    invoiceDate;
    lines;
    dueDate;
    status;
    notes;
}
exports.CreatePurchaseInvoiceDto = CreatePurchaseInvoiceDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'رقم الفاتورة يجب أن يكون نص' }),
    __metadata("design:type", String)
], CreatePurchaseInvoiceDto.prototype, "invoiceNumber", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'معرف المورد مطلوب' }),
    (0, class_validator_1.IsUUID)('4', { message: 'معرف المورد غير صحيح' }),
    __metadata("design:type", String)
], CreatePurchaseInvoiceDto.prototype, "supplierId", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'معرف المخزن مطلوب' }),
    (0, class_validator_1.IsUUID)('4', { message: 'معرف المخزن غير صحيح' }),
    __metadata("design:type", String)
], CreatePurchaseInvoiceDto.prototype, "warehouseId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)('4', { message: 'معرف أمر الشراء غير صحيح' }),
    __metadata("design:type", String)
], CreatePurchaseInvoiceDto.prototype, "purchaseOrderId", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'معرف العملة مطلوب' }),
    (0, class_validator_1.IsUUID)('4', { message: 'معرف العملة غير صحيح' }),
    __metadata("design:type", String)
], CreatePurchaseInvoiceDto.prototype, "currencyId", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'تاريخ الفاتورة مطلوب' }),
    (0, class_validator_1.IsDateString)({}, { message: 'تاريخ الفاتورة غير صحيح' }),
    __metadata("design:type", String)
], CreatePurchaseInvoiceDto.prototype, "invoiceDate", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'بنود فاتورة الشراء مطلوبة' }),
    (0, class_validator_1.IsArray)({ message: 'بنود فاتورة الشراء يجب أن تكون مصفوفة' }),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => PurchaseInvoiceLineDto),
    __metadata("design:type", Array)
], CreatePurchaseInvoiceDto.prototype, "lines", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)({}, { message: 'تاريخ الاستحقاق غير صحيح' }),
    __metadata("design:type", String)
], CreatePurchaseInvoiceDto.prototype, "dueDate", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'الحالة يجب أن تكون نص' }),
    __metadata("design:type", String)
], CreatePurchaseInvoiceDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'ملاحظات يجب أن تكون نص' }),
    __metadata("design:type", String)
], CreatePurchaseInvoiceDto.prototype, "notes", void 0);
//# sourceMappingURL=create-purchase-invoice.dto.js.map