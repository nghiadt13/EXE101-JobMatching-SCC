const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/postgres';
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const cvs = await prisma.cV.findMany({
    select: { id: true, source: true, fileName: true, mimeType: true }
  });
  console.log('CVs in database:', cvs);
}
main().catch(console.error).finally(() => {
  prisma.$disconnect();
  pool.end();
});
