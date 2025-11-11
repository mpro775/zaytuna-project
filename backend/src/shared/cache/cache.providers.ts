import { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'redis';

export const REDIS_CLIENT = 'REDIS_CLIENT';

export const redisProviders: Provider[] = [
  {
    provide: REDIS_CLIENT,
    useFactory: async (configService: ConfigService): Promise<any> => {
      const redisConfig = configService.get('redis') as {
        url: string;
        host: string;
        port: number;
        password?: string;
        db: number;
      };

      const client = Redis.createClient({
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
    inject: [ConfigService],
  },
];
