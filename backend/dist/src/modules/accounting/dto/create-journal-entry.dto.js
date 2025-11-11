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
exports.CreateJournalEntryDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
class JournalEntryLineDto {
    debitAccountId;
    creditAccountId;
    amount;
    description;
    referenceType;
    referenceId;
}
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'معرف حساب المدين مطلوب' }),
    (0, class_validator_1.IsString)({ message: 'معرف حساب المدين يجب أن يكون نص' }),
    __metadata("design:type", String)
], JournalEntryLineDto.prototype, "debitAccountId", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'معرف حساب الدائن مطلوب' }),
    (0, class_validator_1.IsString)({ message: 'معرف حساب الدائن يجب أن يكون نص' }),
    __metadata("design:type", String)
], JournalEntryLineDto.prototype, "creditAccountId", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'المبلغ مطلوب' }),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], JournalEntryLineDto.prototype, "amount", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'وصف السطر يجب أن يكون نص' }),
    __metadata("design:type", String)
], JournalEntryLineDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'نوع المرجع يجب أن يكون نص' }),
    __metadata("design:type", String)
], JournalEntryLineDto.prototype, "referenceType", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'معرف المرجع يجب أن يكون نص' }),
    __metadata("design:type", String)
], JournalEntryLineDto.prototype, "referenceId", void 0);
class CreateJournalEntryDto {
    entryNumber;
    entryDate;
    description;
    referenceType;
    referenceId;
    sourceModule;
    status;
    isSystem;
    lines;
}
exports.CreateJournalEntryDto = CreateJournalEntryDto;
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'رقم القيد مطلوب' }),
    (0, class_validator_1.IsString)({ message: 'رقم القيد يجب أن يكون نص' }),
    __metadata("design:type", String)
], CreateJournalEntryDto.prototype, "entryNumber", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)({}, { message: 'تاريخ القيد غير صحيح' }),
    __metadata("design:type", String)
], CreateJournalEntryDto.prototype, "entryDate", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'وصف القيد مطلوب' }),
    (0, class_validator_1.IsString)({ message: 'وصف القيد يجب أن يكون نص' }),
    __metadata("design:type", String)
], CreateJournalEntryDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'نوع المرجع يجب أن يكون نص' }),
    __metadata("design:type", String)
], CreateJournalEntryDto.prototype, "referenceType", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'معرف المرجع يجب أن يكون نص' }),
    __metadata("design:type", String)
], CreateJournalEntryDto.prototype, "referenceId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'وحدة المصدر يجب أن تكون نص' }),
    __metadata("design:type", String)
], CreateJournalEntryDto.prototype, "sourceModule", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(['draft', 'posted'], {
        message: 'حالة القيد يجب أن تكون draft أو posted'
    }),
    __metadata("design:type", String)
], CreateJournalEntryDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)({ message: 'حالة النظام يجب أن تكون منطقية' }),
    __metadata("design:type", Boolean)
], CreateJournalEntryDto.prototype, "isSystem", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'سطور القيد مطلوبة' }),
    (0, class_validator_1.IsArray)({ message: 'سطور القيد يجب أن تكون مصفوفة' }),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => JournalEntryLineDto),
    __metadata("design:type", Array)
], CreateJournalEntryDto.prototype, "lines", void 0);
//# sourceMappingURL=create-journal-entry.dto.js.map