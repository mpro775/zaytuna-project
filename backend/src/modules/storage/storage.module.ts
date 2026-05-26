import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { StorageController } from './storage.controller';
import { StorageService } from './storage.service';
import { S3Provider } from './providers/s3.provider';

@Module({
  imports: [
    MulterModule.register({
      dest: process.env.LOCAL_STORAGE_PATH || './uploads',
    }),
  ],
  controllers: [StorageController],
  providers: [StorageService, S3Provider],
  exports: [StorageService, S3Provider],
})
export class StorageModule {}
