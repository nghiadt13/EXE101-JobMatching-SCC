import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

const connectionString = process.env['DATABASE_URL'] ?? 'postgresql://postgres:postgres@localhost:5432/postgres';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString })
});

function inferExperienceLevel(title: string): string {
  const t = title.toLowerCase();
  
  if (t.includes('thực tập') || t.includes('intern') || t.includes('fresher') || t.includes('chưa có kinh nghiệm')) {
    return 'no_required';
  }
  
  // Attempt to parse explicit numbers like "1 năm", "2 năm"
  const match = t.match(/(\d+)\s*năm/);
  if (match) {
    const years = parseInt(match[1]);
    if (years === 1) return '1';
    if (years === 2) return '2';
    if (years === 3) return '3';
    if (years === 4) return '4';
    if (years >= 5) return 'over_5';
  }
  
  if (t.includes('senior') || t.includes('trưởng phòng') || t.includes('quản lý') || t.includes('giám đốc')) {
    return '3'; // Just assigning 3 years roughly
  }
  
  if (t.includes('nhân viên') || t.includes('chuyên viên')) {
    return '1'; // Default 1 year for normal staff
  }

  // fallback randomly or pick a safe default
  const levels = ['no_required', 'under_1', '1', '2', '3', '4', '5', 'over_5'];
  return levels[Math.floor(Math.random() * 4)]; // Pick between no_required and 2
}

async function main() {
  const jobs = await prisma.job.findMany();
  console.log(`Found ${jobs.length} jobs.`);

  for (const job of jobs) {
    if (!job.experienceLevel) {
      const inferredExp = inferExperienceLevel(job.title);
      await prisma.job.update({
        where: { id: job.id },
        data: { experienceLevel: inferredExp }
      });
      console.log(`Updated job [${job.title}] Experience -> ${inferredExp}`);
    }
  }

  console.log('Successfully updated experience levels!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
