require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');

async function main() {
  const prisma = new PrismaClient();
  const user = await prisma.user.findFirst({ where: { email: 'recruiter1@test.com' } });
  
  const token = jwt.sign(
    { sub: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET || 'fallback-secret',
    { expiresIn: '1h' }
  );

  const res = await fetch("http://localhost:3001/api/applications?page=1&limit=10", {
    headers: {
      "Authorization": `Bearer ${token}`
    }
  });
  const data = await res.json();
  if (data.items && data.items.length > 0) {
    console.log("FIRST CV (from API):");
    console.log(JSON.stringify(data.items[0].cv, null, 2));
    
    // Check if Do Phuong Nam is here
    const dphuongnam = data.items.find(i => i.candidate.name === 'Đỗ Phương Nam');
    if (dphuongnam) {
      console.log("DO PHUONG NAM CV (from API):");
      console.log(JSON.stringify(dphuongnam.cv, null, 2));
    }
  } else {
    console.log("No items", data);
  }
}

main().catch(console.error);
