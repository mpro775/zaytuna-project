import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs/promises';
import * as path from 'path';
import { PrismaService } from '../../shared/database/prisma.service';

export interface ImageOptimizationOptions {
  quality?: number; // 1-100
  format?: 'jpeg' | 'png' | 'webp' | 'avif';
  maxWidth?: number;
  maxHeight?: number;
  maintainAspectRatio?: boolean;
  progressive?: boolean;
  compressionLevel?: number;
}

export interface ThumbnailOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'jpeg' | 'png' | 'webp';
  fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
}

export interface ImageMetadata {
  width: number;
  height: number;
  format: string;
  size: number;
  colorSpace?: string;
  hasAlpha?: boolean;
  density?: number;
}

export interface OptimizationResult {
  success: boolean;
  originalSize: number;
  optimizedSize: number;
  compressionRatio: number;
  outputPath: string;
  metadata?: ImageMetadata;
  error?: string;
}

@Injectable()
export class ImageOptimizationService {
  private readonly logger = new Logger(ImageOptimizationService.name);
  private readonly thumbnailsDir: string;
  private readonly optimizedDir: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    const uploadDir = this.configService.get<string>('UPLOAD_DIR', './uploads');
    this.thumbnailsDir = path.join(uploadDir, 'thumbnails');
    this.optimizedDir = path.join(uploadDir, 'optimized');
    this.ensureDirectories();
  }

  /**
   * طھط­ط³ظٹظ† طµظˆط±ط© ظˆط­ظپط¸ظ‡ط§
   */
  async optimizeImage(
    inputPath: string,
    outputPath: string,
    options: ImageOptimizationOptions = {},
  ): Promise<OptimizationResult> {
    try {
      this.logger.log(
        `طھط­ط³ظٹظ† ط§ظ„طµظˆط±ط©: ${inputPath} -> ${outputPath}`,
      );

      // ط§ظ„طھط­ظ‚ظ‚ ظ…ظ† ظˆط¬ظˆط¯ ط§ظ„ظ…ظ„ظپ ط§ظ„ط£طµظ„ظٹ
      await fs.access(inputPath);

      // ط§ظ„ط­طµظˆظ„ ط¹ظ„ظ‰ ظ…ط¹ظ„ظˆظ…ط§طھ ط§ظ„ظ…ظ„ظپ ط§ظ„ط£طµظ„ظٹ
      const stats = await fs.stat(inputPath);
      const originalSize = stats.size;

      // MVP note: Uncomment when sharp is installed
      /*
      const sharp = require('sharp');
      const inputBuffer = await fs.readFile(inputPath);

      let pipeline = sharp(inputBuffer);

      // طھط·ط¨ظٹظ‚ ط§ظ„ط®ظٹط§ط±ط§طھ
      if (options.maxWidth || options.maxHeight) {
        pipeline = pipeline.resize({
          width: options.maxWidth,
          height: options.maxHeight,
          fit: options.maintainAspectRatio !== false ? 'inside' : 'fill',
          withoutEnlargement: true,
        });
      }

      // طھط­ظˆظٹظ„ ط§ظ„طھظ†ط³ظٹظ‚
      if (options.format) {
        const formatOptions: any = {};

        if (options.quality) {
          formatOptions.quality = options.quality;
        }

        if (options.progressive !== undefined) {
          formatOptions.progressive = options.progressive;
        }

        if (options.compressionLevel) {
          formatOptions.compressionLevel = options.compressionLevel;
        }

        pipeline = pipeline[options.format](formatOptions);
      }

      // ط­ظپط¸ ط§ظ„طµظˆط±ط© ط§ظ„ظ…ط­ط³ظ†ط©
      const outputBuffer = await pipeline.toBuffer();
      await fs.writeFile(outputPath, outputBuffer);

      // ط§ظ„ط­طµظˆظ„ ط¹ظ„ظ‰ metadata ظ„ظ„طµظˆط±ط© ط§ظ„ظ†ط§طھط¬ط©
      const metadata = await sharp(outputBuffer).metadata();

      const optimizedSize = outputBuffer.length;
      const compressionRatio = ((originalSize - optimizedSize) / originalSize) * 100;

      return {
        success: true,
        originalSize,
        optimizedSize,
        compressionRatio,
        outputPath,
        metadata: {
          width: metadata.width || 0,
          height: metadata.height || 0,
          format: metadata.format || 'unknown',
          size: optimizedSize,
          colorSpace: metadata.space,
          hasAlpha: metadata.hasAlpha,
          density: metadata.density,
        },
      };
      */

      // ظ…ط­ط§ظƒط§ط© ط§ظ„طھط­ط³ظٹظ† ظ„ظ„طھط·ظˆظٹط±
      this.logger.log(
        `[MVP_LOCAL] طھظ… طھط­ط³ظٹظ† ط§ظ„طµظˆط±ط©: ${path.basename(inputPath)}`,
      );

      // ظ†ط³ط® ط§ظ„ظ…ظ„ظپ ظƒظ…ط§ ظ‡ظˆ (ظ…ط­ط§ظƒط§ط©)
      await fs.copyFile(inputPath, outputPath);

      return {
        success: true,
        originalSize,
        optimizedSize: originalSize,
        compressionRatio: 0,
        outputPath,
        metadata: {
          width: 800,
          height: 600,
          format: 'jpeg',
          size: originalSize,
          colorSpace: 'srgb',
          hasAlpha: false,
          density: 72,
        },
      };
    } catch (error) {
      this.logger.error(
        `ظپط´ظ„ ظپظٹ طھط­ط³ظٹظ† ط§ظ„طµظˆط±ط©: ${inputPath}`,
        error,
      );
      return {
        success: false,
        originalSize: 0,
        optimizedSize: 0,
        compressionRatio: 0,
        outputPath,
        error: error.message,
      };
    }
  }

  /**
   * ط¥ظ†ط´ط§ط، طµظˆط±ط© ظ…طµط؛ط±ط©
   */
  async createThumbnail(
    inputPath: string,
    outputPath: string,
    options: ThumbnailOptions = {},
  ): Promise<OptimizationResult> {
    try {
      this.logger.log(
        `ط¥ظ†ط´ط§ط، طµظˆط±ط© ظ…طµط؛ط±ط©: ${inputPath} -> ${outputPath}`,
      );

      // ط§ظ„طھط­ظ‚ظ‚ ظ…ظ† ظˆط¬ظˆط¯ ط§ظ„ظ…ظ„ظپ ط§ظ„ط£طµظ„ظٹ
      await fs.access(inputPath);

      const stats = await fs.stat(inputPath);
      const originalSize = stats.size;

      // ط®ظٹط§ط±ط§طھ ط§ظپطھط±ط§ط¶ظٹط© ظ„ظ„طµظˆط± ط§ظ„ظ…طµط؛ط±ط©
      const defaultOptions: ThumbnailOptions = {
        width: 300,
        height: 300,
        quality: 80,
        format: 'jpeg',
        fit: 'cover',
        ...options,
      };

      // MVP note: Uncomment when sharp is installed
      /*
      const sharp = require('sharp');
      const inputBuffer = await fs.readFile(inputPath);

      let pipeline = sharp(inputBuffer)
        .resize({
          width: defaultOptions.width,
          height: defaultOptions.height,
          fit: defaultOptions.fit,
          position: 'center',
          withoutEnlargement: true,
        });

      // طھط·ط¨ظٹظ‚ ط§ظ„ط¬ظˆط¯ط© ظˆط§ظ„طھظ†ط³ظٹظ‚
      if (defaultOptions.format === 'jpeg') {
        pipeline = pipeline.jpeg({ quality: defaultOptions.quality || 80 });
      } else if (defaultOptions.format === 'png') {
        pipeline = pipeline.png({ quality: defaultOptions.quality || 80 });
      } else if (defaultOptions.format === 'webp') {
        pipeline = pipeline.webp({ quality: defaultOptions.quality || 80 });
      }

      const outputBuffer = await pipeline.toBuffer();
      await fs.writeFile(outputPath, outputBuffer);

      const optimizedSize = outputBuffer.length;
      const compressionRatio = ((originalSize - optimizedSize) / originalSize) * 100;

      return {
        success: true,
        originalSize,
        optimizedSize,
        compressionRatio,
        outputPath,
      };
      */

      // ظ…ط­ط§ظƒط§ط© ط¥ظ†ط´ط§ط، ط§ظ„طµظˆط±ط© ط§ظ„ظ…طµط؛ط±ط© ظ„ظ„طھط·ظˆظٹط±
      this.logger.log(
        `[MVP_LOCAL] طھظ… ط¥ظ†ط´ط§ط، طµظˆط±ط© ظ…طµط؛ط±ط©: ${path.basename(inputPath)}`,
      );

      // ظ†ط³ط® ط§ظ„ظ…ظ„ظپ ظƒظ…ط§ ظ‡ظˆ (ظ…ط­ط§ظƒط§ط©)
      await fs.copyFile(inputPath, outputPath);

      const optimizedSize = originalSize;
      const compressionRatio = 0;

      return {
        success: true,
        originalSize,
        optimizedSize,
        compressionRatio,
        outputPath,
      };
    } catch (error) {
      this.logger.error(
        `ظپط´ظ„ ظپظٹ ط¥ظ†ط´ط§ط، ط§ظ„طµظˆط±ط© ط§ظ„ظ…طµط؛ط±ط©: ${inputPath}`,
        error,
      );
      return {
        success: false,
        originalSize: 0,
        optimizedSize: 0,
        compressionRatio: 0,
        outputPath,
        error: error.message,
      };
    }
  }

  /**
   * ط¥ظ†ط´ط§ط، طµظˆط± ظ…طµط؛ط±ط© ظ…طھط¹ط¯ط¯ط© ط§ظ„ط£ط­ط¬ط§ظ…
   */
  async createMultipleThumbnails(
    inputPath: string,
    baseOutputPath: string,
    sizes: Array<{ width: number; height: number; suffix: string }>,
  ): Promise<OptimizationResult[]> {
    const results: OptimizationResult[] = [];

    for (const size of sizes) {
      const outputPath = `${baseOutputPath}_${size.suffix}${path.extname(baseOutputPath)}`;

      const result = await this.createThumbnail(inputPath, outputPath, {
        width: size.width,
        height: size.height,
      });

      results.push(result);
    }

    return results;
  }

  /**
   * طھط­ط³ظٹظ† طµظˆط±ط© ظˆط­ظپط¸ظ‡ط§ ظƒظ…ظ„ظپ ط¬ط¯ظٹط¯
   */
  async optimizeAndSaveImage(
    fileId: string,
    options: ImageOptimizationOptions = {},
  ): Promise<OptimizationResult> {
    try {
      const file = await this.prisma.file.findUnique({
        where: { id: fileId },
      });

      if (!file) {
        throw new BadRequestException('ط§ظ„ظ…ظ„ظپ ط؛ظٹط± ظ…ظˆط¬ظˆط¯');
      }

      if (!this.isImageFile(file.mimeType)) {
        throw new BadRequestException('ط§ظ„ظ…ظ„ظپ ظ„ظٹط³ طµظˆط±ط©');
      }

      // ط¥ظ†ط´ط§ط، ظ…ط³ط§ط± ط§ظ„ظ…ظ„ظپ ط§ظ„ظ…ط­ط³ظ†
      const optimizedPath = path.join(
        this.optimizedDir,
        file.bucket,
        `optimized_${file.filename}`,
      );

      // ط§ظ„طھط£ظƒط¯ ظ…ظ† ظˆط¬ظˆط¯ ط§ظ„ظ…ط¬ظ„ط¯
      await fs.mkdir(path.dirname(optimizedPath), { recursive: true });

      // طھط­ط³ظٹظ† ط§ظ„طµظˆط±ط©
      const result = await this.optimizeImage(
        file.path,
        optimizedPath,
        options,
      );

      if (result.success) {
        // ط¥ظ†ط´ط§ط، ظ†ط³ط®ط© ط§ط­طھظٹط§ط·ظٹط© ظ…ظ† ط§ظ„ط¥طµط¯ط§ط± ط§ظ„ط£طµظ„ظٹ
        await this.createBackupVersion(fileId, 'طھط­ط³ظٹظ† ط§ظ„طµظˆط±ط©');

        // طھط­ط¯ظٹط« ظ…ط¹ظ„ظˆظ…ط§طھ ط§ظ„ظ…ظ„ظپ
        await this.prisma.file.update({
          where: { id: fileId },
          data: {
            path: optimizedPath,
            size: BigInt(result.optimizedSize),
            metadata: {
              ...(file.metadata || {}),
              optimized: true,
              compressionRatio: result.compressionRatio,
              optimizedAt: new Date(),
            },
            updatedAt: new Date(),
          },
        });
      }

      return result;
    } catch (error) {
      this.logger.error(
        `ظپط´ظ„ ظپظٹ طھط­ط³ظٹظ† ط§ظ„طµظˆط±ط©: ${fileId}`,
        error,
      );
      throw error;
    }
  }

  /**
   * ط¥ظ†ط´ط§ط، طµظˆط± ظ…طµط؛ط±ط© ظ„ظ…ظ„ظپ ظ…ظˆط¬ظˆط¯
   */
  async generateThumbnailsForFile(
    fileId: string,
    sizes: Array<{ width: number; height: number; suffix: string }> = [
      { width: 150, height: 150, suffix: 'sm' },
      { width: 300, height: 300, suffix: 'md' },
      { width: 600, height: 600, suffix: 'lg' },
    ],
  ): Promise<OptimizationResult[]> {
    try {
      const file = await this.prisma.file.findUnique({
        where: { id: fileId },
      });

      if (!file) {
        throw new BadRequestException('ط§ظ„ظ…ظ„ظپ ط؛ظٹط± ظ…ظˆط¬ظˆط¯');
      }

      if (!this.isImageFile(file.mimeType)) {
        throw new BadRequestException('ط§ظ„ظ…ظ„ظپ ظ„ظٹط³ طµظˆط±ط©');
      }

      const baseThumbnailPath = path.join(
        this.thumbnailsDir,
        file.bucket,
        path.parse(file.filename).name,
      );

      // ط§ظ„طھط£ظƒط¯ ظ…ظ† ظˆط¬ظˆط¯ ظ…ط¬ظ„ط¯ ط§ظ„طµظˆط± ط§ظ„ظ…طµط؛ط±ط©
      await fs.mkdir(path.dirname(baseThumbnailPath), { recursive: true });

      // ط¥ظ†ط´ط§ط، ط§ظ„طµظˆط± ط§ظ„ظ…طµط؛ط±ط©
      const results = await this.createMultipleThumbnails(
        file.path,
        baseThumbnailPath,
        sizes,
      );

      // طھط­ط¯ظٹط« ظ…ط³ط§ط± ط§ظ„طµظˆط±ط© ط§ظ„ظ…طµط؛ط±ط© ط§ظ„ط§ظپطھط±ط§ط¶ظٹط© (ط§ظ„ظ…طھظˆط³ط·ط©)
      const mediumThumbnail = results.find((r) => r.outputPath.includes('_md'));
      if (mediumThumbnail) {
        await this.prisma.file.update({
          where: { id: fileId },
          data: {
            thumbnailPath: mediumThumbnail.outputPath,
            metadata: {
              ...(file.metadata || {}),
              thumbnails: sizes.map((size, index) => ({
                size: size.suffix,
                path: results[index]?.outputPath,
                width: size.width,
                height: size.height,
              })),
              thumbnailsGeneratedAt: new Date(),
            },
          },
        });
      }

      return results;
    } catch (error) {
      this.logger.error(
        `ظپط´ظ„ ظپظٹ ط¥ظ†ط´ط§ط، ط§ظ„طµظˆط± ط§ظ„ظ…طµط؛ط±ط©: ${fileId}`,
        error,
      );
      throw error;
    }
  }

  /**
   * طھط­ظˆظٹظ„ طµظˆط±ط© ط¥ظ„ظ‰ طھظ†ط³ظٹظ‚ ط¢ط®ط±
   */
  async convertImageFormat(
    fileId: string,
    targetFormat: 'jpeg' | 'png' | 'webp' | 'avif',
    quality: number = 80,
  ): Promise<OptimizationResult> {
    try {
      const file = await this.prisma.file.findUnique({
        where: { id: fileId },
      });

      if (!file) {
        throw new BadRequestException('ط§ظ„ظ…ظ„ظپ ط؛ظٹط± ظ…ظˆط¬ظˆط¯');
      }

      if (!this.isImageFile(file.mimeType)) {
        throw new BadRequestException('ط§ظ„ظ…ظ„ظپ ظ„ظٹط³ طµظˆط±ط©');
      }

      // ط¥ظ†ط´ط§ط، ظ…ط³ط§ط± ط§ظ„ظ…ظ„ظپ ط§ظ„ظ…ط­ظˆظ„
      const convertedPath = path.join(
        this.optimizedDir,
        file.bucket,
        `converted_${path.parse(file.filename).name}.${targetFormat}`,
      );

      // ط§ظ„طھط£ظƒط¯ ظ…ظ† ظˆط¬ظˆط¯ ط§ظ„ظ…ط¬ظ„ط¯
      await fs.mkdir(path.dirname(convertedPath), { recursive: true });

      // طھط­ظˆظٹظ„ ط§ظ„طµظˆط±ط©
      const result = await this.optimizeImage(file.path, convertedPath, {
        format: targetFormat,
        quality,
      });

      if (result.success) {
        // ط¥ظ†ط´ط§ط، ظ†ط³ط®ط© ط§ط­طھظٹط§ط·ظٹط©
        await this.createBackupVersion(
          fileId,
          `طھط­ظˆظٹظ„ ط¥ظ„ظ‰ ${targetFormat}`,
        );

        // طھط­ط¯ظٹط« ظ…ط¹ظ„ظˆظ…ط§طھ ط§ظ„ظ…ظ„ظپ
        await this.prisma.file.update({
          where: { id: fileId },
          data: {
            path: convertedPath,
            filename: path.basename(convertedPath),
            mimeType: `image/${targetFormat}`,
            size: BigInt(result.optimizedSize),
            extension: targetFormat,
            metadata: {
              ...(file.metadata || {}),
              converted: true,
              originalFormat: file.extension,
              targetFormat,
              convertedAt: new Date(),
            },
            updatedAt: new Date(),
          },
        });
      }

      return result;
    } catch (error) {
      this.logger.error(
        `ظپط´ظ„ ظپظٹ طھط­ظˆظٹظ„ طھظ†ط³ظٹظ‚ ط§ظ„طµظˆط±ط©: ${fileId}`,
        error,
      );
      throw error;
    }
  }

  /**
   * ط§ظ„ط­طµظˆظ„ ط¹ظ„ظ‰ metadata ظ„ظ„طµظˆط±ط©
   */
  async getImageMetadata(filePath: string): Promise<ImageMetadata | null> {
    try {
      // MVP note: Uncomment when sharp is installed
      /*
      const sharp = require('sharp');
      const metadata = await sharp(filePath).metadata();

      return {
        width: metadata.width || 0,
        height: metadata.height || 0,
        format: metadata.format || 'unknown',
        size: 0, // ط³ظٹطھظ… ط­ط³ط§ط¨ظ‡ ظ„ط§ط­ظ‚ط§ظ‹
        colorSpace: metadata.space,
        hasAlpha: metadata.hasAlpha,
        density: metadata.density,
      };
      */

      // ظ…ط­ط§ظƒط§ط© ظ„ظ„طھط·ظˆظٹط±
      const stats = await fs.stat(filePath);

      return {
        width: 800,
        height: 600,
        format: 'jpeg',
        size: stats.size,
        colorSpace: 'srgb',
        hasAlpha: false,
        density: 72,
      };
    } catch (error) {
      this.logger.error(
        `ظپط´ظ„ ظپظٹ ط§ظ„ط­طµظˆظ„ ط¹ظ„ظ‰ metadata ظ„ظ„طµظˆط±ط©: ${filePath}`,
        error,
      );
      return null;
    }
  }

  /**
   * طھط·ط¨ظٹظ‚ طھط­ط³ظٹظ† طھظ„ظ‚ط§ط¦ظٹ ظ„ظ„طµظˆط±
   */
  async autoOptimizeImage(
    fileId: string,
    aggressive: boolean = false,
  ): Promise<{
    optimizations: string[];
    totalCompression: number;
    results: OptimizationResult[];
  }> {
    try {
      const file = await this.prisma.file.findUnique({
        where: { id: fileId },
      });

      if (!file) {
        throw new BadRequestException('ط§ظ„ظ…ظ„ظپ ط؛ظٹط± ظ…ظˆط¬ظˆط¯');
      }

      const optimizations: string[] = [];
      const results: OptimizationResult[] = [];
      let totalCompression = 0;

      // طھط­ط³ظٹظ† ط§ظ„ط¬ظˆط¯ط© ظˆط§ظ„ط­ط¬ظ…
      if (aggressive) {
        const qualityResult = await this.optimizeImage(file.path, file.path, {
          quality: 70,
          format: 'jpeg',
        });
        if (qualityResult.success) {
          optimizations.push('طھظ‚ظ„ظٹظ„ ط§ظ„ط¬ظˆط¯ط© ط¥ظ„ظ‰ 70%');
          results.push(qualityResult);
          totalCompression += qualityResult.compressionRatio;
        }
      } else {
        const qualityResult = await this.optimizeImage(file.path, file.path, {
          quality: 85,
          format: 'jpeg',
        });
        if (qualityResult.success) {
          optimizations.push('طھظ‚ظ„ظٹظ„ ط§ظ„ط¬ظˆط¯ط© ط¥ظ„ظ‰ 85%');
          results.push(qualityResult);
          totalCompression += qualityResult.compressionRatio;
        }
      }

      // طھط؛ظٹظٹط± ط§ظ„ط­ط¬ظ… ط¥ط°ط§ ظƒط§ظ†طھ ط§ظ„طµظˆط±ط© ظƒط¨ظٹط±ط© ط¬ط¯ط§ظ‹
      const metadata = await this.getImageMetadata(file.path);
      if (metadata && (metadata.width > 2000 || metadata.height > 2000)) {
        const resizeResult = await this.optimizeImage(file.path, file.path, {
          maxWidth: 1920,
          maxHeight: 1080,
          maintainAspectRatio: true,
        });
        if (resizeResult.success) {
          optimizations.push(
            'طھط؛ظٹظٹط± ط§ظ„ط­ط¬ظ… ط¥ظ„ظ‰ 1920x1080 ظƒط­ط¯ ط£ظ‚طµظ‰',
          );
          results.push(resizeResult);
          totalCompression += resizeResult.compressionRatio;
        }
      }

      // طھط­ظˆظٹظ„ ط¥ظ„ظ‰ WebP ط¥ط°ط§ ظƒط§ظ† ظ…ط¯ط¹ظˆظ…ط§ظ‹
      if (file.mimeType === 'image/jpeg' || file.mimeType === 'image/png') {
        const webpPath = file.path.replace(/\.[^.]+$/, '.webp');
        const webpResult = await this.optimizeImage(file.path, webpPath, {
          format: 'webp',
          quality: 80,
        });

        if (
          webpResult.success &&
          webpResult.optimizedSize < Number(file.size)
        ) {
          optimizations.push('طھط­ظˆظٹظ„ ط¥ظ„ظ‰ WebP');
          results.push(webpResult);
          totalCompression += webpResult.compressionRatio;

          // ط§ط³طھط¨ط¯ط§ظ„ ط§ظ„ظ…ظ„ظپ ط§ظ„ط£طµظ„ظٹ ط¨ط§ظ„ظ†ط³ط®ط© ط§ظ„ظ…ط­ط³ظ†ط©
          await fs.rename(webpPath, file.path);
        }
      }

      return {
        optimizations,
        totalCompression,
        results,
      };
    } catch (error) {
      this.logger.error(
        `ظپط´ظ„ ظپظٹ ط§ظ„طھط­ط³ظٹظ† ط§ظ„طھظ„ظ‚ط§ط¦ظٹ: ${fileId}`,
        error,
      );
      throw error;
    }
  }

  /**
   * طھظ†ط¸ظٹظپ ط§ظ„طµظˆط± ط§ظ„ظ…طµط؛ط±ط© ط§ظ„ظ‚ط¯ظٹظ…ط©
   */
  async cleanupOrphanedThumbnails(): Promise<number> {
    try {
      this.logger.log('طھظ†ط¸ظٹظپ ط§ظ„طµظˆط± ط§ظ„ظ…طµط؛ط±ط© ط§ظ„ظٹطھظٹظ…ط©');

      // MVP note: طھظ†ظپظٹط° ظپط­طµ ط´ط§ظ…ظ„ ظ„ظ„طµظˆط± ط§ظ„ظ…طµط؛ط±ط© ط؛ظٹط± ط§ظ„ظ…ط±طھط¨ط·ط© ط¨ظ…ظ„ظپط§طھ
      const deletedCount = 0;

      // ظ…ط­ط§ظƒط§ط© ظ„ظ„طھط·ظˆظٹط±
      this.logger.log(
        `طھظ… ط­ط°ظپ ${deletedCount} طµظˆط±ط© ظ…طµط؛ط±ط© ظٹطھظٹظ…ط©`,
      );

      return deletedCount;
    } catch (error) {
      this.logger.error(
        'ظپط´ظ„ ظپظٹ طھظ†ط¸ظٹظپ ط§ظ„طµظˆط± ط§ظ„ظ…طµط؛ط±ط© ط§ظ„ظٹطھظٹظ…ط©',
        error,
      );
      return 0;
    }
  }

  // ========== PRIVATE METHODS ==========

  /**
   * ط§ظ„طھط£ظƒط¯ ظ…ظ† ظˆط¬ظˆط¯ ط§ظ„ظ…ط¬ظ„ط¯ط§طھ ط§ظ„ظ…ط·ظ„ظˆط¨ط©
   */
  private async ensureDirectories(): Promise<void> {
    try {
      await fs.mkdir(this.thumbnailsDir, { recursive: true });
      await fs.mkdir(this.optimizedDir, { recursive: true });
    } catch (error) {
      this.logger.error(
        'ظپط´ظ„ ظپظٹ ط¥ظ†ط´ط§ط، ظ…ط¬ظ„ط¯ط§طھ ط§ظ„طھط­ط³ظٹظ†',
        error,
      );
    }
  }

  /**
   * ط¥ظ†ط´ط§ط، ظ†ط³ط®ط© ط§ط­طھظٹط§ط·ظٹط© ظ‚ط¨ظ„ ط§ظ„طھط¹ط¯ظٹظ„
   */
  private async createBackupVersion(
    fileId: string,
    reason: string,
  ): Promise<void> {
    // MVP note: ط§ط³طھط®ط¯ط§ظ… FileManagementService ظ„ط¥ظ†ط´ط§ط، ظ†ط³ط®ط© ط§ط­طھظٹط§ط·ظٹط©
    this.logger.log(
      `[MVP_LOCAL] ط¥ظ†ط´ط§ط، ظ†ط³ط®ط© ط§ط­طھظٹط§ط·ظٹط©: ${fileId} - ${reason}`,
    );
  }

  /**
   * ط§ظ„طھط­ظ‚ظ‚ ظ…ظ† ط£ظ† ط§ظ„ظ…ظ„ظپ طµظˆط±ط©
   */
  private isImageFile(mimeType: string): boolean {
    return mimeType.startsWith('image/');
  }

  /**
   * ط§ظ„ط­طµظˆظ„ ط¹ظ„ظ‰ ط¥ط¹ط¯ط§ط¯ط§طھ ط§ظ„طھط­ط³ظٹظ† ط§ظ„ط§ظپطھط±ط§ط¶ظٹط©
   */
  getDefaultOptimizationOptions(): ImageOptimizationOptions {
    return {
      quality: 85,
      format: 'jpeg',
      maxWidth: 1920,
      maxHeight: 1080,
      maintainAspectRatio: true,
      progressive: true,
    };
  }

  /**
   * ط§ظ„ط­طµظˆظ„ ط¹ظ„ظ‰ ط¥ط¹ط¯ط§ط¯ط§طھ ط§ظ„طµظˆط± ط§ظ„ظ…طµط؛ط±ط© ط§ظ„ط§ظپطھط±ط§ط¶ظٹط©
   */
  getDefaultThumbnailOptions(): ThumbnailOptions {
    return {
      width: 300,
      height: 300,
      quality: 80,
      format: 'jpeg',
      fit: 'cover',
    };
  }
}
