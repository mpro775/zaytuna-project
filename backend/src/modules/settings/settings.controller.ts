import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { SettingsService } from './settings.service';
import { BackupService } from '../backup/backup.service';

@Controller('settings')
@Permissions('settings.read')
export class SettingsController {
  constructor(
    private readonly settingsService: SettingsService,
    private readonly backupService: BackupService,
  ) {}

  @Get('system/info')
  systemInfo() {
    return this.settingsService.systemInfo();
  }

  @Post('system/clear-cache')
  @Permissions('settings.update')
  clearCache() {
    return this.settingsService.clearCache();
  }

  @Post('company/logo')
  @Permissions('settings.update')
  updateLogo(@Body() body: { fileId?: string; logoFileId?: string }) {
    return this.settingsService.updateCompanyLogo(
      body.fileId ?? body.logoFileId,
    );
  }

  @Get('backup/history')
  getBackupHistory() {
    return this.backupService.getBackupList();
  }

  @Post('backup/manual')
  @Permissions('settings.update')
  createBackup() {
    return this.backupService.createManualBackup();
  }

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
