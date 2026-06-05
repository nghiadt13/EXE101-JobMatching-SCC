require("dotenv").config();
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import bcrypt from 'bcrypt';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const email = 'dphuongnam2k5@gmail.com';
  const password = await bcrypt.hash('namngo001', 10);

  let user = await prisma.user.findUnique({ where: { email } });
  
  if (user) {
    user = await prisma.user.update({
      where: { email },
      data: { password, name: 'Đỗ Phương Nam', role: 'CANDIDATE' }
    });
    console.log('User updated:', email);
  } else {
    user = await prisma.user.create({
      data: {
        email,
        password,
        name: 'Đỗ Phương Nam',
        role: 'CANDIDATE'
      }
    });
    console.log('User created:', email);
  }

  let candidate = await prisma.candidate.findUnique({ where: { userId: user.id } });
  if (!candidate) {
    candidate = await prisma.candidate.create({
      data: {
        userId: user.id,
        phone: '0987654321',
        bio: 'Chuyên Viên Phân Tích Kinh Doanh (BA) / Data Analyst'
      }
    });
  }

  await prisma.cV.deleteMany({ where: { candidateId: candidate.id } });

  const profileJson = {
    personal_info: {
      full_name: "Đỗ Phương Nam",
      email: "dphuongnam2k5@gmail.com",
      phone: "0987.654.321",
      location: "TP. Hồ Chí Minh",
      title: "Chuyên Viên Phân Tích Kinh Doanh (Business Analyst)"
    },
    summary: "Cử nhân Kinh tế xuất sắc với hơn 3 năm kinh nghiệm thực chiến trong lĩnh vực phân tích dữ liệu, tài chính và quy trình kinh doanh. Thế mạnh vượt trội trong việc sử dụng Power BI, SQL và mô hình hóa dữ liệu để cung cấp những hiểu biết sâu sắc (insights) giúp Ban giám đốc đưa ra các quyết định chiến lược. Từng trực tiếp tham gia xây dựng hệ thống báo cáo BI giúp tăng 25% hiệu suất vận hành tại doanh nghiệp quy mô lớn.",
    experience: [
      {
        company: "Tập Đoàn VNG (VNG Corporation)",
        role: "Senior Business Analyst",
        duration: "03/2022 - Hiện tại",
        description: "- Tham gia phân tích yêu cầu nghiệp vụ (Requirements Elicitation) từ các phòng ban Kinh doanh và Marketing.\n- Phân tích và xử lý tập dữ liệu lớn (Big Data) về hành vi người dùng, vẽ biểu đồ trực quan hóa dữ liệu bằng Power BI.\n- Đề xuất các chiến lược kinh doanh thông minh dựa trên dữ liệu thực tế, góp phần tăng 15% tỷ lệ giữ chân khách hàng (Retention Rate).\n- Quản lý và làm việc theo mô hình Agile/Scrum, kết nối hiệu quả giữa team Tech và team Business."
      },
      {
        company: "Công ty Cổ phần Chứng khoán SSI",
        role: "Chuyên viên Phân tích Tài chính (Financial Analyst)",
        duration: "09/2020 - 02/2022",
        description: "- Nghiên cứu và phân tích báo cáo tài chính của các công ty niêm yết trên sàn chứng khoán.\n- Xây dựng các mô hình định giá doanh nghiệp, dự báo dòng tiền (DCF).\n- Lập báo cáo vĩ mô định kỳ, phân tích biến động thị trường và đưa ra khuyến nghị đầu tư.\n- Cải tiến quy trình báo cáo tự động bằng Python, giảm 40% thời gian xử lý dữ liệu thủ công."
      }
    ],
    education: [
      {
        institution: "Đại học Kinh tế Quốc dân (NEU)",
        degree: "Cử nhân Xuất sắc Khoa Kinh tế Đầu tư",
        duration: "09/2016 - 06/2020",
        description: "GPA: 3.8/4.0. Đạt học bổng sinh viên xuất sắc 4 kỳ liên tiếp. Quán quân cuộc thi Phân Tích Kinh Doanh Trẻ 2019."
      }
    ],
    skills: [
      "Phân tích yêu cầu nghiệp vụ (BA)",
      "Data Analysis (SQL, Python)",
      "Data Visualization (Power BI, Tableau)",
      "Financial Modeling & Valuation",
      "Agile/Scrum",
      "BPMN, UML, ERD",
      "Giao tiếp & Thuyết trình chuyên nghiệp"
    ],
    certifications: [
      "Data Analyst Associate - Microsoft (2022)",
      "Chứng chỉ CFA Level 1 (2021)",
      "IELTS 7.5 (2020)"
    ],
    languages: [
      {
        language: "Tiếng Anh",
        proficiency: "Lưu loát"
      }
    ]
  };

  const rawText = `Đỗ Phương Nam\nChuyên viên Phân Tích Kinh Doanh (Business Analyst) / Phân Tích Dữ Liệu\nEmail: dphuongnam2k5@gmail.com | SĐT: 0987.654.321 | Vị trí: TP. Hồ Chí Minh\nTóm tắt: Hơn 3 năm kinh nghiệm trong lĩnh vực phân tích kinh doanh, tài chính và xử lý dữ liệu. Đam mê trong việc tối ưu hóa quy trình, đưa ra các báo cáo thông minh giúp định hướng chiến lược kinh doanh.\nKinh nghiệm:\n- BA tại VNG Corporation (2022-nay): Tối ưu hóa quy trình xử lý dữ liệu bán hàng, xây dựng dashboard quản trị.\n- Chuyên viên Phân tích tại SSI Securities (2020-2022): Lập mô hình tài chính, dự báo doanh thu.\nHọc vấn:\n- Cử nhân Kinh tế, Đại học Kinh tế Quốc dân (NEU) (2016-2020)\nKỹ năng: SQL, Python, Power BI, Tableau, BPMN, UML, Phân tích tài chính, Quản trị rủi ro.`;

  const cv = await prisma.cV.create({
    data: {
      candidateId: candidate.id,
      fileName: 'CV_Do_Phuong_Nam_BA.pdf',
      filePath: 'https://example.com/dummy-cv.pdf',
      fileSize: 1024000,
      mimeType: 'application/pdf',
      isPrimary: true,
      rawText: rawText,
      parsedData: profileJson,
      candidateProfile: profileJson,
      skills: profileJson.skills
    }
  });

  console.log('✅ Realistic Demo CV created with ID:', cv.id);
  console.log('=================================');
  console.log('Tài khoản demo đã sẵn sàng:');
  console.log('Email:', email);
  console.log('Password: namngo001');
  console.log('=================================');
}

main().catch(console.error).finally(() => prisma.$disconnect());
