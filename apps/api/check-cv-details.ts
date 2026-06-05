import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '.env') });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const cv = await prisma.cV.findUnique({
    where: { id: 'cmq0ok3q40000r8jio9kectlo' }
  });

  if (!cv) {
    console.log('CV cmq0o5icd0001s4jisu6jo3pa not found');
    return;
  }

  console.log('CV Detail:');
  console.log(`ID: ${cv.id}`);
  console.log(`FileName: ${cv.fileName}`);
  console.log(`FileSize: ${cv.fileSize}`);
  console.log(`MimeType: ${cv.mimeType}`);
  console.log(`Source: ${cv.source}`);
  console.log(`IsPrimary: ${cv.isPrimary}`);
  console.log('ParsedData:', JSON.stringify(cv.parsedData, null, 2));
  console.log('Skills:', JSON.stringify(cv.skills, null, 2));
  console.log('CandidateProfile:', JSON.stringify(cv.candidateProfile, null, 2));
  console.log(`RawText Length: ${cv.rawText?.length ?? 0}`);
  console.log('RawText Sample:', cv.rawText?.substring(0, 500));
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
