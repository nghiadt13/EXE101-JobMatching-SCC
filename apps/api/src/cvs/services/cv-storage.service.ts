import { Injectable } from '@nestjs/common';
import { DocumentStorageService } from '../../documents/services/document-storage.service';

@Injectable()
export class CvStorageService {
  constructor(
    private readonly documentStorageService: DocumentStorageService,
  ) {}

  async save(
    candidateId: string,
    file: Pick<Express.Multer.File, 'buffer' | 'originalname'>,
  ): Promise<string> {
    return this.documentStorageService.save('cvs', candidateId, file);
  }

  async remove(relativePath: string): Promise<void> {
    await this.documentStorageService.remove('cvs', relativePath);
  }

  /**
   * Resolve the safe absolute path of a stored CV file so callers can stream
   * the original upload back to the owner. Delegates path-traversal hardening
   * to {@link DocumentStorageService.getAbsolutePath}.
   */
  getAbsolutePath(relativePath: string): string {
    return this.documentStorageService.getAbsolutePath('cvs', relativePath);
  }
}
