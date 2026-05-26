import { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'redis';

export const REDIS_CLIENT = 'REDIS_CLIENT';

export const redisProviders: Provider[] = [
  {
    provide: REDIS_CLIENT,
    useFactory: async (configService: ConfigService): Promise<any> => {
      const cacheEnabled =
        configService.get<boolean>('app.cache.enabled') ??
        process.env.CACHE_ENABLED === 'true';
      const redisEnabled =
        configService.get<boolean>('redis.enabled') ??
        process.env.REDIS_ENABLED === 'true';

      if (!cacheEnabled || !redisEnabled) {
        const store = new Map<string, { value: string; expiresAt?: number }>();
        return {
          async get(key: string) {
            const entry = store.get(key);
            if (!entry) return null;
            if (entry.expiresAt && entry.expiresAt < Date.now()) {
              store.delete(key);
              return null;
            }
            return entry.value;
          },
          async set(key: string, value: string) {
            store.set(key, { value });
          },
          async setEx(key: string, ttl: number, value: string) {
            store.set(key, { value, expiresAt: Date.now() + ttl * 1000 });
          },
          async del(keys: string | string[]) {
            const list = Array.isArray(keys) ? keys : [keys];
            let count = 0;
            for (const key of list) {
              if (store.delete(key)) count++;
            }
            return count;
          },
          async keys(pattern: string) {
            const regex = new RegExp(`^${pattern.replace(/\*/g, '.*')}$`);
            return [...store.keys()].filter((key) => regex.test(key));
          },
          async exists(key: string) {
            return store.has(key) ? 1 : 0;
          },
          async ttl() {
            return -1;
          },
          async expire() {
            return 1;
          },
          async incrBy(key: string, amount: number) {
            const current = Number((await this.get(key)) ?? 0) + amount;
            await this.set(key, String(current));
            return current;
          },
          async flushAll() {
            store.clear();
          },
          async info() {
            return 'memory:enabled\r\n';
          },
          async ping() {
            return 'PONG';
          },
        };
      }

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
