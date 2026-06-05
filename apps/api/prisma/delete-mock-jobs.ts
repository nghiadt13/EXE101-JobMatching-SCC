require("dotenv").config();
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const result = await prisma.job.deleteMany({
    where: {
      description: {
        contains: 'Đây là tin đăng mô phỏng lấy từ dữ liệu cào để demo'
      }
    }
  });
  console.log(`Deleted ${result.count} mock jobs.`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
