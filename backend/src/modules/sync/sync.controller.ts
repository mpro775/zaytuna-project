import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Request,
} from '@nestjs/common';
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

  @Get('initial-data')
  @Permissions('sync.read')
  initialData(@Request() req: any) {
    return this.syncService.initialData(req.user.id);
  }

  @Get('pull')
  @Permissions('sync.read')
  pull(@Query('since') since?: string) {
    return this.syncService.pull(since);
  }

  @Post('push')
  @Permissions('sync.push')
  push(@Body() body: any, @Request() req: any) {
    return this.syncService.push(body, req.user.id);
  }

  @Get('batches/:id')
  @Permissions('sync.read')
  getBatch(@Param('id') id: string) {
    return this.syncService.getBatch(id);
  }
}
