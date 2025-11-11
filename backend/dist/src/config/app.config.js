"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("@nestjs/config");
exports.default = (0, config_1.registerAs)('app', () => ({
    nodeEnv: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT || '3000', 10),
    name: process.env.APP_NAME || 'Zaytuna POS',
    apiPrefix: process.env.API_PREFIX || 'api/v1',
    encryptionKey: process.env.ENCRYPTION_KEY || 'dev_encryption_key_32_characters_long',
    storage: {
        type: process.env.STORAGE_TYPE || 'local',
        path: process.env.STORAGE_PATH || './uploads',
        s3: {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
            region: process.env.AWS_REGION || 'us-east-1',
            bucket: process.env.AWS_S3_BUCKET,
        },
    },
    notifications: {
        sms: {
            provider: process.env.SMS_PROVIDER || 'twilio',
            twilio: {
                accountSid: process.env.TWILIO_ACCOUNT_SID,
                authToken: process.env.TWILIO_AUTH_TOKEN,
                phoneNumber: process.env.TWILIO_PHONE_NUMBER,
            },
        },
        email: {
            provider: process.env.EMAIL_PROVIDER || 'sendgrid',
            sendgrid: {
                apiKey: process.env.SENDGRID_API_KEY,
                fromEmail: process.env.SENDGRID_FROM_EMAIL,
            },
        },
    },
    monitoring: {
        sentry: {
            dsn: process.env.SENTRY_DSN,
        },
    },
    cache: {
        defaultTtl: parseInt(process.env.CACHE_DEFAULT_TTL || '300', 10),
        prefix: process.env.CACHE_PREFIX || 'zaytuna:',
    },
}));
//# sourceMappingURL=app.config.js.map