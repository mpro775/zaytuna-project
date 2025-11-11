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
exports.HealthCheckResponseDto = exports.BaseResponseDto = exports.ErrorResponseDto = exports.SuccessResponseDto = void 0;
const class_validator_1 = require("class-validator");
class SuccessResponseDto {
    success = true;
    data;
    meta;
    pagination;
    message;
}
exports.SuccessResponseDto = SuccessResponseDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], SuccessResponseDto.prototype, "data", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], SuccessResponseDto.prototype, "meta", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], SuccessResponseDto.prototype, "pagination", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SuccessResponseDto.prototype, "message", void 0);
class ErrorResponseDto {
    success = false;
    error;
}
exports.ErrorResponseDto = ErrorResponseDto;
class BaseResponseDto {
    success;
    message;
}
exports.BaseResponseDto = BaseResponseDto;
__decorate([
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], BaseResponseDto.prototype, "success", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], BaseResponseDto.prototype, "message", void 0);
class HealthCheckResponseDto extends BaseResponseDto {
    success = true;
    data;
}
exports.HealthCheckResponseDto = HealthCheckResponseDto;
//# sourceMappingURL=response.dto.js.map