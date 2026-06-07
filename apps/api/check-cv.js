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
  const job = await prisma.job.findUnique({
    where: { id: 'cmq0hlajs000ic4ji054y8esv' },
    select: { recruiterId: true }
  });
  console.log('Job recruiterId:', job);
  const users = await prisma.user.findMany({
    select: { id: true, email: true, role: true }
  });
  console.log('All Users:', users);
}
main().catch(console.error).finally(() => {
  prisma.$disconnect();
  pool.end();
});
