require('dotenv').config();
const jwt = require('jsonwebtoken');

async function main() {
  const token = jwt.sign(
    { sub: 'cmq0iie7l0000c0jibmr6ng43', email: 'recruiter1@test.com', role: 'RECRUITER' },
    process.env.JWT_SECRET || 'fallback-secret',
    { expiresIn: '1h' }
  );

  const res = await fetch("http://localhost:3001/api/applications?page=1&limit=50", {
    headers: {
      "Authorization": `Bearer ${token}`
    }
  });
  const data = await res.json();
  if (data.items && data.items.length > 0) {
    console.log("FIRST CV (from Recruiter view):");
    console.log(JSON.stringify(data.items[0].cv, null, 2));
  } else {
    console.log("No items", data);
  }
}

main().catch(console.error);
