import { Module, forwardRef } from '@nestjs/common';
import { SyncService } from './sync.service';
import { SyncController } from './sync.controller';
import { OfflineService } from './offline.service';
import { PrismaService } from '../../shared/database/prisma.service';
import { CacheService } from '../../shared/cache/cache.service';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [forwardRef(() => AuditModule)],
  controllers: [SyncController],
  providers: [SyncService, OfflineService, PrismaService, CacheService],
  exports: [SyncService, OfflineService],
})
export class SyncModule {}
