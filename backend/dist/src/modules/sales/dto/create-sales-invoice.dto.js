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
exports.CreateSalesInvoiceDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
class SalesInvoiceLineDto {
    productVariantId;
    quantity;
    unitPrice;
    discountAmount;
    taxAmount;
    lineTotal;
}
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'معرف متغير المنتج مطلوب' }),
    (0, class_validator_1.IsUUID)('4', { message: 'معرف متغير المنتج غير صحيح' }),
    __metadata("design:type", String)
], SalesInvoiceLineDto.prototype, "productVariantId", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'الكمية مطلوبة' }),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], SalesInvoiceLineDto.prototype, "quantity", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], SalesInvoiceLineDto.prototype, "unitPrice", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], SalesInvoiceLineDto.prototype, "discountAmount", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], SalesInvoiceLineDto.prototype, "taxAmount", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], SalesInvoiceLineDto.prototype, "lineTotal", void 0);
class CreateSalesInvoiceDto {
    invoiceNumber;
    branchId;
    customerId;
    warehouseId;
    currencyId;
    taxId;
    lines;
    status;
    notes;
    dueDate;
}
exports.CreateSalesInvoiceDto = CreateSalesInvoiceDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'رقم الفاتورة يجب أن يكون نص' }),
    __metadata("design:type", String)
], CreateSalesInvoiceDto.prototype, "invoiceNumber", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'معرف الفرع مطلوب' }),
    (0, class_validator_1.IsUUID)('4', { message: 'معرف الفرع غير صحيح' }),
    __metadata("design:type", String)
], CreateSalesInvoiceDto.prototype, "branchId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)('4', { message: 'معرف العميل غير صحيح' }),
    __metadata("design:type", String)
], CreateSalesInvoiceDto.prototype, "customerId", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'معرف المخزن مطلوب' }),
    (0, class_validator_1.IsUUID)('4', { message: 'معرف المخزن غير صحيح' }),
    __metadata("design:type", String)
], CreateSalesInvoiceDto.prototype, "warehouseId", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'معرف العملة مطلوب' }),
    (0, class_validator_1.IsUUID)('4', { message: 'معرف العملة غير صحيح' }),
    __metadata("design:type", String)
], CreateSalesInvoiceDto.prototype, "currencyId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)('4', { message: 'معرف الضريبة غير صحيح' }),
    __metadata("design:type", String)
], CreateSalesInvoiceDto.prototype, "taxId", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'سطور الفاتورة مطلوبة' }),
    (0, class_validator_1.IsArray)({ message: 'سطور الفاتورة يجب أن تكون مصفوفة' }),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => SalesInvoiceLineDto),
    __metadata("design:type", Array)
], CreateSalesInvoiceDto.prototype, "lines", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'الحالة يجب أن تكون نص' }),
    __metadata("design:type", String)
], CreateSalesInvoiceDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'ملاحظات يجب أن تكون نص' }),
    __metadata("design:type", String)
], CreateSalesInvoiceDto.prototype, "notes", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)({}, { message: 'تاريخ الاستحقاق غير صحيح' }),
    __metadata("design:type", String)
], CreateSalesInvoiceDto.prototype, "dueDate", void 0);
//# sourceMappingURL=create-sales-invoice.dto.js.map