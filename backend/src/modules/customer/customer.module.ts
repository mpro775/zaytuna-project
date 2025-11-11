import { Module } from '@nestjs/common';
import { CustomerService } from './customer.service';
import { CustomerController } from './customer.controller';
import { PrismaService } from '../../shared/database/prisma.service';
import { CacheService } from '../../shared/cache/cache.service';

@Module({
  controllers: [CustomerController],
  providers: [CustomerService, PrismaService, CacheService],
  exports: [CustomerService],
})
export class CustomerModule {}
