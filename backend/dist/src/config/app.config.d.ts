declare const _default: (() => {
    nodeEnv: string;
    port: number;
    name: string;
    apiPrefix: string;
    encryptionKey: string;
    storage: {
        type: string;
        path: string;
        s3: {
            accessKeyId: string | undefined;
            secretAccessKey: string | undefined;
            region: string;
            bucket: string | undefined;
        };
    };
    notifications: {
        sms: {
            provider: string;
            twilio: {
                accountSid: string | undefined;
                authToken: string | undefined;
                phoneNumber: string | undefined;
            };
        };
        email: {
            provider: string;
            sendgrid: {
                apiKey: string | undefined;
                fromEmail: string | undefined;
            };
        };
    };
    monitoring: {
        sentry: {
            dsn: string | undefined;
        };
    };
    cache: {
        defaultTtl: number;
        prefix: string;
    };
}) & import("@nestjs/config").ConfigFactoryKeyHost<{
    nodeEnv: string;
    port: number;
    name: string;
    apiPrefix: string;
    encryptionKey: string;
    storage: {
        type: string;
        path: string;
        s3: {
            accessKeyId: string | undefined;
            secretAccessKey: string | undefined;
            region: string;
            bucket: string | undefined;
        };
    };
    notifications: {
        sms: {
            provider: string;
            twilio: {
                accountSid: string | undefined;
                authToken: string | undefined;
                phoneNumber: string | undefined;
            };
        };
        email: {
            provider: string;
            sendgrid: {
                apiKey: string | undefined;
                fromEmail: string | undefined;
            };
        };
    };
    monitoring: {
        sentry: {
            dsn: string | undefined;
        };
    };
    cache: {
        defaultTtl: number;
        prefix: string;
    };
}>;
export default _default;
