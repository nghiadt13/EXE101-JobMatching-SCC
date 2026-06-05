require('dotenv').config({ path: '.env.local' });
import { getApplications } from './lib/applications-client';

async function main() {
  // get token for recruiter1@test.com
  const response = await fetch('http://localhost:3001/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'recruiter1@test.com', password: 'password123' })
  });
  const data = await response.json();
  const token = data.accessToken;
  
  if (!token) {
    console.log('Login failed', data);
    return;
  }

  const apps = await getApplications(token, { limit: 1 });
  console.log(JSON.stringify(apps.items[0].cv, null, 2));
}

main().catch(console.error);
