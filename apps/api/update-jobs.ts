import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

const connectionString = process.env['DATABASE_URL'] ?? 'postgresql://postgres:postgres@localhost:5432/postgres';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString })
});

async function main() {
  const jobs = await prisma.job.findMany();
  console.log(`Found ${jobs.length} jobs.`);

  const jobLevels = ['staff', 'leader', 'manager', 'director', 'intern', 'vice_president', 'branch_manager'];
  const workingDayStatuses = ['saturday_working', 'saturday_off', 'not_mentioned'];
  const employmentTypes = ['Full-time', 'Part-time', 'Contract', 'Freelance'];

  for (const job of jobs) {
    const randomJobLevel = jobLevels[Math.floor(Math.random() * jobLevels.length)];
    const randomWorkingDay = workingDayStatuses[Math.floor(Math.random() * workingDayStatuses.length)];
    const randomEmployment = employmentTypes[Math.floor(Math.random() * employmentTypes.length)];

    await prisma.job.update({
      where: { id: job.id },
      data: {
        jobLevel: job.jobLevel || randomJobLevel,
        workingDayStatus: job.workingDayStatus || randomWorkingDay,
        employmentType: job.employmentType === 'Full-time' || job.employmentType === 'Part-time' ? job.employmentType : randomEmployment,
      }
    });
  }

  console.log('Updated all jobs with jobLevel, workingDayStatus, and employmentType');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
