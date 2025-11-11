import { Global, Module } from '@nestjs/common';
import { CacheService } from './cache.service';
import { SessionService } from './session.service';
import { redisProviders } from './cache.providers';

@Global()
@Module({
  providers: [...redisProviders, CacheService, SessionService],
  exports: [CacheService, SessionService],
})
export class CacheModule {}
