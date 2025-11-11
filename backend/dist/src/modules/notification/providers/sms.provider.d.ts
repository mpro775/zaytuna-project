import { ConfigService } from '@nestjs/config';
export interface SMSConfig {
    provider: 'twilio' | 'aws_sns' | 'messagebird' | 'nexmo' | 'local';
    accountSid?: string;
    authToken?: string;
    apiKey?: string;
    apiSecret?: string;
    phoneNumber: string;
    region?: string;
    timeout: number;
    retryAttempts: number;
}
export interface SMSMessage {
    to: string | string[];
    from?: string;
    message: string;
    mediaUrl?: string[];
    statusCallback?: string;
    metadata?: Record<string, any>;
}
export interface SMSResult {
    success: boolean;
    messageId?: string;
    provider: string;
    cost?: number;
    error?: string;
    response?: any;
}
export declare class SMSProvider {
    private readonly configService;
    private readonly logger;
    private readonly config;
    constructor(configService: ConfigService);
    sendSMS(message: SMSMessage): Promise<SMSResult>;
    private sendViaTwilio;
    private sendViaAWSSNS;
    private sendViaMessageBird;
    private sendViaNexmo;
    private sendViaLocal;
    formatPhoneNumber(phoneNumber: string): string;
    validatePhoneNumber(phoneNumber: string): boolean;
    private loadConfig;
    validateConfig(): boolean;
    getProviderInfo(): {
        name: string;
        supportsUnicode: boolean;
        supportsMedia: boolean;
        maxMessageLength: number;
        costPerMessage: string;
        deliveryTime: string;
    };
    estimateCost(message: SMSMessage): number;
}
