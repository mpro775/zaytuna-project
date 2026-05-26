import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../shared/database/prisma.service';
import { SalesService } from '../sales/sales.service';

@Injectable()
export class SyncService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly salesService: SalesService,
  ) {}

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
    const activeDevices = await this.prisma.syncDevice.count({
      where: { isActive: true },
    });
    const pendingOperations = await this.prisma.syncOperation.count({
      where: { status: 'pending' },
    });
    const device = deviceId
      ? await this.prisma.syncDevice.findUnique({ where: { deviceId } })
      : undefined;
    if (deviceId && !device)
      throw new NotFoundException('Sync device not found');
    return { activeDevices, pendingOperations, device };
  }

  async initialData(userId: string) {
    const [
      company,
      settings,
      currencies,
      exchangeRates,
      branches,
      warehouses,
      categories,
      products,
      stockItems,
      customers,
      user,
    ] = await Promise.all([
      this.prisma.company.findFirst(),
      this.prisma.appSetting.findMany(),
      this.prisma.currency.findMany({ where: { isActive: true } }),
      this.prisma.exchangeRate.findMany({
        orderBy: { effectiveAt: 'desc' },
        take: 100,
      }),
      this.prisma.branch.findMany({ where: { isActive: true } }),
      this.prisma.warehouse.findMany({ where: { isActive: true } }),
      this.prisma.category.findMany({ where: { isActive: true } }),
      this.prisma.product.findMany({
        where: { isActive: true },
        include: { variants: true },
      }),
      this.prisma.stockItem.findMany(),
      this.prisma.customer.findMany({ where: { isActive: true } }),
      this.prisma.user.findUnique({
        where: { id: userId },
        include: { role: true },
      }),
    ]);

    return {
      company,
      settings,
      currencies,
      exchangeRates,
      branches,
      warehouses,
      categories,
      products,
      stockItems,
      customers,
      permissions: user?.role?.permissions ?? [],
    };
  }

  async pull(since?: string) {
    const createdAt = since ? { gt: new Date(since) } : undefined;
    const [products, customers, stockItems, salesInvoices] = await Promise.all([
      this.prisma.product.findMany({
        where: { updatedAt: createdAt },
        include: { variants: true },
      }),
      this.prisma.customer.findMany({ where: { updatedAt: createdAt } }),
      this.prisma.stockItem.findMany({ where: { updatedAt: createdAt } }),
      this.prisma.salesInvoice.findMany({
        where: { updatedAt: createdAt },
        include: { lines: true, payments: true },
      }),
    ]);
    return {
      products,
      customers,
      stockItems,
      salesInvoices,
      pulledAt: new Date(),
    };
  }

  async push(body: any, userId: string) {
    const device = await this.prisma.syncDevice.findUnique({
      where: { deviceId: body.deviceId },
    });
    if (!device) throw new NotFoundException('Sync device not found');

    const idempotencyKey = `${body.deviceId}:${body.idempotencyKey}`;
    const existing = await this.prisma.syncOperation.findUnique({
      where: { idempotencyKey },
    });
    if (existing) {
      return {
        batchId: existing.entityId,
        status: existing.status,
        idempotent: true,
        result: existing.payload,
      };
    }

    const batch = await this.prisma.syncBatch.create({
      data: {
        batchId: `sync_${Date.now()}_${Math.random().toString(16).slice(2)}`,
        deviceId: body.deviceId,
        syncType: 'changes_only',
        direction: 'upload',
        status: 'processing',
        totalRecords: body.operations?.length ?? 0,
        changes: body.operations ?? [],
        createdBy: userId,
        startedAt: new Date(),
      },
    });

    const results: any[] = [];
    let failedRecords = 0;

    for (const operation of body.operations ?? []) {
      try {
        if (operation.type !== 'POS_SALE') {
          throw new Error(`Unsupported sync operation: ${operation.type}`);
        }
        const sale = await this.salesService.create(
          {
            ...operation.payload,
            status: operation.payload.status ?? 'confirmed',
          },
          userId,
        );
        results.push({
          localId: operation.localId,
          status: 'processed',
          saleId: sale.id,
        });
      } catch (error) {
        failedRecords += 1;
        results.push({
          localId: operation.localId,
          status: 'rejected',
          reason: error.message,
        });
      }
    }

    const status =
      failedRecords === 0
        ? 'completed'
        : failedRecords === results.length
          ? 'failed'
          : 'conflicted';
    const updatedBatch = await this.prisma.syncBatch.update({
      where: { id: batch.id },
      data: {
        status,
        processedRecords: results.length - failedRecords,
        failedRecords,
        resolution: results,
        completedAt: new Date(),
        lastSyncAt: new Date(),
      },
    });

    await this.prisma.syncOperation.create({
      data: {
        deviceId: body.deviceId,
        userId,
        entityType: 'sync_batch',
        entityId: updatedBatch.batchId,
        operation: 'push',
        payload: { results },
        idempotencyKey,
        status: failedRecords === 0 ? 'processed' : 'failed',
        appliedAt: new Date(),
      },
    });

    return { batch: updatedBatch, results };
  }

  async getBatch(batchId: string) {
    const batch = await this.prisma.syncBatch.findFirst({
      where: { OR: [{ id: batchId }, { batchId }] },
    });
    if (!batch) throw new NotFoundException('Sync batch not found');
    return batch;
  }
}
