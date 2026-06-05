async function main() {
  const response = await fetch('http://localhost:3001/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'recruiter1@test.com', password: 'hr123456' })
  });
  const data = await response.json();
  const token = data.accessToken;
  
  if (!token) {
    console.log('Login failed', data);
    return;
  }

  const appsRes = await fetch('http://localhost:3001/api/applications?limit=5', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const apps = await appsRes.json();
  console.log(JSON.stringify(apps.items.map(i => i.cv), null, 2));
}

main().catch(console.error);
