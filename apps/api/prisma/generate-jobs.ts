require('dotenv').config();
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import OpenAI from 'openai';
import * as fs from 'fs';
import * as path from 'path';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const deepseek = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: process.env.DEEPSEEK_BASE_URL ?? 'https://api.deepseek.com',
  timeout: 120000,
});

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '') + '-' + Math.random().toString(36).substring(2, 8);
}

async function generateBatch(sampleData: string, batchIndex: number, fields: string): Promise<any[]> {
  const prompt = `Bạn là một chuyên gia tuyển dụng (HR). Dưới đây là 5 mẫu tin tuyển dụng thực tế với văn phong, cấu trúc rất chi tiết:
  
${sampleData}

Nhiệm vụ của bạn là dựa trên cấu trúc, độ chi tiết và độ chân thực của các mẫu trên, hãy tạo ra 5 tin tuyển dụng HOÀN TOÀN MỚI, KHÁC NHAU.
Lĩnh vực yêu cầu cho batch này: ${fields}.

Yêu cầu output:
- PHẢI trả về ĐÚNG định dạng JSON array, KHÔNG CÓ markdown code blocks (\`\`\`json).
- JSON là một mảng gồm 5 objects, mỗi object có các key sau:
  - "title": Tiêu đề công việc (ví dụ: "Chuyên Viên Marketing - Thu Nhập 20 Triệu").
  - "company": Tên công ty (bịa ra tên công ty thực tế và chuyên nghiệp).
  - "location": Địa điểm (Hà Nội, Hồ Chí Minh, Đà Nẵng,...).
  - "domain": Lĩnh vực (VD: "Marketing", "Sales", "Finance", "HR", "Economics").
  - "skills": Mảng các kỹ năng liên quan (ví dụ: ["B2B", "Communication", "Marketing", "Sales"]). Mảng gồm 5-7 tags.
  - "description": Nội dung chi tiết của JD. ĐÂY LÀ PHẦN QUAN TRỌNG NHẤT. Bạn phải viết dài, chi tiết, chân thực như mẫu. Bao gồm đầy đủ 3 phần: "Mô tả công việc", "Yêu cầu ứng viên", "Quyền lợi", "Thu nhập". Hãy dùng \n để xuống dòng, định dạng gạch đầu dòng rõ ràng. KHÔNG ĐƯỢC để lộ đây là tin đăng giả.
`;

  console.log(`Generating batch ${batchIndex} for fields: ${fields}...`);
  const response = await deepseek.chat.completions.create({
    model: process.env.DEEPSEEK_MODEL ?? 'deepseek-chat',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.7,
  });

  let content = response.choices[0]?.message?.content?.trim() || '[]';
  // Loại bỏ markdown code block nếu có
  if (content.startsWith('```json')) {
    content = content.replace(/^```json/, '').replace(/```$/, '').trim();
  } else if (content.startsWith('```')) {
    content = content.replace(/^```/, '').replace(/```$/, '').trim();
  }

  try {
    return JSON.parse(content);
  } catch (e) {
    console.error(`Failed to parse JSON for batch ${batchIndex}. Content:`, content);
    return [];
  }
}

async function main() {
  const samplePath = path.join(__dirname, '../../../data.txt');
  const sampleData = fs.readFileSync(samplePath, 'utf-8');

  let user = await prisma.user.findFirst({ where: { role: 'RECRUITER' } });
  if (!user) {
    user = await prisma.user.findFirst();
  }
  
  if (!user) {
    console.log("No users found. Creating a dummy RECRUITER...");
    user = await prisma.user.create({
      data: {
        email: "dummy_recruiter@example.com",
        password: "hashed_password",
        name: "Dummy Recruiter",
        role: "RECRUITER"
      }
    });
  }

  const batches = [
    "Digital Marketing, SEO, Content",
    "B2B Sales, B2C Sales, Telesales",
    "Finance, Accounting, Cost Accounting",
    "Human Resources, Recruitment, Payroll",
    "Media, Public Relations, Event Management",
    "Real Estate Sales, Automotive Sales",
    "Business Analyst, Economics Researcher",
    "E-commerce, Livestream Sales, Trade Marketing",
    "Logistics Sales, Supply Chain Coordinator",
    "Bank Teller, Financial Advisor, Credit Officer",
  ]; // 10 batches * 5 = 50 jobs

  let allJobs: any[] = [];

  for (let i = 0; i < batches.length; i++) {
    const jobs = await generateBatch(sampleData, i + 1, batches[i]);
    allJobs = allJobs.concat(jobs);
  }

  console.log(`Successfully generated ${allJobs.length} jobs. Proceeding to insert...`);

  for (const item of allJobs) {
    try {
      await prisma.job.create({
        data: {
          title: item.title,
          slug: generateSlug(item.title),
          description: item.description,
          skills: item.skills || [item.domain],
          location: {
            city: item.location,
            country: 'Vietnam'
          },
          employmentType: 'FULL_TIME',
          status: 'PUBLISHED',
          recruiterId: user.id,
        }
      });
      console.log(`Inserted Job: ${item.title}`);
    } catch (e) {
      console.error(`Failed to insert ${item?.title}:`, e);
    }
  }

  console.log('Successfully inserted all generated jobs!');
  console.log('Run `npx ts-node prisma/sync-vectors.ts` next to generate embeddings for these new jobs.');
  await prisma.$disconnect();
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
