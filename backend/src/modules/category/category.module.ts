import { Module } from '@nestjs/common';
import { CategoryService } from './category.service';
import { CategoryController } from './category.controller';
import { PrismaService } from '../../shared/database/prisma.service';
import { CacheService } from '../../shared/cache/cache.service';

@Module({
  controllers: [CategoryController],
  providers: [CategoryService, PrismaService, CacheService],
  exports: [CategoryService],
})
export class CategoryModule {}
