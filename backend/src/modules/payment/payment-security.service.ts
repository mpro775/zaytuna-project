import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

export interface EncryptedData {
  encrypted: string;
  iv: string;
  tag?: string; // لـ GCM mode
}

export interface CardData {
  number: string;
  expiryMonth: string;
  expiryYear: string;
  cvv: string;
  holderName: string;
}

export interface TokenizedCard {
  token: string;
  last4: string;
  brand: string;
  expiryMonth: string;
  expiryYear: string;
  fingerprint: string; // للكشف عن التكرار
}

@Injectable()
export class PaymentSecurityService {
  private readonly logger = new Logger(PaymentSecurityService.name);
  private readonly algorithm = 'aes-256-gcm';
  private readonly keyLength = 32; // 256 bits
  private readonly ivLength = 16; // 128 bits

  constructor(private readonly configService: ConfigService) {}

  /**
   * تشفير البيانات الحساسة
   */
  encryptCardData(cardData: CardData): EncryptedData {
    try {
      const encryptionKey = this.getEncryptionKey();

      // إنشاء IV عشوائي
      const iv = crypto.randomBytes(this.ivLength);

      // إنشاء cipher
      const cipher = crypto.createCipheriv(this.algorithm, encryptionKey, iv);

      // تحويل البيانات إلى JSON
      const dataString = JSON.stringify(cardData);

      // التشفير
      let encrypted = cipher.update(dataString, 'utf8', 'hex');
      encrypted += cipher.final('hex');

      const tag = cipher.getAuthTag();

      return {
        encrypted,
        iv: iv.toString('hex'),
        tag: tag.toString('hex'),
      };
    } catch (error) {
      this.logger.error('فشل في تشفير بيانات البطاقة', error);
      throw new Error('فشل في تشفير البيانات الحساسة');
    }
  }

  /**
   * فك تشفير البيانات الحساسة
   */
  decryptCardData(encryptedData: EncryptedData): CardData {
    try {
      const encryptionKey = this.getEncryptionKey();

      const decipher = crypto.createDecipheriv(this.algorithm, encryptionKey, Buffer.from(encryptedData.iv, 'hex'));

      if (encryptedData.tag) {
        decipher.setAuthTag(Buffer.from(encryptedData.tag, 'hex'));
      }

      let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return JSON.parse(decrypted);
    } catch (error) {
      this.logger.error('فشل في فك تشفير بيانات البطاقة', error);
      throw new Error('فشل في فك تشفير البيانات الحساسة');
    }
  }

  /**
   * إنشاء token لبيانات البطاقة (tokenization)
   */
  createCardToken(cardData: CardData): TokenizedCard {
    try {
      // إنشاء fingerprint للبطاقة (للكشف عن التكرار)
      const fingerprint = this.createCardFingerprint(cardData);

      // إنشاء token فريد
      const token = this.generateSecureToken();

      // استخراج المعلومات غير الحساسة
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
    } catch (error) {
      this.logger.error('فشل في إنشاء token للبطاقة', error);
      throw new Error('فشل في إنشاء token آمن');
    }
  }

  /**
   * التحقق من صحة البطاقة (Luhn algorithm)
   */
  validateCardNumber(cardNumber: string): boolean {
    try {
      // إزالة المسافات والشرطات
      const cleaned = cardNumber.replace(/\s+/g, '').replace(/-/g, '');

      // التحقق من أن الرقم يحتوي على أرقام فقط
      if (!/^\d+$/.test(cleaned)) {
        return false;
      }

      // التحقق من الطول
      if (cleaned.length < 13 || cleaned.length > 19) {
        return false;
      }

      // تطبيق خوارزمية Luhn
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
    } catch (error) {
      return false;
    }
  }

  /**
   * التحقق من صحة تاريخ انتهاء البطاقة
   */
  validateExpiryDate(month: string, year: string): boolean {
    try {
      const currentDate = new Date();
      const currentYear = currentDate.getFullYear();
      const currentMonth = currentDate.getMonth() + 1;

      const expiryMonth = parseInt(month, 10);
      const expiryYear = parseInt(year, 10);

      // التحقق من صحة الشهر
      if (expiryMonth < 1 || expiryMonth > 12) {
        return false;
      }

      // التحقق من عدم انتهاء الصلاحية
      if (expiryYear < currentYear || (expiryYear === currentYear && expiryMonth < currentMonth)) {
        return false;
      }

      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * التحقق من صحة CVV
   */
  validateCVV(cvv: string, cardNumber: string): boolean {
    try {
      const brand = this.detectCardBrand(cardNumber);
      const cvvLength = cvv.length;

      // American Express تستخدم 4 أرقام، البطاقات الأخرى 3 أرقام
      if (brand === 'amex') {
        return cvvLength === 4 && /^\d{4}$/.test(cvv);
      } else {
        return cvvLength === 3 && /^\d{3}$/.test(cvv);
      }
    } catch (error) {
      return false;
    }
  }

  /**
   * إنشاء hash للتحقق من سلامة البيانات
   */
  createDataHash(data: any): string {
    try {
      const dataString = JSON.stringify(data);
      return crypto.createHash('sha256').update(dataString).digest('hex');
    } catch (error) {
      this.logger.error('فشل في إنشاء hash للبيانات', error);
      throw new Error('فشل في إنشاء hash');
    }
  }

  /**
   * التحقق من hash البيانات
   */
  verifyDataHash(data: any, expectedHash: string): boolean {
    try {
      const calculatedHash = this.createDataHash(data);
      return crypto.timingSafeEqual(
        Buffer.from(calculatedHash, 'hex'),
        Buffer.from(expectedHash, 'hex')
      );
    } catch (error) {
      this.logger.error('فشل في التحقق من hash البيانات', error);
      return false;
    }
  }

  /**
   * إنشاء HMAC للتحقق من سلامة البيانات
   */
  createHMAC(data: any, secret: string): string {
    try {
      const dataString = JSON.stringify(data);
      return crypto.createHmac('sha256', secret).update(dataString).digest('hex');
    } catch (error) {
      this.logger.error('فشل في إنشاء HMAC', error);
      throw new Error('فشل في إنشاء HMAC');
    }
  }

  /**
   * التحقق من HMAC
   */
  verifyHMAC(data: any, hmac: string, secret: string): boolean {
    try {
      const calculatedHMAC = this.createHMAC(data, secret);
      return crypto.timingSafeEqual(
        Buffer.from(calculatedHMAC, 'hex'),
        Buffer.from(hmac, 'hex')
      );
    } catch (error) {
      this.logger.error('فشل في التحقق من HMAC', error);
      return false;
    }
  }

  /**
   * إنشاء token آمن
   */
  generateSecureToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * كشف نوع البطاقة
   */
  detectCardBrand(cardNumber: string): string {
    try {
      const cleaned = cardNumber.replace(/\s+/g, '').replace(/-/g, '');

      // Visa
      if (/^4/.test(cleaned)) {
        return 'visa';
      }

      // MasterCard
      if (/^5[1-5]/.test(cleaned) || /^2[2-7]/.test(cleaned)) {
        return 'mastercard';
      }

      // American Express
      if (/^3[47]/.test(cleaned)) {
        return 'amex';
      }

      // Discover
      if (/^6(?:011|5)/.test(cleaned)) {
        return 'discover';
      }

      // JCB
      if (/^(?:2131|1800|35\d{3})\d{11}$/.test(cleaned)) {
        return 'jcb';
      }

      // Diners Club
      if (/^3[068]/.test(cleaned)) {
        return 'diners';
      }

      return 'unknown';
    } catch (error) {
      return 'unknown';
    }
  }

  /**
   * تنظيف بيانات البطاقة (إزالة المسافات والشرطات)
   */
  sanitizeCardNumber(cardNumber: string): string {
    return cardNumber.replace(/\s+/g, '').replace(/-/g, '');
  }

  /**
   * تنسيق رقم البطاقة للعرض (إخفاء الأرقام الوسطى)
   */
  maskCardNumber(cardNumber: string): string {
    try {
      const cleaned = this.sanitizeCardNumber(cardNumber);
      const last4 = cleaned.slice(-4);
      const first6 = cleaned.slice(0, 6);
      const masked = '•'.repeat(cleaned.length - 10);

      return `${first6}${masked}${last4}`;
    } catch (error) {
      return '••••••••••••••••';
    }
  }

  /**
   * التحقق من قوة كلمة المرور
   */
  validatePasswordStrength(password: string): {
    isValid: boolean;
    score: number;
    feedback: string[];
  } {
    const feedback: string[] = [];
    let score = 0;

    // الطول
    if (password.length >= 8) {
      score += 1;
    } else {
      feedback.push('كلمة المرور يجب أن تكون 8 أحرف على الأقل');
    }

    // الأحرف الكبيرة
    if (/[A-Z]/.test(password)) {
      score += 1;
    } else {
      feedback.push('كلمة المرور يجب أن تحتوي على حرف كبير واحد على الأقل');
    }

    // الأحرف الصغيرة
    if (/[a-z]/.test(password)) {
      score += 1;
    } else {
      feedback.push('كلمة المرور يجب أن تحتوي على حرف صغير واحد على الأقل');
    }

    // الأرقام
    if (/\d/.test(password)) {
      score += 1;
    } else {
      feedback.push('كلمة المرور يجب أن تحتوي على رقم واحد على الأقل');
    }

    // الرموز الخاصة
    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      score += 1;
    } else {
      feedback.push('كلمة المرور يجب أن تحتوي على رمز خاص واحد على الأقل');
    }

    return {
      isValid: score >= 4,
      score,
      feedback,
    };
  }

  // ========== PRIVATE METHODS ==========

  /**
   * الحصول على مفتاح التشفير
   */
  private getEncryptionKey(): Buffer {
    const key = this.configService.get<string>('PAYMENT_ENCRYPTION_KEY');

    if (!key) {
      throw new Error('مفتاح التشفير غير مكون');
    }

    // إذا كان المفتاح نصي، نحوله إلى Buffer
    if (typeof key === 'string') {
      return crypto.scryptSync(key, 'salt', this.keyLength);
    }

    throw new Error('مفتاح التشفير غير صحيح');
  }

  /**
   * إنشاء fingerprint للبطاقة
   */
  private createCardFingerprint(cardData: CardData): string {
    try {
      const cleanedNumber = this.sanitizeCardNumber(cardData.number);
      const fingerprintData = `${cleanedNumber}:${cardData.holderName}:${cardData.expiryMonth}:${cardData.expiryYear}`;

      return crypto.createHash('sha256').update(fingerprintData).digest('hex');
    } catch (error) {
      this.logger.error('فشل في إنشاء fingerprint للبطاقة', error);
      return 'unknown';
    }
  }
}
