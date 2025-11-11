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
exports.CustomValidationPipe = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
let CustomValidationPipe = class CustomValidationPipe extends common_1.ValidationPipe {
    configService;
    constructor(configService) {
        super({
            transform: true,
            whitelist: true,
            forbidNonWhitelisted: true,
            forbidUnknownValues: false,
            disableErrorMessages: false,
            validationError: {
                target: false,
                value: false,
            },
        });
        this.configService = configService;
    }
    mapChildrenToValidationErrors(error, parentPath) {
        const errors = super.mapChildrenToValidationErrors(error, parentPath);
        errors.forEach((err) => {
            if (err.constraints) {
                Object.keys(err.constraints).forEach((key) => {
                    err.constraints[key] = this.translateValidationMessage(err.constraints[key], err.property, err.value);
                });
            }
        });
        return errors;
    }
    translateValidationMessage(message, property, value) {
        const translations = {
            'should not be empty': `الحقل ${property} مطلوب`,
            'must be a string': `الحقل ${property} يجب أن يكون نص`,
            'must be a number': `الحقل ${property} يجب أن يكون رقم`,
            'must be an integer number': `الحقل ${property} يجب أن يكون رقم صحيح`,
            'must be a boolean': `الحقل ${property} يجب أن يكون قيمة منطقية`,
            'must be an email': `الحقل ${property} يجب أن يكون بريد إلكتروني صحيح`,
            'must be longer than or equal to': `الحقل ${property} يجب أن يكون طوله على الأقل`,
            'must be shorter than or equal to': `الحقل ${property} يجب أن يكون طوله على الأكثر`,
            'must match': `الحقل ${property} يجب أن يطابق النمط المطلوب`,
        };
        for (const [english, arabic] of Object.entries(translations)) {
            if (message.includes(english)) {
                return arabic;
            }
        }
        return message;
    }
    flattenValidationErrors(errors) {
        const messages = super.flattenValidationErrors(errors);
        if (this.configService.get('NODE_ENV') !== 'production') {
            return messages.map((message, index) => {
                const error = errors[index];
                if (error && error.constraints) {
                    const constraintKeys = Object.keys(error.constraints);
                    if (constraintKeys.length > 0) {
                        return `${message} (${constraintKeys[0]})`;
                    }
                }
                return message;
            });
        }
        return messages;
    }
};
exports.CustomValidationPipe = CustomValidationPipe;
exports.CustomValidationPipe = CustomValidationPipe = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], CustomValidationPipe);
//# sourceMappingURL=validation.pipe.js.map