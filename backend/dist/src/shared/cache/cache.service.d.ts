import { ConfigService } from '@nestjs/config';
import Redis from 'redis';
export interface CacheOptions {
    ttl?: number;
    prefix?: string;
}
export interface CacheStats {
    hits: number;
    misses: number;
    sets: number;
    deletes: number;
    totalKeys: number;
}
export declare class CacheService {
    private readonly redisClient;
    private readonly configService;
    private readonly logger;
    private client;
    private stats;
    constructor(redisClient: Redis.RedisClientType, configService: ConfigService);
    get<T = any>(key: string): Promise<T | null>;
    set<T = any>(key: string, value: T, options?: CacheOptions): Promise<void>;
    delete(key: string): Promise<boolean>;
    deleteMany(pattern: string): Promise<number>;
    exists(key: string): Promise<boolean>;
    ttl(key: string): Promise<number>;
    expire(key: string, ttl: number): Promise<boolean>;
    increment(key: string, amount?: number): Promise<number>;
    setObject<T = any>(key: string, value: T, ttl?: number): Promise<void>;
    getObject<T = any>(key: string): Promise<T | null>;
    clear(): Promise<void>;
    getStats(): CacheStats;
    resetStats(): void;
    getInfo(): Promise<Record<string, string> | null>;
    private parseRedisInfo;
    getKeys(pattern: string): Promise<string[]>;
    ping(): Promise<boolean>;
}
