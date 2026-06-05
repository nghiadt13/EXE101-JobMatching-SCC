import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { CvsService } from './src/cvs/cvs.service';
import { PrismaService } from './src/prisma/prisma.service';
import * as fs from 'fs';
import * as path from 'path';

async function main() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const cvsService = app.get(CvsService);
  const prisma = app.get(PrismaService);

  // Get a candidate from the DB to test with
  const candidate = await prisma.candidate.findFirst({
    include: { user: true }
  });

  if (!candidate) {
    console.error('No candidate found in the database!');
    await app.close();
    return;
  }

  console.log(`Testing upload for candidate: ${candidate.id} (User: ${candidate.userId})`);

  const filePath = path.join(__dirname, 'uploads/cvs/cmq0gaw120001bojitmyed79e/1780648518683-6978f3a9-2c1d-4725-9f26-4bef7d6235f7.pdf');
  if (!fs.existsSync(filePath)) {
    console.error('Test PDF file does not exist at:', filePath);
    await app.close();
    return;
  }

  const buffer = fs.readFileSync(filePath);
  const mockFile = {
    fieldname: 'file',
    originalname: 'test_upload_cv.pdf',
    encoding: '7bit',
    mimetype: 'application/pdf',
    buffer: buffer,
    size: buffer.length,
    stream: null as any,
    destination: '',
    filename: '',
    path: '',
  };

  try {
    const result = await cvsService.upload(candidate.userId, mockFile);
    console.log('CV Upload Service Success:', result);
  } catch (error: any) {
    console.error('CV Upload Service Failed!');
    console.error(error);
    if (error.response) {
      console.error('Error Response Details:', JSON.stringify(error.response, null, 2));
    }
  } finally {
    await app.close();
  }
}

main().catch(console.error);
