import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { SettingsService } from './settings.service';

@Controller('settings')
@Permissions('settings.read')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get(':type')
  get(@Param('type') type: string) {
    return this.settingsService.get(type as any);
  }

  @Patch(':type')
  @Permissions('settings.update')
  update(@Param('type') type: string, @Body() body: Record<string, unknown>) {
    return this.settingsService.update(type as any, body);
  }

  @Post('validate/:type')
  @Permissions('settings.validate')
  validate(@Param('type') type: string, @Body() body: Record<string, unknown>) {
    return this.settingsService.validate(type as any, body);
  }

  @Post('reset/:type')
  @Permissions('settings.reset')
  reset(@Param('type') type: string) {
    return this.settingsService.reset(type as any);
  }
}
