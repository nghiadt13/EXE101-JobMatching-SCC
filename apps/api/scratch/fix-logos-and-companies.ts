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
    console.log('1. Updating FPT Software logo to local public path...');
    // We update name to match and set logoUrl to Next.js public path
    await prisma.company.updateMany({
      where: {
        slug: 'fpt-software',
      },
      data: {
        logoUrl: '/FPT_Software_logo.svg.png',
      },
    });
    console.log('FPT Software logo updated.');

    console.log('2. Replacing TechCorp Vietnam with Viettel Group...');
    // Find TechCorp Vietnam by slug
    const techcorp = await prisma.company.findUnique({
      where: { slug: 'techcorp-vn' },
    });

    if (techcorp) {
      // Update its name, slug, and logoUrl
      await prisma.company.update({
        where: { id: techcorp.id },
        data: {
          name: 'Tập đoàn Công nghiệp - Viễn thông Quân đội (Viettel)',
          slug: 'viettel-group',
          logoUrl: 'https://cdn-new.topcv.vn/unsafe/https%3A//static.topcv.vn/company_logos/tap-doan-cong-nghiep-vien-thong-quan-doi-viettel-600003b62b9a1.jpg',
        },
      });
      console.log('Successfully replaced TechCorp Vietnam with Viettel Group.');
    } else {
      console.log('TechCorp Vietnam not found by slug. Let\'s check if viettel-group already exists or create/update it.');
      // Fallback: upsert Viettel Group
      await prisma.company.upsert({
        where: { slug: 'viettel-group' },
        update: {
          name: 'Tập đoàn Công nghiệp - Viễn thông Quân đội (Viettel)',
          logoUrl: 'https://cdn-new.topcv.vn/unsafe/https%3A//static.topcv.vn/company_logos/tap-doan-cong-nghiep-vien-thong-quan-doi-viettel-600003b62b9a1.jpg',
        },
        create: {
          name: 'Tập đoàn Công nghiệp - Viễn thông Quân đội (Viettel)',
          slug: 'viettel-group',
          logoUrl: 'https://cdn-new.topcv.vn/unsafe/https%3A//static.topcv.vn/company_logos/tap-doan-cong-nghiep-vien-thong-quan-doi-viettel-600003b62b9a1.jpg',
          isTrusted: true,
        },
      });
    }

  } catch (e) {
    console.error('Error running fix script:', e);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main();
