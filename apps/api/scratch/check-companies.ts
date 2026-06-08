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
      select: { id: true, name: true, slug: true, logoUrl: true },
    });
    console.log('--- ALL COMPANIES IN DB ---');
    console.log(JSON.stringify(companies, null, 2));
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main();
