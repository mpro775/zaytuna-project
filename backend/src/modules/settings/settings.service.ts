import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../shared/database/prisma.service';

const SETTINGS_TYPES = [
  'company',
  'system',
  'security',
  'backup',
  'notifications',
  'sync',
] as const;
type SettingsType = (typeof SETTINGS_TYPES)[number];

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async get(type: SettingsType) {
    this.assertType(type);

    const settings = await this.prisma.appSetting.findMany({
      where: { scope: 'global', key: { startsWith: `${type}.` } },
      orderBy: { key: 'asc' },
    });

    const data = Object.fromEntries(
      settings.map((setting) => [
        setting.key.slice(type.length + 1),
        setting.value,
      ]),
    );

    if (type === 'company') {
      const company = await this.prisma.company.findFirst({
        orderBy: { createdAt: 'asc' },
      });
      return { ...data, company };
    }

    return data;
  }

  async update(type: SettingsType, payload: Record<string, unknown>) {
    this.assertType(type);
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
      throw new BadRequestException('Settings payload must be an object');
    }

    if (type === 'company') {
      await this.updateCompany(payload);
    }

    await Promise.all(
      Object.entries(payload).map(([key, value]) => {
        const jsonValue = value as Prisma.InputJsonValue;
        return this.prisma.appSetting.upsert({
          where: {
            scope_scopeId_key: {
              scope: 'global',
              scopeId: '',
              key: `${type}.${key}`,
            },
          },
          update: { value: jsonValue },
          create: {
            scope: 'global',
            scopeId: '',
            key: `${type}.${key}`,
            value: jsonValue,
          },
        });
      }),
    );

    return this.get(type);
  }

  validate(type: SettingsType, payload: Record<string, unknown>) {
    this.assertType(type);
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
      throw new BadRequestException('Settings payload must be an object');
    }
    return { valid: true, type };
  }

  async reset(type: SettingsType) {
    this.assertType(type);
    await this.prisma.appSetting.deleteMany({
      where: { scope: 'global', key: { startsWith: `${type}.` } },
    });
    return this.get(type);
  }

  systemInfo() {
    return {
      app: 'Zaytun Soft POS',
      nodeEnv: process.env.NODE_ENV ?? 'development',
      version: process.env.npm_package_version ?? '0.0.1',
      timestamp: new Date(),
    };
  }

  clearCache() {
    return { cleared: true, clearedAt: new Date() };
  }

  async updateCompanyLogo(fileId?: string) {
    if (!fileId) throw new BadRequestException('fileId is required');
    await this.prisma.file.findUniqueOrThrow({ where: { id: fileId } });
    await this.update('company', { logoFileId: fileId });
    return this.get('company');
  }

  private async updateCompany(payload: Record<string, unknown>) {
    const data: Record<string, string> = {};
    for (const key of ['name', 'email', 'phone', 'address', 'taxNumber']) {
      if (typeof payload[key] === 'string') data[key] = payload[key];
    }
    if (Object.keys(data).length === 0) return;

    const company = await this.prisma.company.findFirst({
      orderBy: { createdAt: 'asc' },
    });
    if (company) {
      await this.prisma.company.update({ where: { id: company.id }, data });
    } else if (data.name) {
      await this.prisma.company.create({
        data: { id: 'company_main', name: data.name, ...data },
      });
    }
  }

  private assertType(type: string): asserts type is SettingsType {
    if (!SETTINGS_TYPES.includes(type as SettingsType)) {
      throw new BadRequestException(`Unsupported settings type: ${type}`);
    }
  }
}
