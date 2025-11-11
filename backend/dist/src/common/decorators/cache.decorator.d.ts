import { CacheOptions } from '../interceptors/cache.interceptor';
export declare const CACHE_KEY = "cache";
export declare const Cache: (options?: CacheOptions) => import("@nestjs/common").CustomDecorator<string>;
export declare const InvalidateCache: (...patterns: string[]) => import("@nestjs/common").CustomDecorator<string>;
export declare const CacheShort: () => import("@nestjs/common").CustomDecorator<string>;
export declare const CacheMedium: () => import("@nestjs/common").CustomDecorator<string>;
export declare const CacheLong: () => import("@nestjs/common").CustomDecorator<string>;
export declare const CachePermanent: () => import("@nestjs/common").CustomDecorator<string>;
