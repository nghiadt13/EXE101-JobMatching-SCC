import type { MetadataRoute } from 'next';
import { getJobs } from '@/lib/jobs-client';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.NEXT_PUBLIC_WEB_URL ?? 'http://localhost:3000';
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${siteUrl}/`,
      changeFrequency: 'daily',
      priority: 1,
    },
  ];

  try {
    const jobRoutes: MetadataRoute.Sitemap = [];
    let page = 1;
    let totalPages = 1;
    do {
      const jobs = await getJobs({ page, limit: 50, sort: 'newest' });
      totalPages = jobs.pagination.totalPages;
      for (const job of jobs.items) {
        if (job.status !== 'PUBLISHED') {
          continue;
        }
        jobRoutes.push({
          url: `${siteUrl}/jobs/${job.slug}`,
          changeFrequency: 'daily',
          priority: 0.7,
          lastModified: job.updatedAt,
        });
      }
      page += 1;
    } while (page <= totalPages && page <= 20);

    return [...staticRoutes, ...jobRoutes];
  } catch {
    return staticRoutes;
  }
}
