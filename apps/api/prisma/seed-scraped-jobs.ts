require("dotenv").config();
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  console.log('Reading scraped jobs...');
  const filePath = path.join(__dirname, '../../../scraped_jobs.json');
  let data;
  try {
    data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch(e) {
    console.error("Failed to read scraped_jobs.json", e);
    return;
  }

  function generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '') + '-' + Math.random().toString(36).substring(2, 8);
  }

  console.log(`Found ${data.length} jobs. Finding a recruiter user...`);
  
  let user = await prisma.user.findFirst({
    where: { role: 'RECRUITER' }
  });
  
  if (!user) {
    user = await prisma.user.findFirst();
  }
  
  if (!user) {
    console.log("No users found. Creating a dummy RECRUITER...");
    user = await prisma.user.create({
      data: {
        email: "dummy_recruiter@example.com",
        password: "hashed_password",
        name: "Dummy Recruiter",
        role: "RECRUITER"
      }
    });
  }

  console.log(`Using user ${user.id} (${user.email}) as recruiter.`);

  for (const item of data) {
    try {
      await prisma.job.create({
        data: {
          title: item.title,
          slug: generateSlug(item.title),
          description: `${item.title} tại ${item.company}. Khu vực: ${item.location}. Lĩnh vực: ${item.domain}. Đây là tin đăng mô phỏng lấy từ dữ liệu cào để demo hệ thống RAG và Matching cho khối kinh tế, thương mại.`,
          skills: [item.domain, 'Sales', 'Marketing', 'Business', 'Communication'],
          location: {
            city: item.location,
            country: 'Vietnam'
          },
          employmentType: 'FULL_TIME',
          status: 'PUBLISHED',
          recruiterId: user.id,
        }
      });
      console.log(`Inserted Job: ${item.title}`);
    } catch (e) {
      console.error(`Failed to insert ${item.title}:`, e);
    }
  }

  console.log('Successfully inserted all scraped jobs!');
  console.log('Run `npx ts-node prisma/sync-vectors.ts` next to generate embeddings for these new jobs.');
  await prisma.$disconnect();
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
