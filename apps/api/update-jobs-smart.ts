import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

const connectionString = process.env['DATABASE_URL'] ?? 'postgresql://postgres:postgres@localhost:5432/postgres';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString })
});

function inferJobLevel(title: string, experience: string | null, salaryMin: number | null, salaryMax: number | null): string {
  const t = title.toLowerCase();
  
  // 1. Intern
  if (t.includes('thực tập') || t.includes('intern') || t.includes('fresher')) {
    return 'intern';
  }
  
  // 2. Director / Vice President
  if (t.includes('giám đốc') || t.includes('director') || t.includes('cfo') || t.includes('ceo') || t.includes('cto') || t.includes('head of')) {
    return 'director';
  }
  if (t.includes('phó phòng') || t.includes('vice president') || t.includes('vp')) {
    return 'vice_president';
  }
  if (t.includes('trưởng phòng')) {
    return 'manager';
  }
  
  // 3. Branch Manager
  if (t.includes('trưởng chi nhánh') || t.includes('branch manager')) {
    return 'branch_manager';
  }
  
  // 4. Manager
  if (t.includes('quản lý') || t.includes('giám sát') || t.includes('manager') || t.includes('supervisor') || t.includes('trưởng nhóm')) {
    if (t.includes('trưởng nhóm') || t.includes('leader')) {
      return 'leader';
    }
    return 'manager';
  }
  
  // 5. Leader
  if (t.includes('leader') || t.includes('trưởng nhóm') || t.includes('lead')) {
    return 'leader';
  }
  
  // 6. Fallback based on experience & salary
  let score = 0;
  if (experience) {
    if (experience === 'no_required' || experience === 'under_1') score += 0;
    else if (experience === '1' || experience === '2') score += 1;
    else if (experience === '3' || experience === '4') score += 3;
    else if (experience === '5' || experience === 'over_5') score += 5;
  }
  
  if (salaryMax) {
    if (salaryMax <= 10_000_000) score += 0;
    else if (salaryMax <= 20_000_000) score += 1;
    else if (salaryMax <= 40_000_000) score += 3;
    else score += 5;
  } else if (salaryMin) {
    if (salaryMin >= 30_000_000) score += 4;
    else if (salaryMin >= 15_000_000) score += 2;
  }
  
  if (score >= 8) return 'director';
  if (score >= 6) return 'manager';
  if (score >= 4) return 'leader';
  if (score === 0 && (t.includes('nhân viên') || t.includes('chuyên viên'))) return 'staff';
  
  // Default for normal staff
  return 'staff';
}

function inferEmploymentType(title: string): string {
  const t = title.toLowerCase();
  if (t.includes('part-time') || t.includes('parttime') || t.includes('bán thời gian')) return 'Part-time';
  if (t.includes('freelance') || t.includes('ctv') || t.includes('cộng tác viên')) return 'Freelance';
  if (t.includes('thực tập') || t.includes('intern')) return 'Part-time';
  return 'Full-time';
}

async function main() {
  const jobs = await prisma.job.findMany();
  console.log(`Found ${jobs.length} jobs.`);

  for (const job of jobs) {
    const inferredLevel = inferJobLevel(job.title, job.experienceLevel, job.salaryMin, job.salaryMax);
    const inferredEmploymentType = inferEmploymentType(job.title);
    
    await prisma.job.update({
      where: { id: job.id },
      data: {
        jobLevel: inferredLevel,
        employmentType: inferredEmploymentType,
      }
    });
    
    console.log(`Updated job [${job.title}]: Level -> ${inferredLevel}, EmpType -> ${inferredEmploymentType}`);
  }

  console.log('Successfully intelligently updated job levels and employment types!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
