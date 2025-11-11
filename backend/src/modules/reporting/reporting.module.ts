import { Module } from '@nestjs/common';
import { ReportingService } from './reporting.service';
import { ReportingController } from './reporting.controller';
import { PrismaService } from '../../shared/database/prisma.service';
import { CacheService } from '../../shared/cache/cache.service';

@Module({
  controllers: [ReportingController],
  providers: [ReportingService, PrismaService, CacheService],
  exports: [ReportingService],
})
export class ReportingModule {}
