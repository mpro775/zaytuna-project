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
exports.CreateGLAccountDto = void 0;
const class_validator_1 = require("class-validator");
class CreateGLAccountDto {
    accountCode;
    name;
    description;
    accountType;
    parentId;
    isActive;
    isSystem;
}
exports.CreateGLAccountDto = CreateGLAccountDto;
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'كود الحساب مطلوب' }),
    (0, class_validator_1.IsString)({ message: 'كود الحساب يجب أن يكون نص' }),
    __metadata("design:type", String)
], CreateGLAccountDto.prototype, "accountCode", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'اسم الحساب مطلوب' }),
    (0, class_validator_1.IsString)({ message: 'اسم الحساب يجب أن يكون نص' }),
    __metadata("design:type", String)
], CreateGLAccountDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'وصف الحساب يجب أن يكون نص' }),
    __metadata("design:type", String)
], CreateGLAccountDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'نوع الحساب مطلوب' }),
    (0, class_validator_1.IsIn)(['asset', 'liability', 'equity', 'revenue', 'expense'], {
        message: 'نوع الحساب يجب أن يكون أحد: asset, liability, equity, revenue, expense'
    }),
    __metadata("design:type", String)
], CreateGLAccountDto.prototype, "accountType", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'معرف الحساب الأب يجب أن يكون نص' }),
    __metadata("design:type", String)
], CreateGLAccountDto.prototype, "parentId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)({ message: 'حالة النشاط يجب أن تكون منطقية' }),
    __metadata("design:type", Boolean)
], CreateGLAccountDto.prototype, "isActive", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)({ message: 'حالة النظام يجب أن تكون منطقية' }),
    __metadata("design:type", Boolean)
], CreateGLAccountDto.prototype, "isSystem", void 0);
//# sourceMappingURL=create-gl-account.dto.js.map