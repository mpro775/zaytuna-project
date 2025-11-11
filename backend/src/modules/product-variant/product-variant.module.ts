import { Module } from '@nestjs/common';
import { ProductVariantService } from './product-variant.service';
import { ProductVariantController } from './product-variant.controller';
import { PrismaService } from '../../shared/database/prisma.service';
import { CacheService } from '../../shared/cache/cache.service';

@Module({
  controllers: [ProductVariantController],
  providers: [ProductVariantService, PrismaService, CacheService],
  exports: [ProductVariantService],
})
export class ProductVariantModule {}
