require("dotenv").config();
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import bcrypt from 'bcrypt';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const hrUser = await prisma.user.findFirst({ where: { role: 'RECRUITER' } });
  if (!hrUser) {
    console.log("NO HR USER FOUND.");
    return;
  }
  
  // reset password for hrUser
  const newPassword = await bcrypt.hash('hr123456', 10);
  await prisma.user.update({
    where: { id: hrUser.id },
    data: { password: newPassword }
  });

  const job = await prisma.job.findFirst({ where: { recruiterId: hrUser.id } });
  if (!job) {
    console.log(`HR user ${hrUser.email} has no jobs! Cannot create application.`);
    return;
  }

  const candidate = await prisma.candidate.findFirst({
    where: { user: { email: 'dphuongnam2k5@gmail.com' } }
  });
  const cv = await prisma.cV.findFirst({ where: { candidateId: candidate!.id } });

  // Check if application already exists
  const existingApp = await prisma.application.findFirst({
    where: { jobId: job.id, candidateId: candidate!.id }
  });

  if (!existingApp) {
    await prisma.application.create({
      data: {
        jobId: job.id,
        candidateId: candidate!.id,
        cvId: cv!.id,
        status: 'APPLIED',
        matchScore: 92
      }
    });
    console.log(`Created new Application!`);
  } else {
    console.log(`Application already existed.`);
  }

  console.log(`HR Email: ${hrUser.email}`);
  console.log(`Password: hr123456`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
