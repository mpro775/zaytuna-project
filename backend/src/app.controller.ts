import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { AppService } from './app.service';
import { Cache, InvalidateCache } from './common/decorators/cache.decorator';
import { Public, Permissions, RequireRead } from './common/decorators/permissions.decorator';
import { PaginationQueryDto } from './common/dto/pagination.dto';
import { HealthCheckResponseDto } from './common/dto/response.dto';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @Public() // متاح للجميع بدون مصادقة
  @Cache({ ttl: 300 }) // كاش لمدة 5 دقائق
  getHello(): { message: string } {
    return this.appService.getHello();
  }

  @Get('health')
  @Public() // متاح للجميع بدون مصادقة
  @Cache({ ttl: 60 }) // كاش لمدة دقيقة واحدة
  getHealth(): HealthCheckResponseDto {
    return {
      success: true,
      data: {
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: '1.0.0',
        services: {
          database: true, // يمكن إضافة فحص حقيقي لاحقاً
          redis: true,    // يمكن إضافة فحص حقيقي لاحقاً
        },
      },
    };
  }

  @Get('test-pagination')
  @RequireRead() // يتطلب صلاحية القراءة
  @Cache({ ttl: 120 }) // كاش لمدة 2 دقائق
  getTestPagination(@Query() query: PaginationQueryDto) {
    // محاكاة بيانات مع pagination
    const items = Array.from({ length: 100 }, (_, i) => ({
      id: i + 1,
      name: `Item ${i + 1}`,
      description: `Description for item ${i + 1}`,
    }));

    const { page = 1, limit = 20 } = query;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedItems = items.slice(startIndex, endIndex);

    return {
      data: paginatedItems,
      pagination: {
        page,
        limit,
        total: items.length,
        totalPages: Math.ceil(items.length / limit),
      },
    };
  }

  @Post('test-invalidation')
  @Permissions('create') // يتطلب صلاحية الإنشاء
  @InvalidateCache('test:*') // إبطال جميع مفاتيح test
  createTestItem(@Body() body: { name: string; value: any }) {
    return {
      id: Date.now(),
      ...body,
      createdAt: new Date(),
    };
  }

  @Get('test-error')
  @Public() // متاح للجميع
  testError() {
    throw new Error('This is a test error');
  }
}
