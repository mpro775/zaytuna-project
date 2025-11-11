import { SetMetadata } from '@nestjs/common';
import { CacheOptions } from '../interceptors/cache.interceptor';

export const CACHE_KEY = 'cache';

/**
 * Decorator لتفعيل الكاش على endpoint
 * @param options خيارات الكاش
 */
export const Cache = (options: CacheOptions = {}) =>
  SetMetadata(CACHE_KEY, options);

/**
 * Decorator لإبطال الكاش
 * @param patterns أنماط المفاتيح المراد إبطالها
 */
export const InvalidateCache = (...patterns: string[]) =>
  SetMetadata('invalidate_cache', patterns);

/**
 * Decorator للكاش لفترة قصيرة (5 دقائق)
 */
export const CacheShort = () => Cache({ ttl: 300 });

/**
 * Decorator للكاش لفترة متوسطة (30 دقيقة)
 */
export const CacheMedium = () => Cache({ ttl: 1800 });

/**
 * Decorator للكاش لفترة طويلة (2 ساعة)
 */
export const CacheLong = () => Cache({ ttl: 7200 });

/**
 * Decorator للكاش لفترة دائمة (24 ساعة)
 */
export const CachePermanent = () => Cache({ ttl: 86400 });
