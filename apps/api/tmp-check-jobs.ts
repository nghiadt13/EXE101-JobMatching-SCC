import 'dotenv/config';
import { buildPrismaClient } from './prisma/seeds/homepage-vn-showcase/data';

const prisma = buildPrismaClient();

async function main() {
  const rows = await prisma.job.findMany({
    where: { status: 'PUBLISHED', deletedAt: null },
    orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
    take: 20,
    select: {
      slug: true,
      title: true,
      company: { select: { name: true, logoUrl: true } },
      recruiter: { select: { email: true } },
    },
  });
  console.log(JSON.stringify(rows, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
