import { Module, forwardRef } from '@nestjs/common';
import { SyncService } from './sync.service';
import { SyncController } from './sync.controller';
import { SyncGateway } from './sync.gateway';
import { OfflineService } from './offline.service';
import { PrismaService } from '../../shared/database/prisma.service';
import { CacheService } from '../../shared/cache/cache.service';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [forwardRef(() => AuditModule)],
  controllers: [SyncController],
  providers: [SyncService, SyncGateway, OfflineService, PrismaService, CacheService],
  exports: [SyncService, SyncGateway, OfflineService],
})
export class SyncModule {}
