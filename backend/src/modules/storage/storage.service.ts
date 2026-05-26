import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../shared/database/prisma.service';

@Injectable()
export class StorageService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  async recordUpload(file: any, body: any, userId?: string) {
    const provider = this.configService.get<string>('app.storage.type') ?? 'local';
    return this.prisma.file.create({
      data: {
        originalName: file.originalname,
        filename: file.filename,
        mimeType: file.mimetype,
        size: BigInt(file.size),
        extension: file.originalname.includes('.') ? file.originalname.split('.').pop() ?? '' : '',
        path: file.path,
        key: file.filename,
        bucket: body.bucket ?? 'default',
        storageProvider: provider,
        category: body.category ?? 'document',
        entityType: body.entityType,
        entityId: body.entityId,
        isPublic: body.isPublic === true || body.isPublic === 'true',
        uploadedBy: userId,
      } as any,
    });
  }

  async getFile(id: string) {
    const file = await this.prisma.file.findUnique({ where: { id } });
    if (!file) throw new NotFoundException('File not found');
    return file;
  }

  async deleteFile(id: string) {
    await this.getFile(id);
    await this.prisma.file.delete({ where: { id } });
    return { id, deleted: true };
  }
}
