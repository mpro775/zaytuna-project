import {
  Body,
  Controller,
  Delete,
  Get,
  Patch,
  Param,
  Post,
  Query,
} from '@nestjs/common';
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

  @Get('unread-count')
  @Permissions('notifications.read')
  unreadCount(@Query('userId') userId?: string) {
    return this.notificationService.unreadCount(userId);
  }

  @Post('send')
  @Permissions('notifications.create')
  send(@Body() body: any) {
    return this.notificationService.create(body);
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

  @Delete(':id')
  @Permissions('notifications.delete')
  delete(@Param('id') id: string) {
    return this.notificationService.delete(id);
  }

  @Get('preferences')
  @Permissions('notifications.read')
  getPreferences(@Query('userId') userId: string) {
    return this.notificationService.getPreferences(userId);
  }

  @Patch('preferences')
  @Permissions('notifications.update')
  updatePreferences(@Query('userId') userId: string, @Body() body: any) {
    return this.notificationService.updatePreferences(
      userId,
      body.preferences ?? body,
    );
  }
}
