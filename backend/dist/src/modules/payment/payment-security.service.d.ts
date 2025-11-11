import { ConfigService } from '@nestjs/config';
export interface EncryptedData {
    encrypted: string;
    iv: string;
    tag?: string;
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
    fingerprint: string;
}
export declare class PaymentSecurityService {
    private readonly configService;
    private readonly logger;
    private readonly algorithm;
    private readonly keyLength;
    private readonly ivLength;
    constructor(configService: ConfigService);
    encryptCardData(cardData: CardData): EncryptedData;
    decryptCardData(encryptedData: EncryptedData): CardData;
    createCardToken(cardData: CardData): TokenizedCard;
    validateCardNumber(cardNumber: string): boolean;
    validateExpiryDate(month: string, year: string): boolean;
    validateCVV(cvv: string, cardNumber: string): boolean;
    createDataHash(data: any): string;
    verifyDataHash(data: any, expectedHash: string): boolean;
    createHMAC(data: any, secret: string): string;
    verifyHMAC(data: any, hmac: string, secret: string): boolean;
    generateSecureToken(length?: number): string;
    detectCardBrand(cardNumber: string): string;
    sanitizeCardNumber(cardNumber: string): string;
    maskCardNumber(cardNumber: string): string;
    validatePasswordStrength(password: string): {
        isValid: boolean;
        score: number;
        feedback: string[];
    };
    private getEncryptionKey;
    private createCardFingerprint;
}
