import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

const connectionString = process.env['DATABASE_URL'] ?? 'postgresql://postgres:postgres@localhost:5432/postgres';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString })
});

async function main() {
  const exps = await prisma.job.groupBy({
    by: ['experienceLevel'],
    _count: { _all: true }
  });
  console.log('experienceLevel facets:', exps);

  const levels = await prisma.job.groupBy({
    by: ['jobLevel'],
    _count: { _all: true }
  });
  console.log('jobLevel facets:', levels);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
