import { ConfigService } from '@nestjs/config';
export interface WhatsAppConfig {
    provider: 'whatsapp_business' | '360dialog' | 'twilio' | 'local';
    accessToken: string;
    phoneNumberId?: string;
    accountId?: string;
    apiVersion: string;
    baseUrl: string;
    timeout: number;
    retryAttempts: number;
}
export interface WhatsAppMessage {
    to: string;
    type: 'text' | 'image' | 'document' | 'audio' | 'video' | 'location' | 'contacts' | 'interactive';
    text?: {
        body: string;
        preview_url?: boolean;
    };
    image?: {
        link?: string;
        id?: string;
        caption?: string;
    };
    document?: {
        link?: string;
        id?: string;
        caption?: string;
        filename?: string;
    };
    audio?: {
        link?: string;
        id?: string;
    };
    video?: {
        link?: string;
        id?: string;
        caption?: string;
    };
    location?: {
        latitude: number;
        longitude: number;
        name?: string;
        address?: string;
    };
    contacts?: Array<{
        name: {
            formatted_name: string;
            first_name?: string;
            last_name?: string;
        };
        phones?: Array<{
            phone: string;
            type?: string;
        }>;
    }>;
    interactive?: {
        type: 'button' | 'list';
        header?: {
            type: 'text';
            text: string;
        };
        body: {
            text: string;
        };
        footer?: {
            text: string;
        };
        action: any;
    };
    metadata?: Record<string, any>;
}
export interface WhatsAppResult {
    success: boolean;
    messageId?: string;
    provider: string;
    conversationId?: string;
    cost?: number;
    error?: string;
    response?: any;
}
export declare class WhatsAppProvider {
    private readonly configService;
    private readonly logger;
    private readonly config;
    constructor(configService: ConfigService);
    sendWhatsApp(message: WhatsAppMessage): Promise<WhatsAppResult>;
    private sendViaWhatsAppBusiness;
    private sendVia360Dialog;
    private sendViaTwilio;
    private sendViaLocal;
    createTextMessage(to: string, body: string, previewUrl?: boolean): WhatsAppMessage;
    createImageMessage(to: string, imageUrl: string, caption?: string): WhatsAppMessage;
    createDocumentMessage(to: string, documentUrl: string, filename?: string, caption?: string): WhatsAppMessage;
    createButtonMessage(to: string, body: string, buttons: Array<{
        id: string;
        title: string;
    }>, header?: string, footer?: string): WhatsAppMessage;
    createListMessage(to: string, body: string, buttonText: string, sections: Array<{
        title: string;
        rows: Array<{
            id: string;
            title: string;
            description?: string;
        }>;
    }>, header?: string, footer?: string): WhatsAppMessage;
    formatPhoneNumber(phoneNumber: string): string;
    validatePhoneNumber(phoneNumber: string): boolean;
    private loadConfig;
    validateConfig(): boolean;
    getProviderInfo(): {
        name: string;
        supportsTemplates: boolean;
        supportsInteractive: boolean;
        supportsMedia: boolean;
        maxMessageLength: number;
        costPerMessage: string;
        deliveryTime: string;
    };
    estimateCost(message: WhatsAppMessage): number;
    checkMessageStatus(messageId: string): Promise<any>;
}
