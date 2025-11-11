import { Module } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { InventoryController } from './inventory.controller';
import { PrismaService } from '../../shared/database/prisma.service';
import { CacheService } from '../../shared/cache/cache.service';

@Module({
  controllers: [InventoryController],
  providers: [InventoryService, PrismaService, CacheService],
  exports: [InventoryService],
})
export class InventoryModule {}
