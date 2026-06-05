import * as fs from 'fs';

async function main() {
  // Try logging in as candidate
  console.log('Logging in...');
  const loginRes = await fetch('http://localhost:3001/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'dphuongnam2k5@gmail.com', password: 'namngo001' })
  });
  
  if (!loginRes.ok) {
    console.error('Login failed:', await loginRes.text());
    return;
  }
  
  const loginData = await loginRes.json();
  const token = loginData.accessToken;
  console.log('Login success. Access token obtained.');

  // Prepare file upload
  const pdfPath = 'f:\\Work_Space\\Project\\SCC\\EXE101-JobMatching-SCC\\apps\\api\\uploads\\cvs\\cmq0gaw120001bojitmyed79e\\1780648518683-6978f3a9-2c1d-4725-9f26-4bef7d6235f7.pdf';
  if (!fs.existsSync(pdfPath)) {
    console.error('PDF file not found at:', pdfPath);
    return;
  }

  const fileBuffer = fs.readFileSync(pdfPath);
  const blob = new Blob([fileBuffer], { type: 'application/pdf' });
  
  const formData = new FormData();
  formData.append('file', blob, 'cv_test.pdf');

  console.log('Uploading CV to http://localhost:3001/api/cvs/upload ...');
  const uploadRes = await fetch('http://localhost:3001/api/cvs/upload', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`
    },
    body: formData
  });

  console.log('Response Status:', uploadRes.status);
  const responseText = await uploadRes.text();
  console.log('Response Body:', responseText);
}

main().catch(console.error);
