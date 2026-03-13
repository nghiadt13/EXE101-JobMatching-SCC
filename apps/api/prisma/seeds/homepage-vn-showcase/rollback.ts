import 'dotenv/config';
import { buildPrismaClient, SEED_CATEGORIES, SEED_COMPANIES, SEED_JOBS, SEED_RECRUITERS, SEED_TAG } from './data';

async function rollbackHomepageVnShowcase() {
  const prisma = buildPrismaClient();

  try {
    await prisma.$transaction(async (tx) => {
      const seededJobSlugs = SEED_JOBS.map((job) => job.slug);
      const seededCompanySlugs = SEED_COMPANIES.map((company) => company.slug);
      const seededCategorySlugs = SEED_CATEGORIES.map((category) => category.slug);
      const seededRecruiterEmails = SEED_RECRUITERS.map((recruiter) => recruiter.email);

      const seededCandidateUsers = await tx.user.findMany({
        where: {
          email: {
            endsWith: '@seed.hr-platform.local',
          },
          role: 'CANDIDATE',
        },
        select: { id: true },
      });

      const seededCandidateIds = (
        await tx.candidate.findMany({
          where: {
            userId: { in: seededCandidateUsers.map((row) => row.id) },
          },
          select: { id: true },
        })
      ).map((row) => row.id);

      await tx.application.deleteMany({
        where: {
          OR: [
            { job: { slug: { in: seededJobSlugs } } },
            { candidateId: { in: seededCandidateIds } },
          ],
        },
      });

      await tx.savedJob.deleteMany({
        where: {
          job: { slug: { in: seededJobSlugs } },
        },
      });

      await tx.job.deleteMany({
        where: {
          slug: { in: seededJobSlugs },
        },
      });

      await tx.cV.deleteMany({
        where: {
          candidateId: { in: seededCandidateIds },
        },
      });

      await tx.candidate.deleteMany({
        where: {
          id: { in: seededCandidateIds },
        },
      });

      await tx.notification.deleteMany({
        where: {
          OR: [
            { user: { email: { in: seededRecruiterEmails } } },
            { body: { contains: `(${SEED_TAG})` } },
          ],
        },
      });

      await tx.user.deleteMany({
        where: {
          OR: [
            { email: { in: seededRecruiterEmails } },
            { email: { endsWith: '@seed.hr-platform.local' } },
          ],
        },
      });

      await tx.company.deleteMany({
        where: {
          slug: { in: seededCompanySlugs },
        },
      });

      await tx.jobCategory.deleteMany({
        where: {
          slug: { in: seededCategorySlugs },
        },
      });
    });

    console.log(`[${SEED_TAG}] Rollback completed. Seeded homepage showcase data removed.`);
  } finally {
    await prisma.$disconnect();
  }
}

rollbackHomepageVnShowcase().catch((error) => {
  console.error(`[${SEED_TAG}] Rollback failed`, error);
  process.exit(1);
});
