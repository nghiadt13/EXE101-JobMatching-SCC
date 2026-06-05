import { DocumentTextExtractorService } from './src/documents/services/document-text-extractor.service';
import * as fs from 'fs';
import * as path from 'path';

async function main() {
  const filePath = path.join(__dirname, 'uploads/cvs/cmq0gaw120001bojitmyed79e/1780648518683-6978f3a9-2c1d-4725-9f26-4bef7d6235f7.pdf');
  console.log('Reading file:', filePath);
  
  if (!fs.existsSync(filePath)) {
    console.error('File does not exist!');
    return;
  }
  
  const buffer = fs.readFileSync(filePath);
  const mockFile = {
    buffer,
    mimetype: 'application/pdf',
    originalname: 'test.pdf',
    fieldname: 'file',
    encoding: '7bit',
    size: buffer.length,
    stream: null as any,
    destination: '',
    filename: '',
    path: '',
  };

  const service = new DocumentTextExtractorService();
  try {
    const text = await service.extract(mockFile);
    console.log('Extraction success! Text length:', text.length);
    console.log('Sample text:', text.substring(0, 500));
  } catch (error: any) {
    console.error('Extraction failed:', error);
    if (error.response) {
      console.error('Error response:', error.response);
    }
  }
}

main();
