import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

const connectionString =
  process.env['DATABASE_URL'] ??
  'postgresql://postgres:postgres@localhost:5432/postgres';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

async function main() {
  console.log('=== RETRIEVING EXAMPLE DATA FOR INSPECTION ===\n');

  // 1. Get an example Job
  const job = await prisma.job.findFirst({
    where: { deletedAt: null },
    include: { category: true },
  });

  if (job) {
    console.log('--- RAW DATABASE JOB RECORD ---');
    console.log(`ID: ${job.id}`);
    console.log(`Title: ${job.title}`);
    console.log(`Skills: ${JSON.stringify(job.skills)}`);
    console.log(`Certifications: ${JSON.stringify(job.certifications)}`);
    console.log(`Short Description: ${job.shortDescription}`);
    console.log(`Description (truncated): ${job.description.slice(0, 300)}...\n`);

    // Format like VectorSyncService.syncJob
    const skillsArray = Array.isArray(job.skills) ? job.skills : [];
    const certificationsArray = Array.isArray(job.certifications) ? job.certifications : [];
    const textToEmbed = [
      job.category ? 'Industry/Category: ' + job.category.name : '',
      'Title: ' + job.title,
      'Description: ' +
        (job.shortDescription || job.description).slice(0, 1000),
      'Skills: ' + (skillsArray as string[]).join(', '),
      certificationsArray.length > 0
        ? 'Certifications: ' + (certificationsArray as string[]).join(', ')
        : '',
    ]
      .filter(Boolean)
      .join('. ');

    console.log('--- FORMATTED JOB TEXT TO BE EMBEDDED (BEFORE TOKENIZE) ---');
    console.log(textToEmbed);
    console.log('\n' + '='.repeat(50) + '\n');
  } else {
    console.log('⚠️ No Job records found in database.\n');
  }

  // 2. Get an example CV
  const cv = await prisma.cV.findFirst({
    where: { deletedAt: null },
  });

  if (cv) {
    console.log('--- RAW DATABASE CV RECORD ---');
    console.log(`ID: ${cv.id}`);
    console.log(`File Name: ${cv.fileName}`);
    console.log(`Skills: ${JSON.stringify(cv.skills)}`);
    
    const parsed =
      typeof cv.parsedData === 'object' && cv.parsedData !== null
        ? cv.parsedData
        : {};
    
    const normalizedProfile = (parsed as any).normalizedProfile || {};
    console.log(`Certifications (from parsedData): ${JSON.stringify(normalizedProfile.certifications)}`);
    console.log(`Summary: ${normalizedProfile.summary?.slice(0, 200)}...\n`);

    // Format like VectorSyncService.syncCv
    const title =
      normalizedProfile.title ||
      (parsed as any).title ||
      (parsed as any).headline ||
      '';
    const summary =
      normalizedProfile.summary || (parsed as any).summary || '';

    const skillsArray = Array.isArray(cv.skills) ? cv.skills : [];
    const certificationsArray =
      Array.isArray(normalizedProfile.certifications)
        ? normalizedProfile.certifications
        : Array.isArray((parsed as any).certifications)
          ? (parsed as any).certifications
          : [];

    const textToEmbed = [
      title ? 'Role: ' + title : '',
      summary ? 'Summary: ' + summary.slice(0, 1000) : '',
      'Skills: ' + (skillsArray as string[]).join(', '),
      certificationsArray.length > 0
        ? 'Certifications: ' + (certificationsArray as string[]).join(', ')
        : '',
    ]
      .filter(Boolean)
      .join('. ');

    console.log('--- FORMATTED CV TEXT TO BE EMBEDDED (BEFORE TOKENIZE) ---');
    console.log(textToEmbed);
    console.log('\n');
  } else {
    console.log('⚠️ No CV records found in database.\n');
  }

  await prisma.$disconnect();
}

main().catch(console.error);
