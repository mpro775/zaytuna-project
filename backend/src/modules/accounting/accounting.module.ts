import { Module } from '@nestjs/common';
import { AccountingService } from './accounting.service';
import { AccountingController } from './accounting.controller';
import { PrismaService } from '../../shared/database/prisma.service';
import { CacheService } from '../../shared/cache/cache.service';

@Module({
  controllers: [AccountingController],
  providers: [AccountingService, PrismaService, CacheService],
  exports: [AccountingService],
})
export class AccountingModule {}
