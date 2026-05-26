import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  CopyObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { createReadStream } from 'fs';
import { stat } from 'fs/promises';

export interface S3Config {
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
  bucketName: string;
  endpoint?: string;
  publicRead?: boolean;
  signedUrlExpiry?: number;
  maxFileSize?: number;
  publicBaseUrl?: string;
}

export interface S3UploadResult {
  success: boolean;
  key: string;
  url?: string;
  signedUrl?: string;
  bucket: string;
  size: number;
  etag?: string;
  error?: string;
}

export interface S3DownloadResult {
  success: boolean;
  stream?: NodeJS.ReadableStream;
  contentType?: string;
  contentLength?: number;
  lastModified?: Date;
  error?: string;
}

@Injectable()
export class S3Provider {
  private readonly logger = new Logger(S3Provider.name);
  private readonly config: S3Config;
  private readonly s3Client: S3Client;

  constructor(private readonly configService: ConfigService) {
    this.config = this.loadConfig();
    this.s3Client = new S3Client({
      region: this.config.region,
      credentials: {
        accessKeyId: this.config.accessKeyId,
        secretAccessKey: this.config.secretAccessKey,
      },
      endpoint: this.config.endpoint,
      forcePathStyle: Boolean(this.config.endpoint),
    });
  }

  async uploadFile(
    filePath: string,
    key: string,
    options: {
      contentType?: string;
      metadata?: Record<string, string>;
      acl?: 'private' | 'public-read';
      storageClass?:
        | 'STANDARD'
        | 'REDUCED_REDUNDANCY'
        | 'STANDARD_IA'
        | 'ONEZONE_IA'
        | 'INTELLIGENT_TIERING';
    } = {},
  ): Promise<S3UploadResult> {
    this.assertConfigured();
    const stats = await stat(filePath);
    if (this.config.maxFileSize && stats.size > this.config.maxFileSize) {
      throw new BadRequestException(
        `File is larger than ${this.config.maxFileSize} bytes`,
      );
    }

    const result = await this.s3Client.send(
      new PutObjectCommand({
        Bucket: this.config.bucketName,
        Key: key,
        Body: createReadStream(filePath),
        ContentType: options.contentType,
        Metadata: options.metadata,
        ACL:
          options.acl ?? (this.config.publicRead ? 'public-read' : 'private'),
        StorageClass: options.storageClass ?? 'STANDARD',
      }),
    );

    return {
      success: true,
      key,
      url: this.config.publicRead ? this.publicUrl(key) : undefined,
      signedUrl: this.config.publicRead
        ? undefined
        : await this.generateSignedUrl(key),
      bucket: this.config.bucketName,
      size: stats.size,
      etag: result.ETag,
    };
  }

  async downloadFile(key: string): Promise<S3DownloadResult> {
    this.assertConfigured();
    const result = await this.s3Client.send(
      new GetObjectCommand({ Bucket: this.config.bucketName, Key: key }),
    );
    return {
      success: true,
      stream: result.Body as NodeJS.ReadableStream,
      contentType: result.ContentType,
      contentLength: result.ContentLength,
      lastModified: result.LastModified,
    };
  }

  async deleteFile(key: string): Promise<{ success: boolean; error?: string }> {
    this.assertConfigured();
    await this.s3Client.send(
      new DeleteObjectCommand({ Bucket: this.config.bucketName, Key: key }),
    );
    return { success: true };
  }

  async fileExists(key: string): Promise<boolean> {
    try {
      this.assertConfigured();
      await this.s3Client.send(
        new HeadObjectCommand({ Bucket: this.config.bucketName, Key: key }),
      );
      return true;
    } catch (error) {
      this.logger.debug(`S3 object not found: ${key}`);
      return false;
    }
  }

  async getFileInfo(key: string): Promise<{
    size?: number;
    lastModified?: Date;
    contentType?: string;
    etag?: string;
    metadata?: Record<string, string>;
  } | null> {
    try {
      this.assertConfigured();
      const result = await this.s3Client.send(
        new HeadObjectCommand({ Bucket: this.config.bucketName, Key: key }),
      );
      return {
        size: result.ContentLength,
        lastModified: result.LastModified,
        contentType: result.ContentType,
        etag: result.ETag,
        metadata: result.Metadata,
      };
    } catch (error) {
      return null;
    }
  }

  async generateSignedUrl(
    key: string,
    expiresIn = this.config.signedUrlExpiry ?? 3600,
  ): Promise<string> {
    this.assertConfigured();
    return getSignedUrl(
      this.s3Client,
      new GetObjectCommand({ Bucket: this.config.bucketName, Key: key }),
      { expiresIn },
    );
  }

  async copyFile(
    sourceKey: string,
    destinationKey: string,
  ): Promise<{ success: boolean; error?: string }> {
    this.assertConfigured();
    await this.s3Client.send(
      new CopyObjectCommand({
        Bucket: this.config.bucketName,
        CopySource: `${this.config.bucketName}/${sourceKey}`,
        Key: destinationKey,
      }),
    );
    return { success: true };
  }

  async moveFile(
    sourceKey: string,
    destinationKey: string,
  ): Promise<{ success: boolean; error?: string }> {
    await this.copyFile(sourceKey, destinationKey);
    return this.deleteFile(sourceKey);
  }

  async listFiles(
    prefix?: string,
    maxKeys = 1000,
  ): Promise<{
    files: Array<{
      key: string;
      size: number;
      lastModified: Date;
      etag: string;
    }>;
    isTruncated: boolean;
    nextContinuationToken?: string;
  }> {
    this.assertConfigured();
    const result = await this.s3Client.send(
      new ListObjectsV2Command({
        Bucket: this.config.bucketName,
        Prefix: prefix,
        MaxKeys: maxKeys,
      }),
    );
    return {
      files: (result.Contents ?? []).map((object) => ({
        key: object.Key ?? '',
        size: object.Size ?? 0,
        lastModified: object.LastModified ?? new Date(0),
        etag: object.ETag ?? '',
      })),
      isTruncated: result.IsTruncated ?? false,
      nextContinuationToken: result.NextContinuationToken,
    };
  }

  async getBucketStats(): Promise<{
    totalFiles: number;
    totalSize: number;
    lastActivity?: Date;
  }> {
    const listed = await this.listFiles(undefined, 1000);
    return {
      totalFiles: listed.files.length,
      totalSize: listed.files.reduce((sum, file) => sum + file.size, 0),
      lastActivity: listed.files
        .map((file) => file.lastModified)
        .sort((a, b) => b.getTime() - a.getTime())[0],
    };
  }

  async cleanupExpiredFiles(): Promise<number> {
    return 0;
  }

  validateConfig(): boolean {
    return Boolean(
      this.config.accessKeyId &&
        this.config.secretAccessKey &&
        this.config.bucketName,
    );
  }

  getProviderInfo() {
    return {
      name: this.config.endpoint ? 'S3-compatible storage' : 'Amazon S3',
      type: 's3' as const,
      region: this.config.region,
      bucket: this.config.bucketName,
      endpoint: this.config.endpoint,
      supportsSignedUrls: true,
      supportsLifecycle: true,
      maxFileSize: this.config.maxFileSize ?? 5 * 1024 * 1024 * 1024,
    };
  }

  private loadConfig(): S3Config {
    const provider =
      this.configService.get<string>('STORAGE_PROVIDER') ??
      this.configService.get<string>('app.storage.type');
    const isR2 = provider === 'r2';
    return {
      accessKeyId:
        this.configService.get<string>('R2_ACCESS_KEY_ID') ??
        this.configService.get<string>('AWS_ACCESS_KEY_ID') ??
        '',
      secretAccessKey:
        this.configService.get<string>('R2_SECRET_ACCESS_KEY') ??
        this.configService.get<string>('AWS_SECRET_ACCESS_KEY') ??
        '',
      region:
        this.configService.get<string>('S3_REGION') ??
        this.configService.get<string>('AWS_REGION') ??
        'auto',
      bucketName:
        this.configService.get<string>('R2_BUCKET') ??
        this.configService.get<string>('S3_BUCKET_NAME') ??
        this.configService.get<string>('AWS_S3_BUCKET') ??
        '',
      endpoint:
        this.configService.get<string>('R2_ENDPOINT') ??
        this.configService.get<string>('S3_ENDPOINT'),
      publicRead:
        this.configService.get<string>('STORAGE_PUBLIC') === 'true' ||
        this.configService.get<string>('S3_PUBLIC_READ') === 'true',
      signedUrlExpiry: Number(
        this.configService.get<string>('S3_SIGNED_URL_EXPIRY') ?? 3600,
      ),
      maxFileSize:
        Number(
          this.configService.get<string>('STORAGE_MAX_FILE_SIZE_MB') ?? 5,
        ) *
        1024 *
        1024,
      publicBaseUrl: isR2
        ? this.configService.get<string>('R2_PUBLIC_BASE_URL')
        : this.configService.get<string>('S3_PUBLIC_BASE_URL'),
    };
  }

  private publicUrl(key: string): string {
    if (this.config.publicBaseUrl) {
      return `${this.config.publicBaseUrl.replace(/\/$/, '')}/${key}`;
    }
    return `https://${this.config.bucketName}.s3.${this.config.region}.amazonaws.com/${key}`;
  }

  private assertConfigured(): void {
    if (!this.validateConfig()) {
      throw new BadRequestException('S3/R2 storage is not configured');
    }
  }
}
