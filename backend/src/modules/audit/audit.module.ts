import { Module } from '@nestjs/common';
import { AuditService } from './audit.service';
import { AuditController } from './audit.controller';
import { PrismaService } from '../../shared/database/prisma.service';
import { CacheService } from '../../shared/cache/cache.service';

@Module({
  controllers: [AuditController],
  providers: [AuditService, PrismaService, CacheService],
  exports: [AuditService],
})
export class AuditModule {}
