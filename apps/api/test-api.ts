import { config } from 'dotenv';
config();
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const apps = await prisma.application.findMany({ take: 5, select: { id: true, status: true, candidateId: true } });
  console.log('Apps:', apps);
}
main().finally(() => prisma.$disconnect());
