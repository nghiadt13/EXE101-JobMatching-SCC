import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
dotenv.config();

const connectionString = process.env['DATABASE_URL'] ?? 'postgresql://postgres:postgres@localhost:5432/postgres';
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

async function main() {
  const categories = await prisma.jobCategory.findMany();
  const jobs = await prisma.job.findMany({ select: { id: true, title: true }});
  
  await prisma.jobCategoryOnJob.deleteMany({});
  console.log('Cleared existing job category mappings.');

  let mappedCount = 0;
  for (const job of jobs) {
    const title = job.title.toLowerCase();
    let mappedCategory = categories[0]; // fallback to first (IT)
    
    if (title.includes('sales') || title.includes('kinh doanh') || title.includes('bán hàng') || title.includes('telesales')) {
      mappedCategory = categories.find(c => c.slug === 'sales-ban-hang') || mappedCategory;
    } else if (title.includes('marketing') || title.includes('truyền thông') || title.includes('content') || title.includes('seo') || title.includes('pr') || title.includes('social')) {
      mappedCategory = categories.find(c => c.slug === 'marketing') || mappedCategory;
    } else if (title.includes('tài chính') || title.includes('ngân hàng') || title.includes('tín dụng')) {
      mappedCategory = categories.find(c => c.slug === 'ngan-hang-tai-chinh') || mappedCategory;
    } else if (title.includes('bất động sản') || title.includes('nhà phố') || title.includes('môi giới')) {
      mappedCategory = categories.find(c => c.slug === 'bat-dong-san') || mappedCategory;
    } else if (title.includes('ô tô') || title.includes('cơ khí')) {
      mappedCategory = categories.find(c => c.slug === 'co-khi-ky-thuat') || mappedCategory;
    } else if (title.includes('logistics') || title.includes('cung ứng')) {
      mappedCategory = categories.find(c => c.slug === 'logistics-xnk') || mappedCategory;
    } else if (title.includes('nhân sự') || title.includes('hr')) {
      mappedCategory = categories.find(c => c.slug === 'nhan-su') || mappedCategory;
    } else if (title.includes('kế toán') || title.includes('kiểm toán')) {
      mappedCategory = categories.find(c => c.slug === 'ke-toan-kiem-toan') || mappedCategory;
    }

    await prisma.jobCategoryOnJob.create({
      data: {
        jobId: job.id,
        categoryId: mappedCategory.id
      }
    });
    mappedCount++;
  }
  
  console.log(`Successfully mapped ${mappedCount} jobs to their respective categories.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
