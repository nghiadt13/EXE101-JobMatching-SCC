require("dotenv").config();
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const cvs = await prisma.cV.findMany({
    select: { id: true, source: true, fileName: true, mimeType: true }
  });
  console.log('CVs in database:', cvs);
}

main().catch(console.error).finally(() => prisma.$disconnect());
