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
    console.log('1. Updating FPT Software and TechCorp Vietnam logos...');

    // Update FPT Software
    await prisma.company.updateMany({
      where: {
        slug: 'fpt-software',
      },
      data: {
        logoUrl: 'https://cdn-new.topcv.vn/unsafe/https%3A//static.topcv.vn/company_logos/fpt-software-5b58392131974.jpg',
      },
    });
    console.log('Updated FPT Software logo.');

    // Update TechCorp Vietnam
    await prisma.company.updateMany({
      where: {
        slug: 'techcorp-vn',
      },
      data: {
        logoUrl: 'https://cdn-new.topcv.vn/unsafe/https%3A//static.topcv.vn/company_logos/cong-ty-co-phan-cong-nghe-techcorp-viet-nam-6380695029a1b.jpg',
      },
    });
    console.log('Updated TechCorp Vietnam logo.');

    console.log('2. Fetching all 10 companies...');
    const companies = await prisma.company.findMany({
      select: { id: true, name: true },
    });
    console.log(`Found ${companies.length} companies in DB.`);

    console.log('3. Fetching all jobs...');
    const jobs = await prisma.job.findMany({
      where: { deletedAt: null },
      select: { id: true, title: true },
    });
    console.log(`Found ${jobs.length} jobs in DB.`);

    console.log('4. Redistributing jobs across all 10 companies...');
    let count = 0;
    for (let i = 0; i < jobs.length; i++) {
      const job = jobs[i];
      const targetCompany = companies[i % companies.length];
      
      await prisma.job.update({
        where: { id: job.id },
        data: {
          companyId: targetCompany.id,
        },
      });
      count++;
      console.log(`Assigned job "${job.title}" to company "${targetCompany.name}"`);
    }

    console.log(`Redistribution complete. Updated ${count} jobs.`);
  } catch (e) {
    console.error('Error executing update-all-10-companies:', e);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main();
