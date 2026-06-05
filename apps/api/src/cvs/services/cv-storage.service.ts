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

  getAbsolutePath(relativePath: string): string {
    return this.documentStorageService.getAbsolutePath('cvs', relativePath);
  }
}
