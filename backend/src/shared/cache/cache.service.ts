import { Injectable, Inject, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'redis';

export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  prefix?: string;
}

export interface CacheStats {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  totalKeys: number;
}

@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);
  private client: Redis.RedisClientType;
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
    totalKeys: 0,
  };

  constructor(
    @Inject('REDIS_CLIENT') private readonly redisClient: Redis.RedisClientType,
    private readonly configService: ConfigService,
  ) {
    this.client = redisClient;
  }

  /**
   * الحصول على قيمة من الكاش
   */
  async get<T = any>(key: string): Promise<T | null> {
    try {
      const value = await this.client.get(key);
      if (value) {
        this.stats.hits++;
        return JSON.parse(value) as T;
      }
      this.stats.misses++;
      return null;
    } catch (error) {
      this.logger.error(`فشل في قراءة المفتاح ${key} من الكاش:`, error);
      return null;
    }
  }

  /**
   * حفظ قيمة في الكاش
   */
  async set<T = any>(
    key: string,
    value: T,
    options: CacheOptions = {},
  ): Promise<void> {
    try {
      const serializedValue = JSON.stringify(value);
      const ttl =
        options.ttl || this.configService.get('app.cache.defaultTtl', 300); // 5 minutes default

      if (ttl && ttl > 0) {
        await this.client.setEx(key, ttl, serializedValue);
      } else {
        await this.client.set(key, serializedValue);
      }

      this.stats.sets++;
    } catch (error) {
      this.logger.error(`فشل في حفظ المفتاح ${key} في الكاش:`, error);
    }
  }

  /**
   * حذف مفتاح من الكاش
   */
  async delete(key: string): Promise<boolean> {
    try {
      const result = await this.client.del(key);
      if (result > 0) {
        this.stats.deletes++;
        return true;
      }
      return false;
    } catch (error) {
      this.logger.error(`فشل في حذف المفتاح ${key} من الكاش:`, error);
      return false;
    }
  }

  /**
   * حذف مفاتيح متعددة من الكاش
   */
  async deleteMany(pattern: string): Promise<number> {
    try {
      const keys = (await (this.client as any).keys(pattern)) as string[];
      if (keys && keys.length > 0) {
        const result = await this.client.del(keys);
        this.stats.deletes += result;
        return result;
      }
      return 0;
    } catch (error) {
      this.logger.error(`فشل في حذف المفاتيح بالنمط ${pattern}:`, error);
      return 0;
    }
  }

  /**
   * التحقق من وجود مفتاح
   */
  async exists(key: string): Promise<boolean> {
    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      this.logger.error(`فشل في التحقق من وجود المفتاح ${key}:`, error);
      return false;
    }
  }

  /**
   * الحصول على وقت انتهاء صلاحية مفتاح
   */
  async ttl(key: string): Promise<number> {
    try {
      return await this.client.ttl(key);
    } catch (error) {
      this.logger.error(`فشل في الحصول على TTL للمفتاح ${key}:`, error);
      return -2; // Error code
    }
  }

  /**
   * تمديد وقت صلاحية مفتاح
   */
  async expire(key: string, ttl: number): Promise<boolean> {
    try {
      const result = await this.client.expire(key, ttl);
      return result === 1;
    } catch (error) {
      this.logger.error(`فشل في تمديد TTL للمفتاح ${key}:`, error);
      return false;
    }
  }

  /**
   * زيادة قيمة عددية
   */
  async increment(key: string, amount: number = 1): Promise<number> {
    try {
      return await this.client.incrBy(key, amount);
    } catch (error) {
      this.logger.error(`فشل في زيادة القيمة للمفتاح ${key}:`, error);
      return 0;
    }
  }

  /**
   * حفظ كائن مع TTL تلقائي
   */
  async setObject<T = any>(
    key: string,
    value: T,
    ttl: number = 300,
  ): Promise<void> {
    await this.set(key, value, { ttl });
  }

  /**
   * الحصول على كائن من الكاش
   */
  async getObject<T = any>(key: string): Promise<T | null> {
    return this.get<T>(key);
  }

  /**
   * تنظيف الكاش بالكامل (للتطوير فقط)
   */
  async clear(): Promise<void> {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('لا يمكن تنظيف الكاش بالكامل في وضع الإنتاج');
    }

    try {
      await this.client.flushAll();
      this.logger.warn('تم تنظيف الكاش بالكامل');
    } catch (error) {
      this.logger.error('فشل في تنظيف الكاش:', error);
    }
  }

  /**
   * الحصول على إحصائيات الكاش
   */
  getStats(): CacheStats {
    return { ...this.stats };
  }

  /**
   * إعادة تعيين الإحصائيات
   */
  resetStats(): void {
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      totalKeys: 0,
    };
  }

  /**
   * الحصول على معلومات الكاش
   */
  async getInfo(): Promise<Record<string, string> | null> {
    try {
      const info = await this.client.info();
      return this.parseRedisInfo(info);
    } catch (error) {
      this.logger.error('فشل في الحصول على معلومات Redis:', error);
      return null;
    }
  }

  private parseRedisInfo(info: string): Record<string, string> {
    const lines = info.split('\r\n');
    const parsed: Record<string, string> = {};

    for (const line of lines) {
      if (line.includes(':')) {
        const [key, value] = line.split(':');
        parsed[key] = value;
      }
    }

    return parsed;
  }

  /**
   * الحصول على مفاتيح تطابق نمط
   */
  async getKeys(pattern: string): Promise<string[]> {
    try {
      const keys = await this.client.keys(pattern);
      return keys;
    } catch (error) {
      this.logger.error(`فشل في الحصول على المفاتيح بالنمط ${pattern}:`, error);
      return [];
    }
  }

  /**
   * اختبار الاتصال
   */
  async ping(): Promise<boolean> {
    try {
      const result = await this.client.ping();
      return result === 'PONG';
    } catch (error) {
      this.logger.error('فشل في ping Redis:', error);
      return false;
    }
  }
}
