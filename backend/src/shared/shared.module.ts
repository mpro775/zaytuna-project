import { Module } from '@nestjs/common';
import { PrismaModule } from './database/prisma.module';
import { CacheModule } from './cache/cache.module';

@Module({
  imports: [PrismaModule, CacheModule],
  exports: [PrismaModule, CacheModule],
})
export class SharedModule {}
