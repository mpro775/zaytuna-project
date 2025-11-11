"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var PaymentSecurityService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentSecurityService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const crypto = __importStar(require("crypto"));
let PaymentSecurityService = PaymentSecurityService_1 = class PaymentSecurityService {
    configService;
    logger = new common_1.Logger(PaymentSecurityService_1.name);
    algorithm = 'aes-256-gcm';
    keyLength = 32;
    ivLength = 16;
    constructor(configService) {
        this.configService = configService;
    }
    encryptCardData(cardData) {
        try {
            const encryptionKey = this.getEncryptionKey();
            const iv = crypto.randomBytes(this.ivLength);
            const cipher = crypto.createCipheriv(this.algorithm, encryptionKey, iv);
            const dataString = JSON.stringify(cardData);
            let encrypted = cipher.update(dataString, 'utf8', 'hex');
            encrypted += cipher.final('hex');
            const tag = cipher.getAuthTag();
            return {
                encrypted,
                iv: iv.toString('hex'),
                tag: tag.toString('hex'),
            };
        }
        catch (error) {
            this.logger.error('فشل في تشفير بيانات البطاقة', error);
            throw new Error('فشل في تشفير البيانات الحساسة');
        }
    }
    decryptCardData(encryptedData) {
        try {
            const encryptionKey = this.getEncryptionKey();
            const decipher = crypto.createDecipheriv(this.algorithm, encryptionKey, Buffer.from(encryptedData.iv, 'hex'));
            if (encryptedData.tag) {
                decipher.setAuthTag(Buffer.from(encryptedData.tag, 'hex'));
            }
            let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
            decrypted += decipher.final('utf8');
            return JSON.parse(decrypted);
        }
        catch (error) {
            this.logger.error('فشل في فك تشفير بيانات البطاقة', error);
            throw new Error('فشل في فك تشفير البيانات الحساسة');
        }
    }
    createCardToken(cardData) {
        try {
            const fingerprint = this.createCardFingerprint(cardData);
            const token = this.generateSecureToken();
            const last4 = cardData.number.slice(-4);
            const brand = this.detectCardBrand(cardData.number);
            return {
                token,
                last4,
                brand,
                expiryMonth: cardData.expiryMonth,
                expiryYear: cardData.expiryYear,
                fingerprint,
            };
        }
        catch (error) {
            this.logger.error('فشل في إنشاء token للبطاقة', error);
            throw new Error('فشل في إنشاء token آمن');
        }
    }
    validateCardNumber(cardNumber) {
        try {
            const cleaned = cardNumber.replace(/\s+/g, '').replace(/-/g, '');
            if (!/^\d+$/.test(cleaned)) {
                return false;
            }
            if (cleaned.length < 13 || cleaned.length > 19) {
                return false;
            }
            let sum = 0;
            let alternate = false;
            for (let i = cleaned.length - 1; i >= 0; i--) {
                let digit = parseInt(cleaned.charAt(i), 10);
                if (alternate) {
                    digit *= 2;
                    if (digit > 9) {
                        digit -= 9;
                    }
                }
                sum += digit;
                alternate = !alternate;
            }
            return sum % 10 === 0;
        }
        catch (error) {
            return false;
        }
    }
    validateExpiryDate(month, year) {
        try {
            const currentDate = new Date();
            const currentYear = currentDate.getFullYear();
            const currentMonth = currentDate.getMonth() + 1;
            const expiryMonth = parseInt(month, 10);
            const expiryYear = parseInt(year, 10);
            if (expiryMonth < 1 || expiryMonth > 12) {
                return false;
            }
            if (expiryYear < currentYear || (expiryYear === currentYear && expiryMonth < currentMonth)) {
                return false;
            }
            return true;
        }
        catch (error) {
            return false;
        }
    }
    validateCVV(cvv, cardNumber) {
        try {
            const brand = this.detectCardBrand(cardNumber);
            const cvvLength = cvv.length;
            if (brand === 'amex') {
                return cvvLength === 4 && /^\d{4}$/.test(cvv);
            }
            else {
                return cvvLength === 3 && /^\d{3}$/.test(cvv);
            }
        }
        catch (error) {
            return false;
        }
    }
    createDataHash(data) {
        try {
            const dataString = JSON.stringify(data);
            return crypto.createHash('sha256').update(dataString).digest('hex');
        }
        catch (error) {
            this.logger.error('فشل في إنشاء hash للبيانات', error);
            throw new Error('فشل في إنشاء hash');
        }
    }
    verifyDataHash(data, expectedHash) {
        try {
            const calculatedHash = this.createDataHash(data);
            return crypto.timingSafeEqual(Buffer.from(calculatedHash, 'hex'), Buffer.from(expectedHash, 'hex'));
        }
        catch (error) {
            this.logger.error('فشل في التحقق من hash البيانات', error);
            return false;
        }
    }
    createHMAC(data, secret) {
        try {
            const dataString = JSON.stringify(data);
            return crypto.createHmac('sha256', secret).update(dataString).digest('hex');
        }
        catch (error) {
            this.logger.error('فشل في إنشاء HMAC', error);
            throw new Error('فشل في إنشاء HMAC');
        }
    }
    verifyHMAC(data, hmac, secret) {
        try {
            const calculatedHMAC = this.createHMAC(data, secret);
            return crypto.timingSafeEqual(Buffer.from(calculatedHMAC, 'hex'), Buffer.from(hmac, 'hex'));
        }
        catch (error) {
            this.logger.error('فشل في التحقق من HMAC', error);
            return false;
        }
    }
    generateSecureToken(length = 32) {
        return crypto.randomBytes(length).toString('hex');
    }
    detectCardBrand(cardNumber) {
        try {
            const cleaned = cardNumber.replace(/\s+/g, '').replace(/-/g, '');
            if (/^4/.test(cleaned)) {
                return 'visa';
            }
            if (/^5[1-5]/.test(cleaned) || /^2[2-7]/.test(cleaned)) {
                return 'mastercard';
            }
            if (/^3[47]/.test(cleaned)) {
                return 'amex';
            }
            if (/^6(?:011|5)/.test(cleaned)) {
                return 'discover';
            }
            if (/^(?:2131|1800|35\d{3})\d{11}$/.test(cleaned)) {
                return 'jcb';
            }
            if (/^3[068]/.test(cleaned)) {
                return 'diners';
            }
            return 'unknown';
        }
        catch (error) {
            return 'unknown';
        }
    }
    sanitizeCardNumber(cardNumber) {
        return cardNumber.replace(/\s+/g, '').replace(/-/g, '');
    }
    maskCardNumber(cardNumber) {
        try {
            const cleaned = this.sanitizeCardNumber(cardNumber);
            const last4 = cleaned.slice(-4);
            const first6 = cleaned.slice(0, 6);
            const masked = '•'.repeat(cleaned.length - 10);
            return `${first6}${masked}${last4}`;
        }
        catch (error) {
            return '••••••••••••••••';
        }
    }
    validatePasswordStrength(password) {
        const feedback = [];
        let score = 0;
        if (password.length >= 8) {
            score += 1;
        }
        else {
            feedback.push('كلمة المرور يجب أن تكون 8 أحرف على الأقل');
        }
        if (/[A-Z]/.test(password)) {
            score += 1;
        }
        else {
            feedback.push('كلمة المرور يجب أن تحتوي على حرف كبير واحد على الأقل');
        }
        if (/[a-z]/.test(password)) {
            score += 1;
        }
        else {
            feedback.push('كلمة المرور يجب أن تحتوي على حرف صغير واحد على الأقل');
        }
        if (/\d/.test(password)) {
            score += 1;
        }
        else {
            feedback.push('كلمة المرور يجب أن تحتوي على رقم واحد على الأقل');
        }
        if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
            score += 1;
        }
        else {
            feedback.push('كلمة المرور يجب أن تحتوي على رمز خاص واحد على الأقل');
        }
        return {
            isValid: score >= 4,
            score,
            feedback,
        };
    }
    getEncryptionKey() {
        const key = this.configService.get('PAYMENT_ENCRYPTION_KEY');
        if (!key) {
            throw new Error('مفتاح التشفير غير مكون');
        }
        if (typeof key === 'string') {
            return crypto.scryptSync(key, 'salt', this.keyLength);
        }
        throw new Error('مفتاح التشفير غير صحيح');
    }
    createCardFingerprint(cardData) {
        try {
            const cleanedNumber = this.sanitizeCardNumber(cardData.number);
            const fingerprintData = `${cleanedNumber}:${cardData.holderName}:${cardData.expiryMonth}:${cardData.expiryYear}`;
            return crypto.createHash('sha256').update(fingerprintData).digest('hex');
        }
        catch (error) {
            this.logger.error('فشل في إنشاء fingerprint للبطاقة', error);
            return 'unknown';
        }
    }
};
exports.PaymentSecurityService = PaymentSecurityService;
exports.PaymentSecurityService = PaymentSecurityService = PaymentSecurityService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], PaymentSecurityService);
//# sourceMappingURL=payment-security.service.js.map