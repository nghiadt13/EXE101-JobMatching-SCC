import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

async function main() {
  const connectionString =
    process.env['DATABASE_URL'] ??
    'postgresql://postgres:namngo001@localhost:5432/job_matching';

  const pool = new Pool({ connectionString });
  const prisma = new PrismaClient({
    adapter: new PrismaPg(pool),
  });

  try {
    const companies = await prisma.company.findMany({
      include: {
        _count: {
          select: { jobs: true },
        },
      },
    });
    console.log('--- JOBS COUNT BY COMPANY ---');
    companies.forEach((c) => {
      console.log(`Company: "${c.name}" (ID: ${c.id}) has ${c._count.jobs} jobs. LogoUrl: ${c.logoUrl}`);
    });
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main();
