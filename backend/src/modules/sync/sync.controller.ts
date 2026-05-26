import { Body, Controller, Get, Post, Query, Request } from '@nestjs/common';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { SyncService } from './sync.service';

@Controller('sync')
export class SyncController {
  constructor(private readonly syncService: SyncService) {}

  @Post('devices/register')
  @Permissions('sync.devices')
  registerDevice(@Body() body: any, @Request() req: any) {
    return this.syncService.registerDevice(body, req.user.id);
  }

  @Get('status')
  @Permissions('sync.read')
  status(@Query('deviceId') deviceId?: string) {
    return this.syncService.status(deviceId);
  }
}
