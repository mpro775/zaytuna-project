import { Module } from '@nestjs/common';
import { ProductService } from './product.service';
import { ProductController } from './product.controller';
import { PrismaService } from '../../shared/database/prisma.service';
import { CacheService } from '../../shared/cache/cache.service';

@Module({
  controllers: [ProductController],
  providers: [ProductService, PrismaService, CacheService],
  exports: [ProductService],
})
export class ProductModule {}
