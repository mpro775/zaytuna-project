import { Module } from '@nestjs/common';
import { WarehouseService } from './warehouse.service';
import { WarehouseController } from './warehouse.controller';
import { PrismaService } from '../../shared/database/prisma.service';
import { CacheService } from '../../shared/cache/cache.service';

@Module({
  controllers: [WarehouseController],
  providers: [WarehouseService, PrismaService, CacheService],
  exports: [WarehouseService],
})
export class WarehouseModule {}
