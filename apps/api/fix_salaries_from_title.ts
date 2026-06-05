import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
dotenv.config();

const connectionString = process.env['DATABASE_URL'] ?? 'postgresql://postgres:postgres@localhost:5432/postgres';
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

async function main() {
  const jobs = await prisma.job.findMany({ select: { id: true, title: true }});
  
  let updatedCount = 0;
  for (const job of jobs) {
    let min: number | null = null;
    let max: number | null = null;
    
    const title = job.title.toLowerCase();
    
    // Pattern 1: A - B Triệu (e.g. 12-18 Triệu, 10 - 15 triệu)
    const rangeMatch = title.match(/(\d+)\s*-\s*(\d+)\s*triệu/i);
    if (rangeMatch) {
      min = parseInt(rangeMatch[1]) * 1_000_000;
      max = parseInt(rangeMatch[2]) * 1_000_000;
    } else {
      // Pattern 2: Upto X Triệu or Tối đa X Triệu (e.g. Upto 25 Triệu, Tối đa 30 Triệu)
      const uptoMatch = title.match(/(?:upto|lên đến|tối đa)\s*(\d+)\s*triệu/i);
      if (uptoMatch) {
        max = parseInt(uptoMatch[1]) * 1_000_000;
        // Keep min null for "upto" jobs
      } else {
        // Pattern 3: Từ X Triệu
        const fromMatch = title.match(/từ\s*(\d+)\s*triệu/i);
        if (fromMatch) {
          min = parseInt(fromMatch[1]) * 1_000_000;
        }
      }
    }

    if (min !== null || max !== null) {
      await prisma.job.update({
        where: { id: job.id },
        data: { salaryMin: min, salaryMax: max, salaryNegotiable: false }
      });
      console.log(`Updated job [${job.title}] -> Min: ${min}, Max: ${max}`);
      updatedCount++;
    }
  }
  
  console.log(`Successfully extracted and updated salaries for ${updatedCount} jobs.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
