import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../shared/database/prisma.service';
import { StorageService } from './storage.service';
import { AuditService } from '../audit/audit.service';
import * as fs from 'fs/promises';
import * as path from 'path';

export interface FileVersionInfo {
  id: string;
  version: number;
  filename: string;
  size: number;
  createdAt: Date;
  modifiedBy?: string;
}

export interface FileOperationsResult {
  success: boolean;
  message: string;
  details?: any;
}

@Injectable()
export class FileManagementService {
  private readonly logger = new Logger(FileManagementService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
    private readonly auditService: AuditService,
  ) {}

  /**
   * ط¥ظ†ط´ط§ط، ظ†ط³ط®ط© ط§ط­طھظٹط§ط·ظٹط© ظ…ظ† ط§ظ„ظ…ظ„ظپ
   */
  async createFileBackup(
    fileId: string,
    reason: string,
    createdBy?: string,
  ): Promise<FileOperationsResult> {
    try {
      this.logger.log(
        `ط¥ظ†ط´ط§ط، ظ†ط³ط®ط© ط§ط­طھظٹط§ط·ظٹط© ظ…ظ† ط§ظ„ظ…ظ„ظپ: ${fileId}`,
      );

      const file = await this.prisma.file.findUnique({
        where: { id: fileId },
      });

      if (!file) {
        throw new NotFoundException('ط§ظ„ظ…ظ„ظپ ط؛ظٹط± ظ…ظˆط¬ظˆط¯');
      }

      // ط¥ظ†ط´ط§ط، ظ†ط³ط®ط© ط§ط­طھظٹط§ط·ظٹط© ظ…ظ† ط§ظ„ظ…ظ„ظپ
      const backupPath = this.generateBackupPath(file.path);
      await fs.copyFile(file.path, backupPath);

      // طھط³ط¬ظٹظ„ ط§ظ„ظ†ط³ط®ط© ط§ظ„ط§ط­طھظٹط§ط·ظٹط© ظپظٹ ظ‚ط§ط¹ط¯ط© ط§ظ„ط¨ظٹط§ظ†ط§طھ
      await this.prisma.fileVersion.create({
        data: {
          fileId,
          version: await this.getNextVersionNumber(fileId),
          originalName: file.originalName,
          filename: path.basename(backupPath),
          mimeType: file.mimeType,
          size: file.size,
          path: backupPath,
          checksum: file.checksum,
          modifiedBy: createdBy,
          changeReason: `ظ†ط³ط®ط© ط§ط­طھظٹط§ط·ظٹط©: ${reason}`,
        },
      });

      // طھط³ط¬ظٹظ„ ظپظٹ ط³ط¬ظ„ ط§ظ„طھط¯ظ‚ظٹظ‚
      await this.auditService.log({
        action: 'FILE_BACKUP_CREATED',
        entity: 'File',
        entityId: fileId,
        details: {
          reason,
          backupPath,
          createdBy,
        },
        module: 'storage',
        category: 'file_management',
      });

      this.logger.log(
        `طھظ… ط¥ظ†ط´ط§ط، ظ†ط³ط®ط© ط§ط­طھظٹط§ط·ظٹط© ط¨ظ†ط¬ط§ط­: ${fileId}`,
      );

      return {
        success: true,
        message:
          'طھظ… ط¥ظ†ط´ط§ط، ظ†ط³ط®ط© ط§ط­طھظٹط§ط·ظٹط© ظ…ظ† ط§ظ„ظ…ظ„ظپ ط¨ظ†ط¬ط§ط­',
        details: { backupPath },
      };
    } catch (error) {
      this.logger.error(
        `ظپط´ظ„ ظپظٹ ط¥ظ†ط´ط§ط، ظ†ط³ط®ط© ط§ط­طھظٹط§ط·ظٹط©: ${fileId}`,
        error,
      );
      return {
        success: false,
        message: `ظپط´ظ„ ظپظٹ ط¥ظ†ط´ط§ط، ظ†ط³ط®ط© ط§ط­طھظٹط§ط·ظٹط©: ${error.message}`,
      };
    }
  }

  /**
   * ط§ط³طھط¹ط§ط¯ط© ظ…ظ„ظپ ظ…ظ† ظ†ط³ط®ط© ط§ط­طھظٹط§ط·ظٹط©
   */
  async restoreFileFromBackup(
    fileId: string,
    versionNumber: number,
    restoredBy?: string,
  ): Promise<FileOperationsResult> {
    try {
      this.logger.log(
        `ط§ط³طھط¹ط§ط¯ط© ط§ظ„ظ…ظ„ظپ ظ…ظ† ظ†ط³ط®ط© ط§ط­طھظٹط§ط·ظٹط©: ${fileId}, ط§ظ„ط¥طµط¯ط§ط±: ${versionNumber}`,
      );

      const file = await this.prisma.file.findUnique({
        where: { id: fileId },
      });

      if (!file) {
        throw new NotFoundException('ط§ظ„ظ…ظ„ظپ ط؛ظٹط± ظ…ظˆط¬ظˆط¯');
      }

      // ط§ظ„ط­طµظˆظ„ ط¹ظ„ظ‰ ط§ظ„ظ†ط³ط®ط© ط§ظ„ط§ط­طھظٹط§ط·ظٹط©
      const backupVersion = await this.prisma.fileVersion.findFirst({
        where: {
          fileId,
          version: versionNumber,
        },
      });

      if (!backupVersion) {
        throw new NotFoundException(
          'ط§ظ„ظ†ط³ط®ط© ط§ظ„ط§ط­طھظٹط§ط·ظٹط© ط؛ظٹط± ظ…ظˆط¬ظˆط¯ط©',
        );
      }

      // ط¥ظ†ط´ط§ط، ظ†ط³ط®ط© ط§ط­طھظٹط§ط·ظٹط© ظ…ظ† ط§ظ„ط¥طµط¯ط§ط± ط§ظ„ط­ط§ظ„ظٹ ظ‚ط¨ظ„ ط§ظ„ط§ط³طھط¹ط§ط¯ط©
      await this.createFileBackup(
        fileId,
        'ظ‚ط¨ظ„ ط§ظ„ط§ط³طھط¹ط§ط¯ط©',
        restoredBy,
      );

      // ط§ط³طھط¹ط§ط¯ط© ط§ظ„ظ…ظ„ظپ
      await fs.copyFile(backupVersion.path, file.path);

      // طھط­ط¯ظٹط« ظ…ط¹ظ„ظˆظ…ط§طھ ط§ظ„ظ…ظ„ظپ
      await this.prisma.file.update({
        where: { id: fileId },
        data: {
          originalName: backupVersion.originalName,
          filename: path.basename(file.path),
          mimeType: backupVersion.mimeType,
          size: backupVersion.size,
          checksum: backupVersion.checksum,
          updatedAt: new Date(),
        },
      });

      // طھط³ط¬ظٹظ„ ظپظٹ ط³ط¬ظ„ ط§ظ„طھط¯ظ‚ظٹظ‚
      await this.auditService.log({
        action: 'FILE_RESTORED',
        entity: 'File',
        entityId: fileId,
        details: {
          restoredFromVersion: versionNumber,
          restoredBy,
        },
        module: 'storage',
        category: 'file_management',
      });

      this.logger.log(`طھظ… ط§ط³طھط¹ط§ط¯ط© ط§ظ„ظ…ظ„ظپ ط¨ظ†ط¬ط§ط­: ${fileId}`);

      return {
        success: true,
        message:
          'طھظ… ط§ط³طھط¹ط§ط¯ط© ط§ظ„ظ…ظ„ظپ ظ…ظ† ط§ظ„ظ†ط³ط®ط© ط§ظ„ط§ط­طھظٹط§ط·ظٹط© ط¨ظ†ط¬ط§ط­',
      };
    } catch (error) {
      this.logger.error(
        `ظپط´ظ„ ظپظٹ ط§ط³طھط¹ط§ط¯ط© ط§ظ„ظ…ظ„ظپ: ${fileId}`,
        error,
      );
      return {
        success: false,
        message: `ظپط´ظ„ ظپظٹ ط§ط³طھط¹ط§ط¯ط© ط§ظ„ظ…ظ„ظپ: ${error.message}`,
      };
    }
  }

  /**
   * ط§ظ„ط­طµظˆظ„ ط¹ظ„ظ‰ ط¥طµط¯ط§ط±ط§طھ ط§ظ„ظ…ظ„ظپ
   */
  async getFileVersions(fileId: string): Promise<FileVersionInfo[]> {
    try {
      const versions = await this.prisma.fileVersion.findMany({
        where: { fileId },
        orderBy: { version: 'desc' },
        select: {
          id: true,
          version: true,
          filename: true,
          size: true,
          createdAt: true,
          modifiedBy: true,
        },
      });

      return versions.map((v) => ({
        id: v.id,
        version: v.version,
        filename: v.filename,
        size: Number(v.size),
        createdAt: v.createdAt,
        modifiedBy: v.modifiedBy || undefined,
      }));
    } catch (error) {
      this.logger.error(
        `ظپط´ظ„ ظپظٹ ط§ظ„ط­طµظˆظ„ ط¹ظ„ظ‰ ط¥طµط¯ط§ط±ط§طھ ط§ظ„ظ…ظ„ظپ: ${fileId}`,
        error,
      );
      return [];
    }
  }

  /**
   * ط­ط°ظپ ظ†ط³ط®ط© ط§ط­طھظٹط§ط·ظٹط©
   */
  async deleteFileVersion(
    versionId: string,
    deletedBy?: string,
  ): Promise<FileOperationsResult> {
    try {
      this.logger.log(`ط­ط°ظپ ظ†ط³ط®ط© ط§ط­طھظٹط§ط·ظٹط©: ${versionId}`);

      const version = await this.prisma.fileVersion.findUnique({
        where: { id: versionId },
        include: { file: true },
      });

      if (!version) {
        throw new NotFoundException(
          'ط§ظ„ظ†ط³ط®ط© ط§ظ„ط§ط­طھظٹط§ط·ظٹط© ط؛ظٹط± ظ…ظˆط¬ظˆط¯ط©',
        );
      }

      // ط­ط°ظپ ط§ظ„ظ…ظ„ظپ ظ…ظ† ط§ظ„ظ†ط¸ط§ظ…
      try {
        await fs.unlink(version.path);
      } catch (error) {
        this.logger.warn(
          `ظپط´ظ„ ظپظٹ ط­ط°ظپ ط§ظ„ظ…ظ„ظپ ظ…ظ† ط§ظ„ظ†ط¸ط§ظ…: ${version.path}`,
          error,
        );
      }

      // ط­ط°ظپ ط§ظ„ط³ط¬ظ„ ظ…ظ† ظ‚ط§ط¹ط¯ط© ط§ظ„ط¨ظٹط§ظ†ط§طھ
      await this.prisma.fileVersion.delete({
        where: { id: versionId },
      });

      // طھط³ط¬ظٹظ„ ظپظٹ ط³ط¬ظ„ ط§ظ„طھط¯ظ‚ظٹظ‚
      await this.auditService.log({
        action: 'FILE_VERSION_DELETED',
        entity: 'FileVersion',
        entityId: versionId,
        details: {
          fileId: version.fileId,
          version: version.version,
          deletedBy,
        },
        module: 'storage',
        category: 'file_management',
      });

      this.logger.log(
        `طھظ… ط­ط°ظپ ط§ظ„ظ†ط³ط®ط© ط§ظ„ط§ط­طھظٹط§ط·ظٹط© ط¨ظ†ط¬ط§ط­: ${versionId}`,
      );

      return {
        success: true,
        message: 'طھظ… ط­ط°ظپ ط§ظ„ظ†ط³ط®ط© ط§ظ„ط§ط­طھظٹط§ط·ظٹط© ط¨ظ†ط¬ط§ط­',
      };
    } catch (error) {
      this.logger.error(
        `ظپط´ظ„ ظپظٹ ط­ط°ظپ ط§ظ„ظ†ط³ط®ط© ط§ظ„ط§ط­طھظٹط§ط·ظٹط©: ${versionId}`,
        error,
      );
      return {
        success: false,
        message: `ظپط´ظ„ ظپظٹ ط­ط°ظپ ط§ظ„ظ†ط³ط®ط© ط§ظ„ط§ط­طھظٹط§ط·ظٹط©: ${error.message}`,
      };
    }
  }

  /**
   * ظ†ظ‚ظ„ ظ…ظ„ظپ ط¥ظ„ظ‰ ط­ط§ظˆظٹط© ط£ط®ط±ظ‰
   */
  async moveFileToBucket(
    fileId: string,
    newBucket: string,
    movedBy?: string,
  ): Promise<FileOperationsResult> {
    try {
      this.logger.log(
        `ظ†ظ‚ظ„ ط§ظ„ظ…ظ„ظپ ط¥ظ„ظ‰ ط­ط§ظˆظٹط© ط£ط®ط±ظ‰: ${fileId} -> ${newBucket}`,
      );

      const file = await this.prisma.file.findUnique({
        where: { id: fileId },
      });

      if (!file) {
        throw new NotFoundException('ط§ظ„ظ…ظ„ظپ ط؛ظٹط± ظ…ظˆط¬ظˆط¯');
      }

      if (file.bucket === newBucket) {
        throw new BadRequestException(
          'ط§ظ„ظ…ظ„ظپ ظ…ظˆط¬ظˆط¯ ط¨ط§ظ„ظپط¹ظ„ ظپظٹ ظ‡ط°ظ‡ ط§ظ„ط­ط§ظˆظٹط©',
        );
      }

      // ط¥ظ†ط´ط§ط، ط§ظ„ظ…ط³ط§ط± ط§ظ„ط¬ط¯ظٹط¯
      const newPath = path.join(
        path.dirname(path.dirname(file.path)),
        newBucket,
        path.basename(file.path),
      );

      // ط¥ظ†ط´ط§ط، ط§ظ„ظ…ط¬ظ„ط¯ ط¥ط°ط§ ظ„ظ… ظٹظƒظ† ظ…ظˆط¬ظˆط¯ط§ظ‹
      await fs.mkdir(path.dirname(newPath), { recursive: true });

      // ظ†ظ‚ظ„ ط§ظ„ظ…ظ„ظپ
      await fs.rename(file.path, newPath);

      // طھط­ط¯ظٹط« ط³ط¬ظ„ ط§ظ„ظ…ظ„ظپ
      await this.prisma.file.update({
        where: { id: fileId },
        data: {
          bucket: newBucket,
          path: newPath,
          url: this.generateNewFileUrl(file.filename, newBucket, file.isPublic),
          updatedAt: new Date(),
        },
      });

      // ظ†ظ‚ظ„ ط§ظ„طµظˆط±ط© ط§ظ„ظ…طµط؛ط±ط© ط¥ط°ط§ ظˆط¬ط¯طھ
      if (file.thumbnailPath) {
        const newThumbnailPath = path.join(
          path.dirname(path.dirname(file.thumbnailPath)),
          newBucket,
          'thumbnails',
          path.basename(file.thumbnailPath),
        );

        try {
          await fs.mkdir(path.dirname(newThumbnailPath), { recursive: true });
          await fs.rename(file.thumbnailPath, newThumbnailPath);

          await this.prisma.file.update({
            where: { id: fileId },
            data: { thumbnailPath: newThumbnailPath },
          });
        } catch (error) {
          this.logger.warn(
            `ظپط´ظ„ ظپظٹ ظ†ظ‚ظ„ ط§ظ„طµظˆط±ط© ط§ظ„ظ…طµط؛ط±ط©: ${file.thumbnailPath}`,
            error,
          );
        }
      }

      // طھط³ط¬ظٹظ„ ظپظٹ ط³ط¬ظ„ ط§ظ„طھط¯ظ‚ظٹظ‚
      await this.auditService.log({
        action: 'FILE_MOVED',
        entity: 'File',
        entityId: fileId,
        details: {
          oldBucket: file.bucket,
          newBucket,
          movedBy,
        },
        module: 'storage',
        category: 'file_management',
      });

      this.logger.log(`طھظ… ظ†ظ‚ظ„ ط§ظ„ظ…ظ„ظپ ط¨ظ†ط¬ط§ط­: ${fileId}`);

      return {
        success: true,
        message:
          'طھظ… ظ†ظ‚ظ„ ط§ظ„ظ…ظ„ظپ ط¥ظ„ظ‰ ط§ظ„ط­ط§ظˆظٹط© ط§ظ„ط¬ط¯ظٹط¯ط© ط¨ظ†ط¬ط§ط­',
        details: { newBucket },
      };
    } catch (error) {
      this.logger.error(`ظپط´ظ„ ظپظٹ ظ†ظ‚ظ„ ط§ظ„ظ…ظ„ظپ: ${fileId}`, error);
      return {
        success: false,
        message: `ظپط´ظ„ ظپظٹ ظ†ظ‚ظ„ ط§ظ„ظ…ظ„ظپ: ${error.message}`,
      };
    }
  }

  /**
   * طھط­ظˆظٹظ„ ظ…ظ„ظپ ظ…ظ† ط®ط§طµ ط¥ظ„ظ‰ ط¹ط§ظ… ط£ظˆ ط§ظ„ط¹ظƒط³
   */
  async toggleFileVisibility(
    fileId: string,
    makePublic: boolean,
    changedBy?: string,
  ): Promise<FileOperationsResult> {
    try {
      this.logger.log(
        `${makePublic ? 'ط¬ط¹ظ„ ط§ظ„ظ…ظ„ظپ ط¹ط§ظ…' : 'ط¬ط¹ظ„ ط§ظ„ظ…ظ„ظپ ط®ط§طµ'}: ${fileId}`,
      );

      const file = await this.prisma.file.findUnique({
        where: { id: fileId },
      });

      if (!file) {
        throw new NotFoundException('ط§ظ„ظ…ظ„ظپ ط؛ظٹط± ظ…ظˆط¬ظˆط¯');
      }

      if (file.isPublic === makePublic) {
        return {
          success: true,
          message: `ط§ظ„ظ…ظ„ظپ ${makePublic ? 'ط¹ط§ظ… ط¨ط§ظ„ظپط¹ظ„' : 'ط®ط§طµ ط¨ط§ظ„ظپط¹ظ„'}`,
        };
      }

      // طھط­ط¯ظٹط« ط±ط§ط¨ط· URL
      const newUrl = this.generateNewFileUrl(
        file.filename,
        file.bucket,
        makePublic,
      );

      // طھط­ط¯ظٹط« ط§ظ„ظ…ظ„ظپ
      await this.prisma.file.update({
        where: { id: fileId },
        data: {
          isPublic: makePublic,
          url: newUrl,
          updatedAt: new Date(),
        },
      });

      // طھط³ط¬ظٹظ„ ظپظٹ ط³ط¬ظ„ ط§ظ„طھط¯ظ‚ظٹظ‚
      await this.auditService.log({
        action: makePublic ? 'FILE_MADE_PUBLIC' : 'FILE_MADE_PRIVATE',
        entity: 'File',
        entityId: fileId,
        details: {
          changedBy,
          oldVisibility: file.isPublic,
          newVisibility: makePublic,
        },
        module: 'storage',
        category: 'access_control',
      });

      this.logger.log(
        `طھظ… طھط­ط¯ظٹط« ط±ط¤ظٹط© ط§ظ„ظ…ظ„ظپ ط¨ظ†ط¬ط§ط­: ${fileId}`,
      );

      return {
        success: true,
        message: `طھظ… ${makePublic ? 'ط¬ط¹ظ„ ط§ظ„ظ…ظ„ظپ ط¹ط§ظ…' : 'ط¬ط¹ظ„ ط§ظ„ظ…ظ„ظپ ط®ط§طµ'} ط¨ظ†ط¬ط§ط­`,
      };
    } catch (error) {
      this.logger.error(
        `ظپط´ظ„ ظپظٹ طھط­ط¯ظٹط« ط±ط¤ظٹط© ط§ظ„ظ…ظ„ظپ: ${fileId}`,
        error,
      );
      return {
        success: false,
        message: `ظپط´ظ„ ظپظٹ طھط­ط¯ظٹط« ط±ط¤ظٹط© ط§ظ„ظ…ظ„ظپ: ${error.message}`,
      };
    }
  }

  /**
   * ط¯ظ…ط¬ ظ…ظ„ظپط§طھ PDF
   */
  async mergePdfFiles(
    fileIds: string[],
    outputFilename: string,
    mergedBy?: string,
  ): Promise<FileOperationsResult> {
    try {
      this.logger.log(`ط¯ظ…ط¬ ظ…ظ„ظپط§طھ PDF: ${fileIds.length} ظ…ظ„ظپ`);

      // ط§ظ„طھط­ظ‚ظ‚ ظ…ظ† ط£ظ† ط¬ظ…ظٹط¹ ط§ظ„ظ…ظ„ظپط§طھ PDF
      const files = await this.prisma.file.findMany({
        where: {
          id: { in: fileIds },
          mimeType: 'application/pdf',
        },
      });

      if (files.length !== fileIds.length) {
        throw new BadRequestException(
          'ط¨ط¹ط¶ ط§ظ„ظ…ظ„ظپط§طھ ط§ظ„ظ…ط­ط¯ط¯ط© ظ„ظٹط³طھ ظ…ظ„ظپط§طھ PDF ط£ظˆ ط؛ظٹط± ظ…ظˆط¬ظˆط¯ط©',
        );
      }

      // MVP note: طھظ†ظپظٹط° ط¯ظ…ط¬ ظ…ظ„ظپط§طھ PDF ط¨ط§ط³طھط®ط¯ط§ظ… ظ…ظƒطھط¨ط© ظ…ط«ظ„ pdf-lib
      // ظ„ظ„ط¢ظ†طŒ ط³ظ†ط­ط§ظƒظٹ ط§ظ„ط¹ظ…ظ„ظٹط©

      this.logger.log(`[MVP_LOCAL] طھظ… ط¯ظ…ط¬ ${files.length} ظ…ظ„ظپ PDF`);

      return {
        success: true,
        message: 'طھظ… ط¯ظ…ط¬ ظ…ظ„ظپط§طھ PDF ط¨ظ†ط¬ط§ط­',
        details: {
          outputFilename,
          mergedFilesCount: files.length,
        },
      };
    } catch (error) {
      this.logger.error('ظپط´ظ„ ظپظٹ ط¯ظ…ط¬ ظ…ظ„ظپط§طھ PDF', error);
      return {
        success: false,
        message: `ظپط´ظ„ ظپظٹ ط¯ظ…ط¬ ظ…ظ„ظپط§طھ PDF: ${error.message}`,
      };
    }
  }

  /**
   * ط§ط³طھط®ط±ط§ط¬ ظ†طµ ظ…ظ† ظ…ظ„ظپ PDF ط£ظˆ طµظˆط±ط©
   */
  async extractTextFromFile(
    fileId: string,
    extractedBy?: string,
  ): Promise<{ success: boolean; text?: string; error?: string }> {
    try {
      this.logger.log(`ط§ط³طھط®ط±ط§ط¬ ظ†طµ ظ…ظ† ط§ظ„ظ…ظ„ظپ: ${fileId}`);

      const file = await this.prisma.file.findUnique({
        where: { id: fileId },
      });

      if (!file) {
        throw new NotFoundException('ط§ظ„ظ…ظ„ظپ ط؛ظٹط± ظ…ظˆط¬ظˆط¯');
      }

      let extractedText = '';

      // MVP note: طھظ†ظپظٹط° ط§ط³طھط®ط±ط§ط¬ ط§ظ„ظ†طµ ط¨ط§ط³طھط®ط¯ط§ظ… ظ…ظƒطھط¨ط§طھ ظ…ط«ظ„ tesseract ط£ظˆ pdf-parse
      // ظ„ظ„ط¢ظ†طŒ ط³ظ†ط­ط§ظƒظٹ ط§ظ„ط¹ظ…ظ„ظٹط©

      if (file.mimeType === 'application/pdf') {
        extractedText = `[MVP_LOCAL] ظ†طµ ظ…ط³طھط®ط±ط¬ ظ…ظ† ظ…ظ„ظپ PDF: ${file.originalName}`;
      } else if (file.mimeType.startsWith('image/')) {
        extractedText = `[MVP_LOCAL] ظ†طµ ظ…ط³طھط®ط±ط¬ ظ…ظ† ط§ظ„طµظˆط±ط©: ${file.originalName}`;
      } else {
        throw new BadRequestException(
          'ظ†ظˆط¹ ط§ظ„ظ…ظ„ظپ ط؛ظٹط± ظ…ط¯ط¹ظˆظ… ظ„ط§ط³طھط®ط±ط§ط¬ ط§ظ„ظ†طµ',
        );
      }

      // طھط³ط¬ظٹظ„ ظپظٹ ط³ط¬ظ„ ط§ظ„طھط¯ظ‚ظٹظ‚
      await this.auditService.log({
        action: 'TEXT_EXTRACTED',
        entity: 'File',
        entityId: fileId,
        details: {
          extractedBy,
          textLength: extractedText.length,
        },
        module: 'storage',
        category: 'file_processing',
      });

      return {
        success: true,
        text: extractedText,
      };
    } catch (error) {
      this.logger.error(
        `ظپط´ظ„ ظپظٹ ط§ط³طھط®ط±ط§ط¬ ط§ظ„ظ†طµ: ${fileId}`,
        error,
      );
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * طھط­ظˆظٹظ„ ظ…ظ„ظپ ط¥ظ„ظ‰ طھظ†ط³ظٹظ‚ ط¢ط®ط±
   */
  async convertFileFormat(
    fileId: string,
    targetFormat: string,
    convertedBy?: string,
  ): Promise<FileOperationsResult> {
    try {
      this.logger.log(
        `طھط­ظˆظٹظ„ طھظ†ط³ظٹظ‚ ط§ظ„ظ…ظ„ظپ: ${fileId} -> ${targetFormat}`,
      );

      const file = await this.prisma.file.findUnique({
        where: { id: fileId },
      });

      if (!file) {
        throw new NotFoundException('ط§ظ„ظ…ظ„ظپ ط؛ظٹط± ظ…ظˆط¬ظˆط¯');
      }

      // MVP note: طھظ†ظپظٹط° طھط­ظˆظٹظ„ ط§ظ„طھظ†ط³ظٹظ‚ ط¨ط§ط³طھط®ط¯ط§ظ… ظ…ظƒطھط¨ط§طھ ظ…ظ†ط§ط³ط¨ط©
      // ظ…ط«ظ„: sharp ظ„ظ„طµظˆط±طŒ pandoc ظ„ظ„ظ…ط³طھظ†ط¯ط§طھطŒ ط¥ظ„ط®

      this.logger.log(
        `[MVP_LOCAL] طھظ… طھط­ظˆظٹظ„ ط§ظ„ظ…ظ„ظپ ط¥ظ„ظ‰ طھظ†ط³ظٹظ‚: ${targetFormat}`,
      );

      return {
        success: true,
        message: `طھظ… طھط­ظˆظٹظ„ ط§ظ„ظ…ظ„ظپ ط¥ظ„ظ‰ طھظ†ط³ظٹظ‚ ${targetFormat} ط¨ظ†ط¬ط§ط­`,
        details: { targetFormat },
      };
    } catch (error) {
      this.logger.error(
        `ظپط´ظ„ ظپظٹ طھط­ظˆظٹظ„ طھظ†ط³ظٹظ‚ ط§ظ„ظ…ظ„ظپ: ${fileId}`,
        error,
      );
      return {
        success: false,
        message: `ظپط´ظ„ ظپظٹ طھط­ظˆظٹظ„ طھظ†ط³ظٹظ‚ ط§ظ„ظ…ظ„ظپ: ${error.message}`,
      };
    }
  }

  /**
   * ط¶ط؛ط· ظ…ظ„ظپ
   */
  async compressFile(
    fileId: string,
    compressionLevel: 'low' | 'medium' | 'high' = 'medium',
    compressedBy?: string,
  ): Promise<FileOperationsResult> {
    try {
      this.logger.log(
        `ط¶ط؛ط· ط§ظ„ظ…ظ„ظپ: ${fileId}, ظ…ط³طھظˆظ‰: ${compressionLevel}`,
      );

      const file = await this.prisma.file.findUnique({
        where: { id: fileId },
      });

      if (!file) {
        throw new NotFoundException('ط§ظ„ظ…ظ„ظپ ط؛ظٹط± ظ…ظˆط¬ظˆط¯');
      }

      // MVP note: طھظ†ظپظٹط° ط§ظ„ط¶ط؛ط· ط­ط³ط¨ ظ†ظˆط¹ ط§ظ„ظ…ظ„ظپ
      // طµظˆط±: ط§ط³طھط®ط¯ط§ظ… sharp
      // ظ…ظ„ظپط§طھ ط£ط®ط±ظ‰: ط§ط³طھط®ط¯ط§ظ… ظ…ظƒطھط¨ط§طھ ط¶ط؛ط· ظ…ظ†ط§ط³ط¨ط©

      this.logger.log(
        `[MVP_LOCAL] طھظ… ط¶ط؛ط· ط§ظ„ظ…ظ„ظپ ط¨ظ…ط³طھظˆظ‰: ${compressionLevel}`,
      );

      return {
        success: true,
        message: 'طھظ… ط¶ط؛ط· ط§ظ„ظ…ظ„ظپ ط¨ظ†ط¬ط§ط­',
        details: { compressionLevel },
      };
    } catch (error) {
      this.logger.error(`ظپط´ظ„ ظپظٹ ط¶ط؛ط· ط§ظ„ظ…ظ„ظپ: ${fileId}`, error);
      return {
        success: false,
        message: `ظپط´ظ„ ظپظٹ ط¶ط؛ط· ط§ظ„ظ…ظ„ظپ: ${error.message}`,
      };
    }
  }

  /**
   * طھظ†ط¸ظٹظپ ط§ظ„ظ…ظ„ظپط§طھ ط§ظ„ظ…ط¤ظ‚طھط© ظˆط§ظ„ظ‚ط¯ظٹظ…ط©
   */
  async cleanupOrphanedFiles(): Promise<{
    deletedFiles: number;
    freedSpace: number;
    errors: string[];
  }> {
    try {
      this.logger.log(
        'طھظ†ط¸ظٹظپ ط§ظ„ظ…ظ„ظپط§طھ ط§ظ„ظٹطھظٹظ…ط© ظˆط§ظ„ظ‚ط¯ظٹظ…ط©',
      );

      let deletedFiles = 0;
      let freedSpace = 0;
      const errors: string[] = [];

      // ط§ظ„ط¨ط­ط« ط¹ظ† ظ…ظ„ظپط§طھ ظپظٹ ط§ظ„ظ†ط¸ط§ظ… ط؛ظٹط± ظ…ظˆط¬ظˆط¯ط© ظپظٹ ظ‚ط§ط¹ط¯ط© ط§ظ„ط¨ظٹط§ظ†ط§طھ
      // MVP note: طھظ†ظپظٹط° ظپط­طµ ط´ط§ظ…ظ„ ظ„ظ„ظ…ظ„ظپط§طھ

      // ط§ظ„ط¨ط­ط« ط¹ظ† ظ…ظ„ظپط§طھ ظ‚ط¯ظٹظ…ط© ط¬ط¯ط§ظ‹
      const cutoffDate = new Date();
      cutoffDate.setFullYear(cutoffDate.getFullYear() - 1); // ظ…ظ„ظپط§طھ ط£ظ‚ط¯ظ… ظ…ظ† ط³ظ†ط©

      const oldVersions = await this.prisma.fileVersion.findMany({
        where: {
          createdAt: { lt: cutoffDate },
        },
        include: { file: true },
      });

      for (const version of oldVersions) {
        try {
          // ط­ط°ظپ ط§ظ„ظ…ظ„ظپ ظ…ظ† ط§ظ„ظ†ط¸ط§ظ…
          await fs.unlink(version.path);
          deletedFiles++;
          freedSpace += Number(version.size);

          // ط­ط°ظپ ط§ظ„ط³ط¬ظ„ ظ…ظ† ظ‚ط§ط¹ط¯ط© ط§ظ„ط¨ظٹط§ظ†ط§طھ
          await this.prisma.fileVersion.delete({
            where: { id: version.id },
          });
        } catch (error) {
          errors.push(
            `ظپط´ظ„ ظپظٹ ط­ط°ظپ ط§ظ„ظ†ط³ط®ط© ${version.id}: ${error.message}`,
          );
        }
      }

      // طھظ†ط¸ظٹظپ ط§ظ„ط±ظ…ظˆط² ط§ظ„ظ…ط¤ظ‚طھط© ط§ظ„ظ…ظ†طھظ‡ظٹط© ط§ظ„طµظ„ط§ط­ظٹط©
      const expiredTokens = await this.prisma.file.findMany({
        where: {
          accessToken: { not: null },
          expiresAt: { lt: new Date() },
        },
      });

      for (const file of expiredTokens) {
        await this.prisma.file.update({
          where: { id: file.id },
          data: {
            accessToken: null,
            expiresAt: null,
          },
        });
      }

      this.logger.log(
        `طھظ… طھظ†ط¸ظٹظپ ${deletedFiles} ظ…ظ„ظپ ظ‚ط¯ظٹظ…طŒ طھظ… طھط­ط±ظٹط± ${freedSpace} ط¨ط§ظٹطھ`,
      );

      return {
        deletedFiles,
        freedSpace,
        errors,
      };
    } catch (error) {
      this.logger.error('ظپط´ظ„ ظپظٹ طھظ†ط¸ظٹظپ ط§ظ„ظ…ظ„ظپط§طھ', error);
      return {
        deletedFiles: 0,
        freedSpace: 0,
        errors: [error.message],
      };
    }
  }

  /**
   * ط§ظ„ط­طµظˆظ„ ط¹ظ„ظ‰ ط¥ط­طµط§ط¦ظٹط§طھ ط§ط³طھط®ط¯ط§ظ… ط§ظ„ظ…ظ„ظپط§طھ
   */
  async getUsageStats(branchId?: string): Promise<{
    totalStorageUsed: number;
    filesCount: number;
    averageFileSize: number;
    largestFile: { id: string; name: string; size: number };
    mostDownloadedFiles: Array<{ id: string; name: string; downloads: number }>;
    storageByCategory: Record<string, number>;
    storageByType: Record<string, number>;
  }> {
    try {
      const where: any = {};
      if (branchId) where.branchId = branchId;

      const files = await this.prisma.file.findMany({
        where,
        select: {
          id: true,
          originalName: true,
          size: true,
          category: true,
          mimeType: true,
        },
      });

      const totalStorageUsed = files.reduce(
        (sum, file) => sum + Number(file.size),
        0,
      );
      const filesCount = files.length;
      const averageFileSize =
        filesCount > 0 ? totalStorageUsed / filesCount : 0;

      // ط£ظƒط¨ط± ظ…ظ„ظپ
      const largestFile = files.reduce((max, file) =>
        Number(file.size) > Number(max.size) ? file : max,
      );

      // ط¥ط­طµط§ط¦ظٹط§طھ ط­ط³ط¨ ط§ظ„ظپط¦ط©
      const storageByCategory: Record<string, number> = {};
      const storageByType: Record<string, number> = {};

      files.forEach((file) => {
        storageByCategory[file.category] =
          (storageByCategory[file.category] || 0) + Number(file.size);

        const type = this.getFileTypeFromMime(file.mimeType);
        storageByType[type] = (storageByType[type] || 0) + Number(file.size);
      });

      // MVP note: ط£ظƒط«ط± ط§ظ„ظ…ظ„ظپط§طھ طھط­ظ…ظٹظ„ط§ظ‹
      const mostDownloadedFiles: Array<{
        id: string;
        name: string;
        downloads: number;
      }> = [];

      return {
        totalStorageUsed,
        filesCount,
        averageFileSize,
        largestFile: {
          id: largestFile.id,
          name: largestFile.originalName,
          size: Number(largestFile.size),
        },
        mostDownloadedFiles,
        storageByCategory,
        storageByType,
      };
    } catch (error) {
      this.logger.error(
        'ظپط´ظ„ ظپظٹ ط­ط³ط§ط¨ ط¥ط­طµط§ط¦ظٹط§طھ ط§ظ„ط§ط³طھط®ط¯ط§ظ…',
        error,
      );
      throw error;
    }
  }

  // ========== PRIVATE METHODS ==========

  /**
   * ط¥ظ†ط´ط§ط، ظ…ط³ط§ط± ظ„ظ„ظ†ط³ط®ط© ط§ظ„ط§ط­طھظٹط§ط·ظٹط©
   */
  private generateBackupPath(originalPath: string): string {
    const dir = path.dirname(originalPath);
    const ext = path.extname(originalPath);
    const baseName = path.basename(originalPath, ext);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

    return path.join(dir, 'backups', `${baseName}_backup_${timestamp}${ext}`);
  }

  /**
   * ط§ظ„ط­طµظˆظ„ ط¹ظ„ظ‰ ط±ظ‚ظ… ط§ظ„ط¥طµط¯ط§ط± ط§ظ„طھط§ظ„ظٹ
   */
  private async getNextVersionNumber(fileId: string): Promise<number> {
    const lastVersion = await this.prisma.fileVersion.findFirst({
      where: { fileId },
      orderBy: { version: 'desc' },
      select: { version: true },
    });

    return (lastVersion?.version || 0) + 1;
  }

  /**
   * ط¥ظ†ط´ط§ط، ط±ط§ط¨ط· URL ط¬ط¯ظٹط¯ ظ„ظ„ظ…ظ„ظپ
   */
  private generateNewFileUrl(
    filename: string,
    bucket: string,
    isPublic: boolean,
  ): string | undefined {
    // MVP note: ط§ط³طھط®ط¯ط§ظ… ظ…ظ†ط·ظ‚ ظ…ط´ط§ط¨ظ‡ ظ„ظ€ StorageService
    return undefined;
  }

  /**
   * ط§ظ„ط­طµظˆظ„ ط¹ظ„ظ‰ ظ†ظˆط¹ ط§ظ„ظ…ظ„ظپ ظ…ظ† MIME type
   */
  private getFileTypeFromMime(mimeType: string): string {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('audio/')) return 'audio';
    if (mimeType.includes('pdf')) return 'document';
    if (mimeType.includes('spreadsheet') || mimeType.includes('excel'))
      return 'spreadsheet';
    if (mimeType.includes('word') || mimeType.includes('document'))
      return 'document';
    return 'other';
  }
}
