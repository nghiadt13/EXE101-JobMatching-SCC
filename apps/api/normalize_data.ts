import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
dotenv.config();

const connectionString = process.env['DATABASE_URL'] ?? 'postgresql://postgres:postgres@localhost:5432/postgres';
const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

async function main() {
  const types = await prisma.job.findMany({ select: { employmentType: true }, distinct: ['employmentType'] });
  console.log('Distinct Employment Types:', JSON.stringify(types, null, 2));

  // Update jobs with null salaries to some mock values
  const jobsWithoutSalary = await prisma.job.findMany({
    where: { salaryMin: null, salaryMax: null, salaryNegotiable: false }
  });
  
  console.log(`Found ${jobsWithoutSalary.length} jobs with null salaries and not negotiable.`);
  
  let updatedCount = 0;
  for (const job of jobsWithoutSalary) {
    // assign random salary between 10M and 30M
    const min = Math.floor(Math.random() * 15 + 10) * 1_000_000;
    const max = min + Math.floor(Math.random() * 10 + 5) * 1_000_000;
    
    await prisma.job.update({
      where: { id: job.id },
      data: { salaryMin: min, salaryMax: max }
    });
    updatedCount++;
  }
  console.log(`Updated ${updatedCount} jobs with mock salaries.`);

  // Normalize employment types
  const allJobs = await prisma.job.findMany({ select: { id: true, employmentType: true }});
  let normalizedCount = 0;
  for (const job of allJobs) {
    if (!job.employmentType) continue;
    let normalized = job.employmentType;
    const lower = job.employmentType.toLowerCase().replace('_', '-');
    
    if (lower.includes('full')) normalized = 'Full-time';
    else if (lower.includes('part')) normalized = 'Part-time';
    else if (lower.includes('intern')) normalized = 'Thực tập';
    else if (lower.includes('contract')) normalized = 'Hợp đồng';
    else if (lower.includes('freelance')) normalized = 'Freelance';
    else normalized = 'Full-time'; // default fallback if garbage

    if (normalized !== job.employmentType) {
      await prisma.job.update({
        where: { id: job.id },
        data: { employmentType: normalized }
      });
      normalizedCount++;
    }
  }
  console.log(`Normalized ${normalizedCount} employment types.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
