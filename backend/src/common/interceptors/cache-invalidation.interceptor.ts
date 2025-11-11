import {
  Injectable,
  ExecutionContext,
  CallHandler,
  NestInterceptor,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { CacheService } from '../../shared/cache/cache.service';
import { Reflector } from '@nestjs/core';

@Injectable()
export class CacheInvalidationInterceptor implements NestInterceptor {
  private readonly logger = new Logger(CacheInvalidationInterceptor.name);

  constructor(
    private readonly cacheService: CacheService,
    private readonly reflector: Reflector,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    // التحقق من وجود decorator @InvalidateCache
    const patterns = this.reflector.get<string[]>(
      'invalidate_cache',
      context.getHandler(),
    );

    if (!patterns || patterns.length === 0) {
      return next.handle();
    }

    // تنفيذ الطلب ثم إبطال الكاش
    return next.handle().pipe(
      tap(() => {
        // تشغيل إبطال الكاش في الخلفية بدون انتظار
        this.invalidateCache(patterns).catch((error) => {
          this.logger.error('فشل في إبطال الكاش:', error);
        });
      }),
    );
  }

  private async invalidateCache(patterns: string[]): Promise<void> {
    try {
      for (const pattern of patterns) {
        const deletedCount = await this.cacheService.deleteMany(pattern);
        if (deletedCount > 0) {
          this.logger.debug(
            `تم إبطال ${deletedCount} مفتاح كاش بالنمط: ${pattern}`,
          );
        }
      }
    } catch (error) {
      this.logger.error('فشل في إبطال الكاش:', error);
    }
  }
}
