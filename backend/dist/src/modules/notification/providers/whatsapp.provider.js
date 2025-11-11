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
var WhatsAppProvider_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WhatsAppProvider = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
let WhatsAppProvider = WhatsAppProvider_1 = class WhatsAppProvider {
    configService;
    logger = new common_1.Logger(WhatsAppProvider_1.name);
    config;
    constructor(configService) {
        this.configService = configService;
        this.config = this.loadConfig();
    }
    async sendWhatsApp(message) {
        try {
            this.logger.log(`إرسال WhatsApp إلى: ${message.to} - نوع: ${message.type}`);
            switch (this.config.provider) {
                case 'whatsapp_business':
                    return this.sendViaWhatsAppBusiness(message);
                case '360dialog':
                    return this.sendVia360Dialog(message);
                case 'twilio':
                    return this.sendViaTwilio(message);
                case 'local':
                    return this.sendViaLocal(message);
                default:
                    throw new Error(`مزود WhatsApp غير مدعوم: ${this.config.provider}`);
            }
        }
        catch (error) {
            this.logger.error('فشل في إرسال WhatsApp', error);
            return {
                success: false,
                provider: this.config.provider,
                error: error.message,
            };
        }
    }
    async sendViaWhatsAppBusiness(message) {
        try {
            if (!this.config.phoneNumberId) {
                throw new Error('معرف رقم الهاتف غير مكون');
            }
            const url = `${this.config.baseUrl}/${this.config.phoneNumberId}/messages`;
            const messageData = {
                messaging_product: 'whatsapp',
                recipient_type: 'individual',
                to: this.formatPhoneNumber(message.to),
                type: message.type,
                ...message,
            };
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.config.accessToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(messageData),
                signal: AbortSignal.timeout(this.config.timeout),
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`WhatsApp Business API error: ${response.status} - ${JSON.stringify(errorData)}`);
            }
            const result = await response.json();
            return {
                success: true,
                messageId: result.messages?.[0]?.id,
                provider: 'whatsapp_business',
                conversationId: result.conversation?.id,
                response: result,
            };
        }
        catch (error) {
            throw new Error(`WhatsApp Business API error: ${error.message}`);
        }
    }
    async sendVia360Dialog(message) {
        try {
            const url = `${this.config.baseUrl}/messages`;
            const messageData = {
                recipient_type: 'individual',
                to: this.formatPhoneNumber(message.to),
                type: message.type,
                ...message,
            };
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'D360-API-KEY': this.config.accessToken,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(messageData),
                signal: AbortSignal.timeout(this.config.timeout),
            });
            if (!response.ok) {
                const errorData = await response.text();
                throw new Error(`360Dialog API error: ${response.status} - ${errorData}`);
            }
            const result = await response.json();
            return {
                success: true,
                messageId: result.messages?.[0]?.id,
                provider: '360dialog',
                response: result,
            };
        }
        catch (error) {
            throw new Error(`360Dialog error: ${error.message}`);
        }
    }
    async sendViaTwilio(message) {
        try {
            if (!this.config.accountId) {
                throw new Error('معرف حساب Twilio غير مكون');
            }
            const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${this.config.accountId}/Messages.json`;
            const messageData = {
                From: `whatsapp:${this.config.phoneNumberId}`,
                To: `whatsapp:${this.formatPhoneNumber(message.to)}`,
                Body: message.text?.body || '',
            };
            const auth = Buffer.from(`${this.config.accountId}:${this.config.accessToken}`).toString('base64');
            const response = await fetch(twilioUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `Basic ${auth}`,
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams(messageData).toString(),
                signal: AbortSignal.timeout(this.config.timeout),
            });
            if (!response.ok) {
                const errorData = await response.text();
                throw new Error(`Twilio WhatsApp API error: ${response.status} - ${errorData}`);
            }
            const result = await response.json();
            return {
                success: true,
                messageId: result.sid,
                provider: 'twilio',
                cost: parseFloat(result.price || '0'),
                response: result,
            };
        }
        catch (error) {
            throw new Error(`Twilio WhatsApp error: ${error.message}`);
        }
    }
    async sendViaLocal(message) {
        try {
            this.logger.log(`[LOCAL WhatsApp] إرسال إلى: ${message.to}`);
            this.logger.log(`[LOCAL WhatsApp] النوع: ${message.type}`);
            if (message.text) {
                this.logger.log(`[LOCAL WhatsApp] النص: ${message.text.body}`);
            }
            await new Promise(resolve => setTimeout(resolve, 50));
            return {
                success: true,
                messageId: `local_wa_${Date.now()}`,
                provider: 'local',
                response: {
                    message: 'Local WhatsApp sent (simulation)',
                    type: message.type,
                    recipient: message.to,
                },
            };
        }
        catch (error) {
            throw new Error(`Local WhatsApp error: ${error.message}`);
        }
    }
    createTextMessage(to, body, previewUrl = false) {
        return {
            to,
            type: 'text',
            text: {
                body,
                preview_url: previewUrl,
            },
        };
    }
    createImageMessage(to, imageUrl, caption) {
        return {
            to,
            type: 'image',
            image: {
                link: imageUrl,
                caption,
            },
        };
    }
    createDocumentMessage(to, documentUrl, filename, caption) {
        return {
            to,
            type: 'document',
            document: {
                link: documentUrl,
                filename,
                caption,
            },
        };
    }
    createButtonMessage(to, body, buttons, header, footer) {
        return {
            to,
            type: 'interactive',
            interactive: {
                type: 'button',
                ...(header && {
                    header: {
                        type: 'text',
                        text: header,
                    },
                }),
                body: {
                    text: body,
                },
                ...(footer && {
                    footer: {
                        text: footer,
                    },
                }),
                action: {
                    buttons: buttons.map(btn => ({
                        type: 'reply',
                        reply: {
                            id: btn.id,
                            title: btn.title,
                        },
                    })),
                },
            },
        };
    }
    createListMessage(to, body, buttonText, sections, header, footer) {
        return {
            to,
            type: 'interactive',
            interactive: {
                type: 'list',
                ...(header && {
                    header: {
                        type: 'text',
                        text: header,
                    },
                }),
                body: {
                    text: body,
                },
                ...(footer && {
                    footer: {
                        text: footer,
                    },
                }),
                action: {
                    button: buttonText,
                    sections,
                },
            },
        };
    }
    formatPhoneNumber(phoneNumber) {
        let cleaned = phoneNumber.replace(/\D/g, '');
        if (!cleaned.startsWith('+')) {
            if (cleaned.startsWith('05')) {
                cleaned = '+966' + cleaned.substring(1);
            }
            else if (cleaned.startsWith('5')) {
                cleaned = '+966' + cleaned;
            }
            else {
                cleaned = '+966' + cleaned;
            }
        }
        return cleaned;
    }
    validatePhoneNumber(phoneNumber) {
        try {
            const formatted = this.formatPhoneNumber(phoneNumber);
            const phoneRegex = /^\+\d{10,15}$/;
            return phoneRegex.test(formatted);
        }
        catch (error) {
            return false;
        }
    }
    loadConfig() {
        const provider = this.configService.get('WHATSAPP_PROVIDER', 'whatsapp_business');
        const baseConfig = {
            provider,
            accessToken: this.configService.get('WHATSAPP_ACCESS_TOKEN', ''),
            timeout: 30000,
            retryAttempts: 3,
        };
        switch (provider) {
            case 'whatsapp_business':
                return {
                    ...baseConfig,
                    apiVersion: 'v18.0',
                    baseUrl: 'https://graph.facebook.com',
                    phoneNumberId: this.configService.get('WHATSAPP_PHONE_NUMBER_ID'),
                };
            case '360dialog':
                return {
                    ...baseConfig,
                    apiVersion: 'v1',
                    baseUrl: 'https://waba-v2.360dialog.io',
                };
            case 'twilio':
                return {
                    ...baseConfig,
                    accountId: this.configService.get('TWILIO_ACCOUNT_SID'),
                    phoneNumberId: this.configService.get('WHATSAPP_FROM_NUMBER'),
                    baseUrl: '',
                };
            case 'local':
                return {
                    ...baseConfig,
                    baseUrl: '',
                };
            default:
                throw new Error(`مزود WhatsApp غير مدعوم: ${provider}`);
        }
    }
    validateConfig() {
        try {
            switch (this.config.provider) {
                case 'whatsapp_business':
                    return !!(this.config.accessToken && this.config.phoneNumberId);
                case '360dialog':
                    return !!this.config.accessToken;
                case 'twilio':
                    return !!(this.config.accessToken && this.config.accountId && this.config.phoneNumberId);
                case 'local':
                    return true;
                default:
                    return false;
            }
        }
        catch (error) {
            return false;
        }
    }
    getProviderInfo() {
        switch (this.config.provider) {
            case 'whatsapp_business':
                return {
                    name: 'WhatsApp Business API',
                    supportsTemplates: true,
                    supportsInteractive: true,
                    supportsMedia: true,
                    maxMessageLength: 4096,
                    costPerMessage: '$0.005 - $0.05',
                    deliveryTime: 'Instant - 30 minutes',
                };
            case '360dialog':
                return {
                    name: '360Dialog',
                    supportsTemplates: true,
                    supportsInteractive: true,
                    supportsMedia: true,
                    maxMessageLength: 4096,
                    costPerMessage: '$0.005 - $0.05',
                    deliveryTime: 'Instant - 30 minutes',
                };
            case 'twilio':
                return {
                    name: 'Twilio WhatsApp',
                    supportsTemplates: false,
                    supportsInteractive: false,
                    supportsMedia: true,
                    maxMessageLength: 4096,
                    costPerMessage: '$0.005',
                    deliveryTime: 'Instant - 30 minutes',
                };
            case 'local':
                return {
                    name: 'Local WhatsApp (Testing)',
                    supportsTemplates: false,
                    supportsInteractive: false,
                    supportsMedia: false,
                    maxMessageLength: 4096,
                    costPerMessage: 'Free (simulation)',
                    deliveryTime: 'Instant',
                };
            default:
                return {
                    name: 'Unknown',
                    supportsTemplates: false,
                    supportsInteractive: false,
                    supportsMedia: false,
                    maxMessageLength: 4096,
                    costPerMessage: 'Unknown',
                    deliveryTime: 'Unknown',
                };
        }
    }
    estimateCost(message) {
        switch (this.config.provider) {
            case 'whatsapp_business':
            case '360dialog':
                return 0.03;
            case 'twilio':
                return 0.005;
            case 'local':
                return 0;
            default:
                return 0;
        }
    }
    async checkMessageStatus(messageId) {
        try {
            switch (this.config.provider) {
                case 'whatsapp_business':
                    const url = `${this.config.baseUrl}/${this.config.phoneNumberId}/messages/${messageId}`;
                    const response = await fetch(url, {
                        headers: {
                            'Authorization': `Bearer ${this.config.accessToken}`,
                        },
                    });
                    if (response.ok) {
                        return await response.json();
                    }
                    break;
                case '360dialog':
                    break;
                case 'twilio':
                    break;
            }
            return { status: 'unknown' };
        }
        catch (error) {
            this.logger.error(`فشل في التحقق من حالة الرسالة: ${messageId}`, error);
            return { status: 'error', error: error.message };
        }
    }
};
exports.WhatsAppProvider = WhatsAppProvider;
exports.WhatsAppProvider = WhatsAppProvider = WhatsAppProvider_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], WhatsAppProvider);
//# sourceMappingURL=whatsapp.provider.js.map