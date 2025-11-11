import { ExecutionContext, CallHandler, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { CacheService } from '../../shared/cache/cache.service';
import { Reflector } from '@nestjs/core';
export interface CacheOptions {
    ttl?: number;
    key?: string;
    condition?: (context: ExecutionContext) => boolean;
}
export declare class CacheInterceptor implements NestInterceptor {
    private readonly cacheService;
    private readonly reflector;
    private readonly logger;
    constructor(cacheService: CacheService, reflector: Reflector);
    intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>>;
    private setCacheData;
    private generateCacheKey;
    private serializeObject;
    private getBodyFingerprint;
}
