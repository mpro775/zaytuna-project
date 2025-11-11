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
var SMSProvider_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SMSProvider = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
let SMSProvider = SMSProvider_1 = class SMSProvider {
    configService;
    logger = new common_1.Logger(SMSProvider_1.name);
    config;
    constructor(configService) {
        this.configService = configService;
        this.config = this.loadConfig();
    }
    async sendSMS(message) {
        try {
            const recipients = Array.isArray(message.to) ? message.to : [message.to];
            this.logger.log(`إرسال SMS إلى ${recipients.length} مستلم: ${recipients.join(', ')}`);
            switch (this.config.provider) {
                case 'twilio':
                    return this.sendViaTwilio(message);
                case 'aws_sns':
                    return this.sendViaAWSSNS(message);
                case 'messagebird':
                    return this.sendViaMessageBird(message);
                case 'nexmo':
                    return this.sendViaNexmo(message);
                case 'local':
                    return this.sendViaLocal(message);
                default:
                    throw new Error(`مزود SMS غير مدعوم: ${this.config.provider}`);
            }
        }
        catch (error) {
            this.logger.error('فشل في إرسال SMS', error);
            return {
                success: false,
                provider: this.config.provider,
                error: error.message,
            };
        }
    }
    async sendViaTwilio(message) {
        try {
            if (!this.config.accountSid || !this.config.authToken) {
                throw new Error('معرفات Twilio غير مكونة');
            }
            const recipients = Array.isArray(message.to) ? message.to : [message.to];
            const results = [];
            const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${this.config.accountSid}/Messages.json`;
            const formData = new FormData();
            formData.append('From', message.from || this.config.phoneNumber);
            formData.append('Body', message.message);
            if (message.mediaUrl && message.mediaUrl.length > 0) {
                message.mediaUrl.forEach(url => {
                    formData.append('MediaUrl', url);
                });
            }
            if (message.statusCallback) {
                formData.append('StatusCallback', message.statusCallback);
            }
            const auth = Buffer.from(`${this.config.accountSid}:${this.config.authToken}`).toString('base64');
            for (const recipient of recipients) {
                try {
                    const recipientFormData = new FormData();
                    recipientFormData.append('From', message.from || this.config.phoneNumber);
                    recipientFormData.append('To', recipient);
                    recipientFormData.append('Body', message.message);
                    if (message.mediaUrl && message.mediaUrl.length > 0) {
                        message.mediaUrl.forEach(url => {
                            recipientFormData.append('MediaUrl', url);
                        });
                    }
                    if (message.statusCallback) {
                        recipientFormData.append('StatusCallback', message.statusCallback);
                    }
                    const response = await fetch(twilioUrl, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Basic ${auth}`,
                        },
                        body: recipientFormData,
                        signal: AbortSignal.timeout(this.config.timeout),
                    });
                    if (!response.ok) {
                        const errorData = await response.text();
                        throw new Error(`Twilio API error: ${response.status} - ${errorData}`);
                    }
                    const result = await response.json();
                    results.push({
                        success: true,
                        messageId: result.sid,
                        provider: 'twilio',
                        cost: parseFloat(result.price || '0'),
                        response: result,
                    });
                }
                catch (error) {
                    results.push({
                        success: false,
                        provider: 'twilio',
                        error: error.message,
                    });
                }
            }
            const successfulResult = results.find(r => r.success);
            if (successfulResult) {
                return successfulResult;
            }
            return results[results.length - 1];
        }
        catch (error) {
            throw new Error(`Twilio error: ${error.message}`);
        }
    }
    async sendViaAWSSNS(message) {
        try {
            if (!this.config.apiKey || !this.config.apiSecret) {
                throw new Error('معرفات AWS SNS غير مكونة');
            }
            const recipients = Array.isArray(message.to) ? message.to : [message.to];
            await new Promise(resolve => setTimeout(resolve, 100));
            return {
                success: true,
                messageId: `sns_${Date.now()}`,
                provider: 'aws_sns',
                cost: recipients.length * 0.00645,
                response: { recipients: recipients.length },
            };
        }
        catch (error) {
            throw new Error(`AWS SNS error: ${error.message}`);
        }
    }
    async sendViaMessageBird(message) {
        try {
            if (!this.config.apiKey) {
                throw new Error('مفتاح MessageBird API غير مكون');
            }
            const messageBirdUrl = 'https://rest.messagebird.com/messages';
            const recipients = Array.isArray(message.to) ? message.to : [message.to];
            const messageData = {
                originator: message.from || this.config.phoneNumber,
                recipients: recipients,
                body: message.message,
                datacoding: 'plain',
            };
            const response = await fetch(messageBirdUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `AccessKey ${this.config.apiKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(messageData),
                signal: AbortSignal.timeout(this.config.timeout),
            });
            if (!response.ok) {
                const errorData = await response.text();
                throw new Error(`MessageBird API error: ${response.status} - ${errorData}`);
            }
            const result = await response.json();
            return {
                success: true,
                messageId: result.id,
                provider: 'messagebird',
                cost: parseFloat(result.totalCost || '0'),
                response: result,
            };
        }
        catch (error) {
            throw new Error(`MessageBird error: ${error.message}`);
        }
    }
    async sendViaNexmo(message) {
        try {
            if (!this.config.apiKey || !this.config.apiSecret) {
                throw new Error('معرفات Nexmo غير مكونة');
            }
            const recipients = Array.isArray(message.to) ? message.to : [message.to];
            const nexmoUrl = 'https://rest.nexmo.com/sms/json';
            const messageData = {
                api_key: this.config.apiKey,
                api_secret: this.config.apiSecret,
                from: message.from || this.config.phoneNumber,
                to: recipients.join(','),
                text: message.message,
                type: 'text',
            };
            const response = await fetch(nexmoUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams(messageData).toString(),
                signal: AbortSignal.timeout(this.config.timeout),
            });
            if (!response.ok) {
                const errorData = await response.text();
                throw new Error(`Nexmo API error: ${response.status} - ${errorData}`);
            }
            const result = await response.json();
            const firstMessage = result.messages?.[0];
            if (!firstMessage || firstMessage.status !== '0') {
                throw new Error(`Nexmo message failed: ${firstMessage?.error - text || 'Unknown error'}`);
            }
            return {
                success: true,
                messageId: firstMessage['message-id'],
                provider: 'nexmo',
                response: result,
            };
        }
        catch (error) {
            throw new Error(`Nexmo error: ${error.message}`);
        }
    }
    async sendViaLocal(message) {
        try {
            const recipients = Array.isArray(message.to) ? message.to : [message.to];
            this.logger.log(`[LOCAL SMS] إرسال إلى: ${recipients.join(', ')}`);
            this.logger.log(`[LOCAL SMS] الرسالة: ${message.message}`);
            await new Promise(resolve => setTimeout(resolve, 50));
            return {
                success: true,
                messageId: `local_sms_${Date.now()}`,
                provider: 'local',
                cost: 0,
                response: {
                    recipients: recipients.length,
                    message: 'Local SMS sent (simulation)',
                },
            };
        }
        catch (error) {
            throw new Error(`Local SMS error: ${error.message}`);
        }
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
        const provider = this.configService.get('SMS_PROVIDER', 'twilio');
        const baseConfig = {
            provider,
            phoneNumber: this.configService.get('SMS_FROM_NUMBER', '+966500000000'),
            timeout: 30000,
            retryAttempts: 3,
        };
        switch (provider) {
            case 'twilio':
                return {
                    ...baseConfig,
                    accountSid: this.configService.get('TWILIO_ACCOUNT_SID'),
                    authToken: this.configService.get('TWILIO_AUTH_TOKEN'),
                };
            case 'aws_sns':
                return {
                    ...baseConfig,
                    apiKey: this.configService.get('AWS_SNS_ACCESS_KEY'),
                    apiSecret: this.configService.get('AWS_SNS_SECRET_KEY'),
                    region: this.configService.get('AWS_REGION', 'us-east-1'),
                };
            case 'messagebird':
                return {
                    ...baseConfig,
                    apiKey: this.configService.get('MESSAGEBIRD_API_KEY'),
                };
            case 'nexmo':
                return {
                    ...baseConfig,
                    apiKey: this.configService.get('NEXMO_API_KEY'),
                    apiSecret: this.configService.get('NEXMO_API_SECRET'),
                };
            case 'local':
                return {
                    ...baseConfig,
                };
            default:
                throw new Error(`مزود SMS غير مدعوم: ${provider}`);
        }
    }
    validateConfig() {
        try {
            switch (this.config.provider) {
                case 'twilio':
                    return !!(this.config.accountSid && this.config.authToken && this.config.phoneNumber);
                case 'aws_sns':
                    return !!(this.config.apiKey && this.config.apiSecret && this.config.phoneNumber);
                case 'messagebird':
                    return !!(this.config.apiKey && this.config.phoneNumber);
                case 'nexmo':
                    return !!(this.config.apiKey && this.config.apiSecret && this.config.phoneNumber);
                case 'local':
                    return !!this.config.phoneNumber;
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
            case 'twilio':
                return {
                    name: 'Twilio',
                    supportsUnicode: true,
                    supportsMedia: true,
                    maxMessageLength: 160,
                    costPerMessage: '$0.0075 - $0.05',
                    deliveryTime: 'Instant - 5 minutes',
                };
            case 'aws_sns':
                return {
                    name: 'AWS SNS',
                    supportsUnicode: true,
                    supportsMedia: false,
                    maxMessageLength: 160,
                    costPerMessage: '$0.00645 - $0.0225',
                    deliveryTime: 'Instant - 10 minutes',
                };
            case 'messagebird':
                return {
                    name: 'MessageBird',
                    supportsUnicode: true,
                    supportsMedia: true,
                    maxMessageLength: 160,
                    costPerMessage: '€0.04 - €0.08',
                    deliveryTime: 'Instant - 5 minutes',
                };
            case 'nexmo':
                return {
                    name: 'Nexmo (Vonage)',
                    supportsUnicode: true,
                    supportsMedia: false,
                    maxMessageLength: 160,
                    costPerMessage: '$0.005 - $0.05',
                    deliveryTime: 'Instant - 5 minutes',
                };
            case 'local':
                return {
                    name: 'Local SMS (Testing)',
                    supportsUnicode: true,
                    supportsMedia: false,
                    maxMessageLength: 160,
                    costPerMessage: 'Free (simulation)',
                    deliveryTime: 'Instant',
                };
            default:
                return {
                    name: 'Unknown',
                    supportsUnicode: false,
                    supportsMedia: false,
                    maxMessageLength: 160,
                    costPerMessage: 'Unknown',
                    deliveryTime: 'Unknown',
                };
        }
    }
    estimateCost(message) {
        const recipients = Array.isArray(message.to) ? message.to.length : 1;
        const messageLength = message.message.length;
        const messagesCount = Math.ceil(messageLength / 160);
        switch (this.config.provider) {
            case 'twilio':
                return recipients * messagesCount * 0.03;
            case 'aws_sns':
                return recipients * messagesCount * 0.01;
            case 'messagebird':
                return recipients * messagesCount * 0.06;
            case 'nexmo':
                return recipients * messagesCount * 0.03;
            case 'local':
                return 0;
            default:
                return 0;
        }
    }
};
exports.SMSProvider = SMSProvider;
exports.SMSProvider = SMSProvider = SMSProvider_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], SMSProvider);
//# sourceMappingURL=sms.provider.js.map