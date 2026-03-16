const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  const users = await p.user.findMany({
    where: { role: 'CANDIDATE' },
    select: { id: true, email: true, name: true, planName: true },
  });
  console.log('=== CANDIDATE USERS ===');
  users.forEach(u => console.log(`  ${u.email} | plan: ${u.planName}`));

  const cvs = await p.cV.findMany({
    where: { deletedAt: null },
    select: { id: true, fileName: true, candidateId: true },
  });
  console.log('\n=== CVs ===');
  cvs.forEach(c => console.log(`  ${c.id} | ${c.fileName}`));

  const jobs = await p.job.count({ where: { status: 'PUBLISHED', deletedAt: null } });
  console.log(`\n=== Published Jobs: ${jobs} ===`);

  await p['$disconnect']();
}

main().catch(console.error);
