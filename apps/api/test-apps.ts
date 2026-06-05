require("dotenv").config();
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

import jwt from 'jsonwebtoken';

async function main() {
  const user = await prisma.user.findFirst({ where: { email: 'recruiter1@test.com' } });
  
  const token = jwt.sign(
    { sub: user!.id, email: user!.email, role: user!.role },
    process.env.JWT_SECRET || 'fallback-secret',
    { expiresIn: '1h' }
  );

  const res = await fetch("http://localhost:3001/api/applications?page=1&limit=50", {
    headers: { "Authorization": `Bearer ${token}` }
  });
  const data = await res.json();
  console.log("FROM API:");
  const nam = data.items?.find((i: any) => i.candidate.name === 'Đỗ Phương Nam');
  console.log(JSON.stringify(nam?.cv, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
