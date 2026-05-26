import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../shared/database/prisma.service';

@Injectable()
export class SyncService {
  constructor(private readonly prisma: PrismaService) {}

  async registerDevice(body: any, userId: string) {
    return this.prisma.syncDevice.upsert({
      where: { deviceId: body.deviceId },
      update: {
        name: body.name ?? body.deviceName,
        platform: body.platform ?? body.deviceType,
        userId,
        lastSeenAt: new Date(),
        isActive: true,
      },
      create: {
        deviceId: body.deviceId,
        name: body.name ?? body.deviceName,
        platform: body.platform ?? body.deviceType,
        userId,
        lastSeenAt: new Date(),
      },
    });
  }

  async status(deviceId?: string) {
    const activeDevices = await this.prisma.syncDevice.count({ where: { isActive: true } });
    const pendingOperations = await this.prisma.syncOperation.count({ where: { status: 'pending' } });
    const device = deviceId
      ? await this.prisma.syncDevice.findUnique({ where: { deviceId } })
      : undefined;
    if (deviceId && !device) throw new NotFoundException('Sync device not found');
    return { activeDevices, pendingOperations, device };
  }
}
