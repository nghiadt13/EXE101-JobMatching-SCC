import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Tìm các ứng viên tên Đỗ Phương Nam...");
  
  // Xóa toàn bộ applications TRỪ các application của Đỗ Phương Nam nộp vào vị trí BA
  const applications = await prisma.application.findMany({
    include: {
      candidate: { include: { user: true } },
      job: true
    }
  });

  let deletedCount = 0;
  for (const app of applications) {
    const isNam = app.candidate.user.name.includes("Đỗ Phương Nam");
    const isBAJob = app.job.title.toLowerCase().includes("business analyst") || app.job.title.toLowerCase().includes("ba");
    
    // Giữ lại nếu là Nam và apply job BA
    if (isNam && isBAJob) {
      console.log(`[GIỮ LẠI] Application ID: ${app.id} | ${app.candidate.user.name} -> ${app.job.title}`);
    } else {
      console.log(`[XÓA] Application ID: ${app.id} | ${app.candidate.user.name} -> ${app.job.title}`);
      await prisma.application.delete({
        where: { id: app.id }
      });
      deletedCount++;
    }
  }

  console.log(`\nĐã xóa thành công ${deletedCount} applications!`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
