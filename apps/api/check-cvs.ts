import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load env variables
dotenv.config({ path: path.join(__dirname, '.env') });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const user = await prisma.user.findFirst({
    where: { email: 'dphuongnam2k5@gmail.com' },
    include: {
      candidates: {
        include: {
          cvs: {
            orderBy: { createdAt: 'desc' }
          }
        }
      }
    }
  });

  if (!user) {
    console.log('User dphuongnam2k5@gmail.com not found');
    return;
  }

  console.log('User found:', user.email);
  const candidate = user.candidates[0];
  if (!candidate) {
    console.log('No candidate profile found for user');
    return;
  }

  console.log(`Candidate profile ID: ${candidate.id}`);
  console.log(`Total CVs: ${candidate.cvs.length}`);
  
  for (const cv of candidate.cvs) {
    console.log(`- ID: ${cv.id}`);
    console.log(`  FileName: ${cv.fileName}`);
    console.log(`  FileSize: ${cv.fileSize}`);
    console.log(`  MimeType: ${cv.mimeType}`);
    console.log(`  Source: ${cv.source}`);
    console.log(`  DeletedAt: ${cv.deletedAt}`);
    console.log(`  CreatedAt: ${cv.createdAt}`);
  }
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
