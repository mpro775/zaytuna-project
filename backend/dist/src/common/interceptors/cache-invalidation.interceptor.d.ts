import { ExecutionContext, CallHandler, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { CacheService } from '../../shared/cache/cache.service';
import { Reflector } from '@nestjs/core';
export declare class CacheInvalidationInterceptor implements NestInterceptor {
    private readonly cacheService;
    private readonly reflector;
    private readonly logger;
    constructor(cacheService: CacheService, reflector: Reflector);
    intercept(context: ExecutionContext, next: CallHandler): Observable<any>;
    private invalidateCache;
}
