import { ConfigService } from '@nestjs/config';
export interface EmailConfig {
    provider: 'sendgrid' | 'mailgun' | 'ses' | 'smtp';
    apiKey?: string;
    apiSecret?: string;
    domain?: string;
    host?: string;
    port?: number;
    secure?: boolean;
    username?: string;
    password?: string;
    fromEmail: string;
    fromName: string;
    replyTo?: string;
    timeout: number;
    retryAttempts: number;
}
export interface EmailMessage {
    to: string | string[];
    cc?: string | string[];
    bcc?: string | string[];
    subject: string;
    text?: string;
    html?: string;
    attachments?: Array<{
        filename: string;
        content: string | Buffer;
        contentType?: string;
        encoding?: string;
    }>;
    templateId?: string;
    templateData?: Record<string, any>;
    headers?: Record<string, string>;
    metadata?: Record<string, any>;
}
export interface EmailResult {
    success: boolean;
    messageId?: string;
    provider: string;
    error?: string;
    response?: any;
}
export declare class EmailProvider {
    private readonly configService;
    private readonly logger;
    private readonly config;
    constructor(configService: ConfigService);
    sendEmail(message: EmailMessage): Promise<EmailResult>;
    private sendViaSendGrid;
    private sendViaMailgun;
    private sendViaSES;
    private sendViaSMTP;
    private formatRecipients;
    private formatRecipientsString;
    private loadConfig;
    validateConfig(): boolean;
    getProviderInfo(): {
        name: string;
        type: 'transactional' | 'marketing' | 'both';
        supportsTemplates: boolean;
        supportsAttachments: boolean;
        maxRecipients: number;
        rateLimit: string;
    };
}
