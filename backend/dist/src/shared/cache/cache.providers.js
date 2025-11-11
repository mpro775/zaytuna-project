"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.redisProviders = exports.REDIS_CLIENT = void 0;
const config_1 = require("@nestjs/config");
const redis_1 = __importDefault(require("redis"));
exports.REDIS_CLIENT = 'REDIS_CLIENT';
exports.redisProviders = [
    {
        provide: exports.REDIS_CLIENT,
        useFactory: async (configService) => {
            const redisConfig = configService.get('redis');
            const client = redis_1.default.createClient({
                url: redisConfig.url,
                socket: {
                    host: redisConfig.host,
                    port: redisConfig.port,
                },
                password: redisConfig.password,
                database: redisConfig.db,
            });
            client.on('error', (err) => {
                console.error('خطأ في اتصال Redis:', err);
            });
            client.on('connect', () => {
                console.log('✅ تم الاتصال بـ Redis بنجاح');
            });
            client.on('ready', () => {
                console.log('🚀 Redis جاهز للاستخدام');
            });
            client.on('end', () => {
                console.log('🔌 تم إغلاق اتصال Redis');
            });
            await client.connect();
            return client;
        },
        inject: [config_1.ConfigService],
    },
];
//# sourceMappingURL=cache.providers.js.map