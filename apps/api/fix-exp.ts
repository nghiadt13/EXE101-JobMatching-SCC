import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

const connectionString = process.env['DATABASE_URL'] ?? 'postgresql://postgres:postgres@localhost:5432/postgres';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString })
});

async function main() {
  const jobs = await prisma.job.findMany({
    where: {
      experienceLevel: { in: ['junior', 'mid', 'senior'] }
    }
  });

  console.log(`Found ${jobs.length} jobs with invalid experience levels.`);

  for (const job of jobs) {
    let newLevel = '1';
    if (job.experienceLevel === 'mid') newLevel = '2';
    if (job.experienceLevel === 'senior') newLevel = '3';
    
    await prisma.job.update({
      where: { id: job.id },
      data: { experienceLevel: newLevel }
    });
    console.log(`Updated job [${job.title}] from ${job.experienceLevel} to ${newLevel}`);
  }

  console.log('Fixed invalid experience levels!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
