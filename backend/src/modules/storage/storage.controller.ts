import { Controller, Delete, Get, Param, Post, Query, UploadedFile, UseInterceptors, Body } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { StorageService } from './storage.service';

@Controller('storage')
export class StorageController {
  constructor(private readonly storageService: StorageService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  @Permissions('storage.upload')
  upload(@UploadedFile() file: any, @Body() body: any, @Query('userId') userId?: string) {
    return this.storageService.recordUpload(file, body, userId);
  }

  @Get('files/:id')
  @Permissions('storage.read')
  get(@Param('id') id: string) {
    return this.storageService.getFile(id);
  }

  @Delete('files/:id')
  @Permissions('storage.delete')
  delete(@Param('id') id: string) {
    return this.storageService.deleteFile(id);
  }
}
