import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { extname, join, normalize, resolve } from 'node:path';
import { randomUUID } from 'node:crypto';
import { CV_ALLOWED_EXTENSIONS } from '../cvs.constants';

@Injectable()
export class CvStorageService {
  private readonly uploadRoot = resolve(
    process.env['CV_UPLOAD_DIR'] ?? join(process.cwd(), 'uploads', 'cvs'),
  );

  async save(
    candidateId: string,
    file: Pick<Express.Multer.File, 'buffer' | 'originalname'>,
  ): Promise<string> {
    const candidateDir = resolve(this.uploadRoot, candidateId);
    await mkdir(candidateDir, { recursive: true });

    const extension = extname(file.originalname).toLowerCase();
    const safeExtension = CV_ALLOWED_EXTENSIONS.has(extension)
      ? extension
      : '.bin';
    const storedName = `${Date.now()}-${randomUUID()}${safeExtension}`;
    const absolutePath = resolve(candidateDir, storedName);

    await writeFile(absolutePath, file.buffer);

    return normalize(join(candidateId, storedName));
  }

  async remove(relativePath: string): Promise<void> {
    const absolutePath = this.toSafeAbsolutePath(relativePath);
    await rm(absolutePath, { force: true });
  }

  private toSafeAbsolutePath(relativePath: string): string {
    const absolutePath = resolve(this.uploadRoot, relativePath);
    if (!absolutePath.startsWith(this.uploadRoot)) {
      throw new InternalServerErrorException('Invalid stored CV path');
    }
    return absolutePath;
  }
}
