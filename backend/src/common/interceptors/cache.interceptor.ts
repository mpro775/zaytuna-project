import {
  Injectable,
  ExecutionContext,
  CallHandler,
  NestInterceptor,
  Logger,
} from '@nestjs/common';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { CacheService } from '../../shared/cache/cache.service';
import { Reflector } from '@nestjs/core';

export interface CacheOptions {
  ttl?: number;
  key?: string;
  condition?: (context: ExecutionContext) => boolean;
}

@Injectable()
export class CacheInterceptor implements NestInterceptor {
  private readonly logger = new Logger(CacheInterceptor.name);

  constructor(
    private readonly cacheService: CacheService,
    private readonly reflector: Reflector,
  ) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    // التحقق من وجود decorator @Cache
    const cacheOptions = this.reflector.get<CacheOptions>(
      'cache',
      context.getHandler(),
    );

    if (!cacheOptions) {
      return next.handle();
    }

    // التحقق من شرط الكاش (إن وجد)
    if (cacheOptions.condition && !cacheOptions.condition(context)) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest();
    const cacheKey = this.generateCacheKey(request, cacheOptions.key);

    try {
      // محاولة الحصول على البيانات من الكاش
      const cachedData = await this.cacheService.get(cacheKey);
      if (cachedData !== null) {
        this.logger.debug(`تم استرجاع البيانات من الكاش: ${cacheKey}`);
        return of(cachedData);
      }
    } catch (error) {
      this.logger.error(`فشل في استرجاع البيانات من الكاش: ${cacheKey}`, error);
    }

    // تنفيذ الطلب وحفظ النتيجة في الكاش
    return next.handle().pipe(
      tap((data) => {
        // حفظ البيانات في الكاش في الخلفية
        if (data !== undefined && data !== null) {
          this.setCacheData(cacheKey, data, cacheOptions.ttl).catch((error) => {
            this.logger.error(
              `فشل في حفظ البيانات في الكاش: ${cacheKey}`,
              error,
            );
          });
        }
      }),
    );
  }

  private async setCacheData(
    cacheKey: string,
    data: any,
    ttl?: number,
  ): Promise<void> {
    try {
      await this.cacheService.set(cacheKey, data, { ttl });
      this.logger.debug(`تم حفظ البيانات في الكاش: ${cacheKey}`);
    } catch (error) {
      this.logger.error(`فشل في حفظ البيانات في الكاش: ${cacheKey}`, error);
    }
  }

  private generateCacheKey(
    request: Record<string, any>,
    customKey?: string,
  ): string {
    if (customKey) {
      return `http:${customKey}`;
    }

    // توليد مفتاح تلقائي بناءً على الطلب
    const { method, url, user, query, params, body } = request as {
      method: string;
      url: string;
      user?: { id: string };
      query?: Record<string, any>;
      params?: Record<string, any>;
      body?: Record<string, any>;
    };
    const userId = user?.id || 'anonymous';
    const queryString = this.serializeObject(query);
    const paramsString = this.serializeObject(params);
    const bodyString = this.getBodyFingerprint(body);

    return `http:${method}:${url}:${userId}:${queryString}:${paramsString}:${bodyString}`;
  }

  private serializeObject(obj: Record<string, any> | undefined | null): string {
    if (!obj || typeof obj !== 'object') return '';

    // ترتيب المفاتيح لضمان نفس المفتاح لنفس البيانات
    const sortedKeys = Object.keys(obj).sort();
    const sortedObj: Record<string, any> = {};

    for (const key of sortedKeys) {
      sortedObj[key] = obj[key];
    }

    return JSON.stringify(sortedObj);
  }

  private getBodyFingerprint(
    body: Record<string, any> | undefined | null,
  ): string {
    if (!body || typeof body !== 'object') return '';

    // تجاهل الحقول الحساسة مثل كلمات المرور
    const safeBody = { ...body };
    delete safeBody.password;
    delete safeBody.passwordHash;
    delete safeBody.token;
    delete safeBody.refreshToken;

    return this.serializeObject(safeBody);
  }
}
