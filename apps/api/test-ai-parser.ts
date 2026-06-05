import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { CvAiParserService } from './src/cvs/services/cv-ai-parser.service';

async function main() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const parserService = app.get(CvAiParserService);

  const sampleText = `
  ĐẶNG PHƯƠNG NAM
  Sinh viên năm 3 chuyên ngành Hệ thống thông tin - Đại học Quốc gia.
  SĐT: 0947274123
  Email: dphuongnam2k5@gmail.com
  Kỹ năng: Java, SQL, Python, Giao tiếp nhóm.
  Học vấn:
  Đại học Quốc gia Hà Nội - Chuyên ngành HTTT (GPA: 3.2/4)
  Kinh nghiệm:
  Thực tập sinh BA tại Công ty XYZ (06/2025 - Nay)
  - Khảo sát yêu cầu người dùng, viết tài liệu SRS.
  `;

  console.log('Running CV AI Parser on sample text...');
  try {
    const start = Date.now();
    const result = await parserService.parse(sampleText);
    console.log(`AI Parser Success! Time: ${Date.now() - start}ms`);
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('AI Parser Failed:', error);
  } finally {
    await app.close();
  }
}

main().catch(console.error);
