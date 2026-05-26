import { diskStorage } from 'multer';
import * as path from 'path';
import * as crypto from 'crypto';
import * as fs from 'fs/promises';
import { BadRequestException } from '@nestjs/common';

export interface FileValidationOptions {
  maxSize?: number; // ط¨ط§ظ„ط¨ط§ظٹطھ
  allowedTypes?: string[]; // ط£ظ†ظˆط§ط¹ MIME ط§ظ„ظ…ط³ظ…ظˆط­ط©
  allowedExtensions?: string[]; // ط§ظ„ط§ظ…طھط¯ط§ط¯ط§طھ ط§ظ„ظ…ط³ظ…ظˆط­ط©
}

export interface FileUploadConfig {
  dest: string;
  filename?: (
    req: any,
    file: any,
    cb: (error: Error | null, filename: string) => void,
  ) => void;
  fileFilter?: (
    req: any,
    file: any,
    cb: (error: Error | null, acceptFile: boolean) => void,
  ) => void;
  limits?: {
    fileSize?: number;
    files?: number;
  };
}

/**
 * ط¥ظ†ط´ط§ط، ط¥ط¹ط¯ط§ط¯ط§طھ طھط®ط²ظٹظ† Multer
 */
export function createStorageConfig(uploadDir: string = './uploads/temp') {
  return diskStorage({
    destination: async (req, file, cb) => {
      try {
        // ط§ظ„طھط£ظƒط¯ ظ…ظ† ظˆط¬ظˆط¯ ط§ظ„ظ…ط¬ظ„ط¯
        await fs.mkdir(uploadDir, { recursive: true });
        cb(null, uploadDir);
      } catch (error) {
        cb(error as Error, uploadDir);
      }
    },
    filename: (req, file, cb) => {
      // ط¥ظ†ط´ط§ط، ط§ط³ظ… ظ…ظ„ظپ ظپط±ظٹط¯ ظ…ط¹ timestamp
      const ext = path.extname(file.originalname);
      const baseName = path.basename(file.originalname, ext);
      const timestamp = Date.now();
      const random = crypto.randomBytes(4).toString('hex');

      const filename = `${baseName}_${timestamp}_${random}${ext}`;
      cb(null, filename);
    },
  });
}

/**
 * ط¥ظ†ط´ط§ط، ظ…ط±ط´ط­ ط§ظ„ظ…ظ„ظپط§طھ
 */
export function createFileFilter(options: FileValidationOptions = {}) {
  return (
    req: any,
    file: any,
    cb: (error: Error | null, acceptFile: boolean) => void,
  ) => {
    try {
      // ط§ظ„طھط­ظ‚ظ‚ ظ…ظ† ظ†ظˆط¹ MIME
      if (options.allowedTypes && options.allowedTypes.length > 0) {
        if (!options.allowedTypes.includes(file.mimetype)) {
          return cb(
            new BadRequestException(
              `ظ†ظˆط¹ ط§ظ„ظ…ظ„ظپ ط؛ظٹط± ظ…ط³ظ…ظˆط­: ${file.mimetype}. ط§ظ„ط£ظ†ظˆط§ط¹ ط§ظ„ظ…ط³ظ…ظˆط­ط©: ${options.allowedTypes.join(', ')}`,
            ),
            false,
          );
        }
      }

      // ط§ظ„طھط­ظ‚ظ‚ ظ…ظ† ط§ظ„ط§ظ…طھط¯ط§ط¯
      if (options.allowedExtensions && options.allowedExtensions.length > 0) {
        const ext = path.extname(file.originalname).toLowerCase().substring(1);
        if (!options.allowedExtensions.includes(ext)) {
          return cb(
            new BadRequestException(
              `ط§ظ…طھط¯ط§ط¯ ط§ظ„ظ…ظ„ظپ ط؛ظٹط± ظ…ط³ظ…ظˆط­: ${ext}. ط§ظ„ط§ظ…طھط¯ط§ط¯ط§طھ ط§ظ„ظ…ط³ظ…ظˆط­ط©: ${options.allowedExtensions.join(', ')}`,
            ),
            false,
          );
        }
      }

      cb(null, true);
    } catch (error) {
      cb(error as Error, false);
    }
  };
}

/**
 * ط¥ظ†ط´ط§ط، ط¥ط¹ط¯ط§ط¯ط§طھ ط±ظپط¹ ط§ظ„ظ…ظ„ظپط§طھ ط§ظ„ظƒط§ظ…ظ„ط©
 */
export function createUploadConfig(
  uploadDir: string = './uploads/temp',
  validationOptions: FileValidationOptions = {},
): FileUploadConfig {
  const defaultMaxSize = 10 * 1024 * 1024; // 10MB

  return {
    dest: uploadDir,
    fileFilter: createFileFilter(validationOptions),
    limits: {
      fileSize: validationOptions.maxSize || defaultMaxSize,
      files: 10, // ط­ط¯ ط£ظ‚طµظ‰ 10 ظ…ظ„ظپط§طھ
    },
  };
}

/**
 * ط§ظ„طھط­ظ‚ظ‚ ظ…ظ† طµط­ط© ط§ظ„ظ…ظ„ظپ ط¨ط¹ط¯ ط§ظ„ط±ظپط¹
 */
export async function validateUploadedFile(
  file: any,
  options: FileValidationOptions = {},
): Promise<void> {
  // ط§ظ„طھط­ظ‚ظ‚ ظ…ظ† ط­ط¬ظ… ط§ظ„ظ…ظ„ظپ
  if (options.maxSize && file.size > options.maxSize) {
    throw new BadRequestException(
      `ط­ط¬ظ… ط§ظ„ظ…ظ„ظپ ظƒط¨ظٹط± ط¬ط¯ط§ظ‹. ط§ظ„ط­ط¯ ط§ظ„ط£ظ‚طµظ‰: ${formatFileSize(options.maxSize)}, ط§ظ„ط­ط¬ظ… ط§ظ„ط­ط§ظ„ظٹ: ${formatFileSize(file.size)}`,
    );
  }

  // ط§ظ„طھط­ظ‚ظ‚ ظ…ظ† ط³ظ„ط§ظ…ط© ط§ظ„ظ…ظ„ظپ (ط£ط³ط§ط³ظٹ)
  if (!file.filename || !file.originalname) {
    throw new BadRequestException(
      'ظ…ط¹ظ„ظˆظ…ط§طھ ط§ظ„ظ…ظ„ظپ ط؛ظٹط± ظƒط§ظ…ظ„ط©',
    );
  }

  // ط§ظ„طھط­ظ‚ظ‚ ظ…ظ† ط£ظ† ط§ظ„ظ…ظ„ظپ ظ„ظٹط³ ظپط§ط±ط؛ط§ظ‹
  if (file.size === 0) {
    throw new BadRequestException('ظ„ط§ ظٹظ…ظƒظ† ط±ظپط¹ ظ…ظ„ظپ ظپط§ط±ط؛');
  }
}

/**
 * طھظ†ط³ظٹظ‚ ط­ط¬ظ… ط§ظ„ظ…ظ„ظپ ظ„ظ„ط¹ط±ط¶
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * ط§ظ„ط­طµظˆظ„ ط¹ظ„ظ‰ ظ…ط¹ظ„ظˆظ…ط§طھ ط§ظ„ظ…ظ„ظپ
 */
export function getFileInfo(file: any) {
  const ext = path.extname(file.originalname).toLowerCase();
  const baseName = path.basename(file.originalname, ext);

  return {
    originalName: file.originalname,
    filename: file.filename,
    mimeType: file.mimetype,
    size: file.size,
    extension: ext,
    baseName,
    isImage: file.mimetype.startsWith('image/'),
    isVideo: file.mimetype.startsWith('video/'),
    isAudio: file.mimetype.startsWith('audio/'),
    isDocument: isDocumentFile(file.mimetype),
    isArchive: isArchiveFile(file.mimetype),
  };
}

/**
 * ط§ظ„طھط­ظ‚ظ‚ ظ…ظ† ط£ظ† ط§ظ„ظ…ظ„ظپ ظ…ط³طھظ†ط¯
 */
function isDocumentFile(mimeType: string): boolean {
  const documentTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'text/csv',
  ];

  return documentTypes.includes(mimeType);
}

/**
 * ط§ظ„طھط­ظ‚ظ‚ ظ…ظ† ط£ظ† ط§ظ„ظ…ظ„ظپ ط£ط±ط´ظٹظپ
 */
function isArchiveFile(mimeType: string): boolean {
  const archiveTypes = [
    'application/zip',
    'application/x-zip-compressed',
    'application/x-rar-compressed',
    'application/x-7z-compressed',
    'application/gzip',
    'application/x-tar',
  ];

  return archiveTypes.includes(mimeType);
}

/**
 * ط¥ظ†ط´ط§ط، ط§ط³ظ… ظ…ظ„ظپ ط¢ظ…ظ†
 */
export function createSafeFilename(originalName: string): string {
  // ط¥ط²ط§ظ„ط© ط§ظ„ط£ط­ط±ظپ ط§ظ„ط®ط§طµط© ظˆط§ظ„ظ…ط³ط§ظپط§طھ
  let safeName = originalName
    .replace(/[^a-zA-Z0-9.\-_]/g, '_')
    .replace(/\s+/g, '_')
    .toLowerCase();

  // ط§ظ„طھط£ظƒط¯ ظ…ظ† ط¹ط¯ظ… ظˆط¬ظˆط¯ ط£ط­ط±ظپ ط®ط§طµط© ظپظٹ ط§ظ„ط¨ط¯ط§ظٹط© ط£ظˆ ط§ظ„ظ†ظ‡ط§ظٹط©
  safeName = safeName.replace(/^[_.-]+|[_.-]+$/g, '');

  // ط§ظ„طھط£ظƒط¯ ظ…ظ† ظˆط¬ظˆط¯ ط§ظ…طھط¯ط§ط¯
  if (!path.extname(safeName)) {
    safeName += '.bin';
  }

  return safeName;
}

/**
 * ط§ظ„طھط­ظ‚ظ‚ ظ…ظ† ط£ظ…ط§ظ† ط§ظ„ظ…ظ„ظپ (ط£ط³ط§ط³ظٹ)
 */
export async function basicSecurityCheck(file: any): Promise<void> {
  // ط§ظ„طھط­ظ‚ظ‚ ظ…ظ† ط£ظ† ط§ط³ظ… ط§ظ„ظ…ظ„ظپ ظ„ط§ ظٹط­طھظˆظٹ ط¹ظ„ظ‰ ظ…ط³ط§ط±ط§طھ ط®ط·ظٹط±ط©
  if (
    file.originalname.includes('..') ||
    file.originalname.includes('/') ||
    file.originalname.includes('\\')
  ) {
    throw new BadRequestException('ط§ط³ظ… ط§ظ„ظ…ظ„ظپ ط؛ظٹط± ط¢ظ…ظ†');
  }

  // ط§ظ„طھط­ظ‚ظ‚ ظ…ظ† ط­ط¬ظ… ط§ط³ظ… ط§ظ„ظ…ظ„ظپ
  if (file.originalname.length > 255) {
    throw new BadRequestException('ط§ط³ظ… ط§ظ„ظ…ظ„ظپ ط·ظˆظٹظ„ ط¬ط¯ط§ظ‹');
  }

  // MVP note: ط¥ط¶ط§ظپط© ط§ظ„ظ…ط²ظٹط¯ ظ…ظ† ظپط­ظˆطµط§طھ ط§ظ„ط£ظ…ط§ظ†
  // - ظپط­طµ ظپظٹط±ظˆط³
  // - ظپط­طµ ظ†ظˆط¹ ط§ظ„ظ…ظ„ظپ ط§ظ„ط­ظ‚ظٹظ‚ظٹ
  // - ظپط­طµ metadata
}

/**
 * طھظ†ط¸ظٹظپ ط§ظ„ظ…ظ„ظپط§طھ ط§ظ„ظ…ط¤ظ‚طھط© ط§ظ„ظ‚ط¯ظٹظ…ط©
 */
export async function cleanupTempFiles(
  tempDir: string,
  maxAgeHours: number = 24,
): Promise<void> {
  try {
    const files = await fs.readdir(tempDir);
    const now = Date.now();
    const maxAgeMs = maxAgeHours * 60 * 60 * 1000;

    for (const file of files) {
      const filePath = path.join(tempDir, file);
      const stats = await fs.stat(filePath);

      if (now - stats.mtime.getTime() > maxAgeMs) {
        await fs.unlink(filePath);
      }
    }
  } catch (error) {
    // ظ„ط§ ظ†ط±ظ…ظٹ ط®ط·ط£ ظپظٹ ط­ط§ظ„ط© ظپط´ظ„ ط§ظ„طھظ†ط¸ظٹظپ
    console.warn(
      'ظپط´ظ„ ظپظٹ طھظ†ط¸ظٹظپ ط§ظ„ظ…ظ„ظپط§طھ ط§ظ„ظ…ط¤ظ‚طھط©:',
      error,
    );
  }
}
