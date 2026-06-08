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
    console.log('Updating FPT Software and Viettel Group companyType to "corporation"...');

    // Update FPT Software
    await prisma.company.updateMany({
      where: {
        slug: 'fpt-software',
      },
      data: {
        companyType: 'corporation',
      },
    });
    console.log('FPT Software type updated to corporation.');

    // Update Viettel Group
    await prisma.company.updateMany({
      where: {
        slug: 'viettel-group',
      },
      data: {
        companyType: 'corporation',
      },
    });
    console.log('Viettel Group type updated to corporation.');

  } catch (e) {
    console.error('Error updating company types:', e);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main();
