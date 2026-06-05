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
  const cvs = await prisma.cV.findMany({
    orderBy: { createdAt: 'desc' },
    take: 20,
    include: {
      candidate: {
        include: {
          user: true
        }
      }
    }
  });

  console.log(`Total recent CVs: ${cvs.length}`);
  for (const cv of cvs) {
    console.log(`- ID: ${cv.id}`);
    console.log(`  User: ${cv.candidate?.user?.email ?? 'Unknown'}`);
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
