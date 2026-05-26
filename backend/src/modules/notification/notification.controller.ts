import { Controller, Get, Patch, Param, Query } from '@nestjs/common';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { NotificationService } from './notification.service';

@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  @Permissions('notifications.read')
  list(@Query('userId') userId?: string) {
    return this.notificationService.list(userId);
  }

  @Patch(':id/read')
  @Permissions('notifications.update')
  markRead(@Param('id') id: string) {
    return this.notificationService.markRead(id);
  }

  @Patch('read-all')
  @Permissions('notifications.update')
  markAllRead(@Query('userId') userId?: string) {
    return this.notificationService.markAllRead(userId);
  }
}
