import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class JobSlugService {
  constructor(private readonly prisma: PrismaService) {}

  async generateUniqueSlug(
    title: string,
    excludeJobId?: string,
  ): Promise<string> {
    const baseSlug = this.slugify(title);
    for (let attempt = 0; attempt < 100; attempt++) {
      const candidateSlug =
        attempt === 0 ? baseSlug : `${baseSlug}-${attempt + 1}`;
      const exists = await this.prisma.job.findFirst({
        where: {
          slug: candidateSlug,
          deletedAt: null,
          ...(excludeJobId ? { id: { not: excludeJobId } } : {}),
        },
        select: { id: true },
      });
      if (!exists) {
        return candidateSlug;
      }
    }

    return `${baseSlug}-${Date.now()}`;
  }

  private slugify(value: string): string {
    const normalized = value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '')
      .slice(0, 80);

    return normalized || `job-${Date.now()}`;
  }
}
