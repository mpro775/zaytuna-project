import { Module } from '@nestjs/common';
import { BranchService } from './branch.service';
import { BranchController } from './branch.controller';
import { PrismaService } from '../../shared/database/prisma.service';
import { CacheService } from '../../shared/cache/cache.service';

@Module({
  controllers: [BranchController],
  providers: [BranchService, PrismaService, CacheService],
  exports: [BranchService],
})
export class BranchModule {}
