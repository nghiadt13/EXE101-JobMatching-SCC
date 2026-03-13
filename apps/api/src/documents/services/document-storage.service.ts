import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import {
  extname,
  isAbsolute,
  join,
  normalize,
  relative,
  resolve,
} from 'node:path';
import {
  DOCUMENT_ALLOWED_EXTENSIONS,
  type DocumentScope,
} from '../document-upload.constants';

@Injectable()
export class DocumentStorageService {
  async save(
    scope: DocumentScope,
    ownerId: string,
    file: Pick<Express.Multer.File, 'buffer' | 'originalname'>,
  ): Promise<string> {
    const uploadRoot = this.getUploadRoot(scope);
    const ownerDir = resolve(uploadRoot, ownerId);
    await mkdir(ownerDir, { recursive: true });

    const extension = extname(file.originalname).toLowerCase();
    const safeExtension = DOCUMENT_ALLOWED_EXTENSIONS.has(extension)
      ? extension
      : '.bin';
    const storedName = `${Date.now()}-${randomUUID()}${safeExtension}`;
    const absolutePath = resolve(ownerDir, storedName);

    await writeFile(absolutePath, file.buffer);

    return normalize(join(ownerId, storedName));
  }

  async remove(scope: DocumentScope, relativePath: string): Promise<void> {
    const uploadRoot = this.getUploadRoot(scope);
    const absolutePath = this.toSafeAbsolutePath(uploadRoot, relativePath);
    await rm(absolutePath, { force: true });
  }

  getAbsolutePath(scope: DocumentScope, relativePath: string): string {
    return this.toSafeAbsolutePath(this.getUploadRoot(scope), relativePath);
  }

  private getUploadRoot(scope: DocumentScope): string {
    if (scope === 'cvs') {
      return resolve(
        process.env['CV_UPLOAD_DIR'] ?? join(process.cwd(), 'uploads', 'cvs'),
      );
    }

    return resolve(
      process.env['JOB_UPLOAD_DIR'] ?? join(process.cwd(), 'uploads', 'jobs'),
    );
  }

  private toSafeAbsolutePath(uploadRoot: string, relativePath: string): string {
    const cleanPath = relativePath.replace(/^[/\\]+/, '');
    const absolutePath = resolve(uploadRoot, cleanPath);
    const relativeToRoot = relative(uploadRoot, absolutePath);
    if (
      relativeToRoot.startsWith('..') ||
      isAbsolute(relativeToRoot) ||
      relativeToRoot === ''
    ) {
      throw new InternalServerErrorException('Invalid stored document path');
    }
    return absolutePath;
  }
}
