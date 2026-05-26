import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { unlink } from 'fs/promises';
import { PrismaService } from '../../shared/database/prisma.service';
import { S3Provider } from './providers/s3.provider';

@Injectable()
export class StorageService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly s3Provider: S3Provider,
  ) {}

  async recordUpload(file: any, body: any, userId?: string) {
    if (!file) throw new BadRequestException('File is required');

    const provider = this.getProvider();
    const maxFileSize =
      Number(this.configService.get<string>('STORAGE_MAX_FILE_SIZE_MB') ?? 5) *
      1024 *
      1024;
    if (file.size > maxFileSize) {
      throw new BadRequestException(
        `File exceeds maximum size of ${maxFileSize} bytes`,
      );
    }

    const key = this.buildStorageKey(file, body);
    let path = file.path;
    let url: string | undefined;
    let bucket = body.bucket ?? 'default';

    if (provider === 's3' || provider === 'r2') {
      const uploaded = await this.s3Provider.uploadFile(file.path, key, {
        contentType: file.mimetype,
        metadata: {
          originalName: file.originalname,
          category: body.category ?? 'document',
        },
      });
      path = uploaded.key;
      url = uploaded.url ?? uploaded.signedUrl;
      bucket = uploaded.bucket;
      await unlink(file.path).catch(() => undefined);
    }

    const saved = await this.prisma.file.create({
      data: {
        originalName: file.originalname,
        filename: file.filename,
        mimeType: file.mimetype,
        size: BigInt(file.size),
        extension: file.originalname.includes('.')
          ? (file.originalname.split('.').pop() ?? '')
          : '',
        path,
        key,
        url,
        bucket,
        storageProvider: provider,
        category: body.category ?? 'document',
        entityType: body.entityType,
        entityId: body.entityId,
        isPublic: body.isPublic === true || body.isPublic === 'true',
        uploadedBy: userId,
      } as any,
    });

    if (body.entityType === 'product' && body.entityId) {
      await this.prisma.product.update({
        where: { id: body.entityId },
        data: { imageUrl: await this.resolveFileUrl(saved as any) },
      });
    }

    return saved;
  }

  listFiles(query: any = {}) {
    return this.prisma.file.findMany({
      where: {
        category: query.category,
        entityType: query.entityType,
        entityId: query.entityId,
      },
      orderBy: { createdAt: 'desc' },
      take: Number(query.limit ?? 100),
    });
  }

  async getFile(id: string) {
    const file = await this.prisma.file.findUnique({ where: { id } });
    if (!file) throw new NotFoundException('File not found');
    return file;
  }

  async deleteFile(id: string) {
    const file = await this.getFile(id);
    if (file.storageProvider === 's3' || file.storageProvider === 'r2') {
      await this.s3Provider.deleteFile(file.key);
    } else if (file.path) {
      await unlink(file.path).catch(() => undefined);
    }
    await this.prisma.file.delete({ where: { id } });
    return { id, deleted: true };
  }

  async getFileUrl(id: string) {
    const file = await this.getFile(id);
    return { id: file.id, url: await this.resolveFileUrl(file as any) };
  }

  async attachProductImage(productId: string, file: any, userId?: string) {
    await this.prisma.product.findUniqueOrThrow({ where: { id: productId } });
    return this.recordUpload(
      file,
      {
        category: 'image',
        entityType: 'product',
        entityId: productId,
      },
      userId,
    );
  }

  async listProductImages(productId: string) {
    return this.listFiles({
      entityType: 'product',
      entityId: productId,
      category: 'image',
    });
  }

  private async resolveFileUrl(file: {
    storageProvider: string;
    key: string;
    url?: string | null;
    path?: string | null;
  }) {
    if (file.storageProvider === 's3' || file.storageProvider === 'r2') {
      return file.url ?? this.s3Provider.generateSignedUrl(file.key);
    }
    return file.path;
  }

  private getProvider() {
    return (
      this.configService.get<string>('STORAGE_PROVIDER') ??
      this.configService.get<string>('app.storage.type') ??
      'local'
    );
  }

  private buildStorageKey(file: any, body: any) {
    const extension = file.originalname.includes('.')
      ? file.originalname.split('.').pop()
      : 'bin';
    const prefix = [
      body.category ?? 'documents',
      body.entityType,
      body.entityId,
    ]
      .filter(Boolean)
      .join('/');
    return `${prefix || 'uploads'}/${Date.now()}-${file.filename}.${extension}`;
  }
}
