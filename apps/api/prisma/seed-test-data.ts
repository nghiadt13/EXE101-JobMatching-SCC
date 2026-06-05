/**
 * Seed Test Data for End-to-End Testing
 * Creates: 2 recruiters, 3 candidates, 5 jobs, 3 CVs
 * Run: npx ts-node prisma/seed-test-data.ts
 */
import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const connectionString =
  process.env['DATABASE_URL'] ??
  'postgresql://postgres:postgres@localhost:5432/postgres';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});
const BCRYPT_ROUNDS = 10;
const PASSWORD = 'Test@123'; // Same password for all test accounts

async function main() {
  console.log('🌱 Seeding test data...\n');

  const hashedPassword = await bcrypt.hash(PASSWORD, BCRYPT_ROUNDS);

  // ─── 1. Create Companies ────────────────────────────────────────
  console.log('📦 Creating companies...');
  const company1 = await prisma.company.upsert({
    where: { slug: 'techcorp-vn' },
    update: {},
    create: {
      name: 'TechCorp Vietnam',
      slug: 'techcorp-vn',
      logoUrl: null,
      isTrusted: true,
      companyType: 'product',
    },
  });
  const company2 = await prisma.company.upsert({
    where: { slug: 'fpt-software' },
    update: {},
    create: {
      name: 'FPT Software',
      slug: 'fpt-software',
      logoUrl: null,
      isTrusted: true,
      companyType: 'outsource',
    },
  });
  console.log(`  ✅ Companies: ${company1.name}, ${company2.name}`);

  // ─── 2. Create Recruiter Users ──────────────────────────────────
  console.log('👔 Creating recruiters...');
  const recruiter1 = await prisma.user.upsert({
    where: { email: 'recruiter1@test.com' },
    update: {},
    create: {
      email: 'recruiter1@test.com',
      password: hashedPassword,
      name: 'Nguyễn Văn HR',
      role: 'RECRUITER',
    },
  });
  const recruiter2 = await prisma.user.upsert({
    where: { email: 'recruiter2@test.com' },
    update: {},
    create: {
      email: 'recruiter2@test.com',
      password: hashedPassword,
      name: 'Trần Thị Tuyển Dụng',
      role: 'RECRUITER',
    },
  });
  console.log(`  ✅ Recruiters: ${recruiter1.email}, ${recruiter2.email}`);

  // ─── 3. Create Candidate Users ──────────────────────────────────
  console.log('🧑‍💻 Creating candidates...');

  const candidateUsers = [
    { email: 'candidate1@test.com', name: 'Lê Minh Backend' },
    { email: 'candidate2@test.com', name: 'Phạm Thị Frontend' },
    { email: 'candidate3@test.com', name: 'Hoàng Văn Fullstack' },
  ];

  const candidates: { userId: string; candidateId: string; email: string; name: string }[] = [];

  for (const cu of candidateUsers) {
    const user = await prisma.user.upsert({
      where: { email: cu.email },
      update: {},
      create: {
        email: cu.email,
        password: hashedPassword,
        name: cu.name,
        role: 'CANDIDATE',
      },
    });

    let candidate = await prisma.candidate.findUnique({ where: { userId: user.id } });
    if (!candidate) {
      candidate = await prisma.candidate.create({
        data: { userId: user.id, bio: `Tôi là ${cu.name}, đang tìm kiếm cơ hội việc làm mới.` },
      });
    }
    candidates.push({ userId: user.id, candidateId: candidate.id, email: cu.email, name: cu.name });
  }
  console.log(`  ✅ Candidates: ${candidates.map(c => c.email).join(', ')}`);

  // ─── 4. Create Jobs ─────────────────────────────────────────────
  console.log('💼 Creating jobs...');

  const jobsData = [
    {
      recruiterId: recruiter1.id,
      companyId: company1.id,
      title: 'Senior Backend Developer (Node.js)',
      slug: 'senior-backend-developer-nodejs',
      shortDescription: 'Tuyển lập trình viên Backend Senior với kinh nghiệm Node.js, NestJS và PostgreSQL.',
      description: `## Mô tả công việc
Chúng tôi đang tìm kiếm một Senior Backend Developer để gia nhập đội ngũ phát triển sản phẩm tại TechCorp Vietnam.

### Trách nhiệm:
- Thiết kế và phát triển các API RESTful sử dụng Node.js và NestJS
- Quản lý cơ sở dữ liệu PostgreSQL, tối ưu hóa truy vấn
- Triển khai CI/CD pipeline, containerization với Docker
- Code review và mentor các thành viên junior
- Phối hợp với team Frontend và DevOps

### Yêu cầu:
- 3+ năm kinh nghiệm với Node.js/TypeScript
- Thành thạo NestJS framework
- Kinh nghiệm với PostgreSQL, Redis
- Hiểu biết về Docker, Kubernetes
- Kinh nghiệm với Git, CI/CD
- Có kinh nghiệm thiết kế hệ thống microservices là một lợi thế

### Quyền lợi:
- Lương cạnh tranh 25-40 triệu VND
- 13th month salary + performance bonus
- Bảo hiểm sức khỏe cao cấp
- Môi trường làm việc năng động, học hỏi liên tục`,
      skills: ['Node.js', 'TypeScript', 'NestJS', 'PostgreSQL', 'Docker', 'Redis', 'Git', 'REST API'],
      employmentType: 'full-time',
      salaryMin: 25000000,
      salaryMax: 40000000,
      experienceLevel: 'senior',
      status: 'PUBLISHED' as const,
    },
    {
      recruiterId: recruiter1.id,
      companyId: company1.id,
      title: 'Frontend Developer (React/Next.js)',
      slug: 'frontend-developer-react-nextjs',
      shortDescription: 'Tuyển Frontend Developer thành thạo React, Next.js và TailwindCSS.',
      description: `## Mô tả công việc
TechCorp Vietnam cần tuyển Frontend Developer để phát triển giao diện người dùng cho các sản phẩm SaaS.

### Trách nhiệm:
- Phát triển giao diện web responsive sử dụng React và Next.js
- Tích hợp API RESTful với backend team
- Viết unit test và integration test
- Tối ưu hiệu năng và trải nghiệm người dùng
- Đảm bảo accessibility (WCAG)

### Yêu cầu:
- 2+ năm kinh nghiệm với React.js
- Thành thạo TypeScript, HTML5, CSS3
- Kinh nghiệm với Next.js, TailwindCSS
- Hiểu biết về state management (Redux, Zustand)
- Có khả năng responsive design
- Kinh nghiệm với testing (Jest, React Testing Library)

### Quyền lợi:
- Lương 18-30 triệu VND
- Làm việc hybrid (3 ngày office, 2 ngày remote)
- Được tham gia các khóa đào tạo`,
      skills: ['React', 'Next.js', 'TypeScript', 'TailwindCSS', 'HTML5', 'CSS3', 'Redux', 'Jest'],
      employmentType: 'full-time',
      salaryMin: 18000000,
      salaryMax: 30000000,
      experienceLevel: 'mid',
      status: 'PUBLISHED' as const,
    },
    {
      recruiterId: recruiter2.id,
      companyId: company2.id,
      title: 'Fullstack Developer (Java Spring Boot + Angular)',
      slug: 'fullstack-developer-java-angular',
      shortDescription: 'FPT Software tuyển Fullstack Developer Java Spring Boot và Angular cho dự án outsource.',
      description: `## Mô tả công việc
FPT Software cần tuyển Fullstack Developer cho dự án outsource với đối tác Nhật Bản.

### Trách nhiệm:
- Phát triển backend services bằng Java Spring Boot
- Xây dựng giao diện frontend với Angular
- Làm việc với Oracle Database và MongoDB
- Viết tài liệu kỹ thuật (technical design)
- Giao tiếp với khách hàng Nhật (có phiên dịch hỗ trợ)

### Yêu cầu:
- 2+ năm kinh nghiệm Java và Spring Boot
- Kinh nghiệm với Angular 12+
- Biết SQL và NoSQL database
- Có tinh thần teamwork, chịu áp lực tốt
- Tiếng Anh giao tiếp (N3 Nhật là lợi thế)

### Quyền lợi:
- Lương 20-35 triệu VND
- Cơ hội onsite Nhật Bản
- Đào tạo chứng chỉ AWS, Azure`,
      skills: ['Java', 'Spring Boot', 'Angular', 'Oracle', 'MongoDB', 'SQL', 'REST API', 'Git'],
      employmentType: 'full-time',
      salaryMin: 20000000,
      salaryMax: 35000000,
      experienceLevel: 'mid',
      status: 'PUBLISHED' as const,
    },
    {
      recruiterId: recruiter2.id,
      companyId: company2.id,
      title: 'DevOps Engineer',
      slug: 'devops-engineer-fpt',
      shortDescription: 'Tuyển DevOps Engineer với kinh nghiệm AWS, Docker, Kubernetes và CI/CD.',
      description: `## Mô tả công việc
FPT Software tuyển DevOps Engineer để quản lý hạ tầng cloud cho nhiều dự án.

### Trách nhiệm:
- Quản lý hạ tầng AWS (EC2, ECS, RDS, S3, CloudFront)
- Thiết kế và triển khai CI/CD pipelines (Jenkins, GitLab CI)
- Container orchestration với Docker và Kubernetes
- Monitoring và alerting (Prometheus, Grafana, CloudWatch)
- Infrastructure as Code với Terraform

### Yêu cầu:
- 3+ năm kinh nghiệm DevOps/SRE
- Thành thạo AWS hoặc Azure
- Kinh nghiệm Docker, Kubernetes
- Scripting: Bash, Python
- Hiểu biết về networking, security
- Chứng chỉ AWS Solutions Architect là lợi thế

### Quyền lợi:
- Lương 30-50 triệu VND
- Remote work flexibility
- Ngân sách học tập và thi chứng chỉ`,
      skills: ['AWS', 'Docker', 'Kubernetes', 'Terraform', 'Jenkins', 'Linux', 'Python', 'Bash', 'CI/CD'],
      employmentType: 'full-time',
      salaryMin: 30000000,
      salaryMax: 50000000,
      experienceLevel: 'senior',
      status: 'PUBLISHED' as const,
    },
    {
      recruiterId: recruiter1.id,
      companyId: company1.id,
      title: 'Data Analyst (Python/SQL)',
      slug: 'data-analyst-python-sql',
      shortDescription: 'Tuyển Data Analyst với kỹ năng Python, SQL và visualization tools.',
      description: `## Mô tả công việc
TechCorp Vietnam tuyển Data Analyst để hỗ trợ ra quyết định dựa trên dữ liệu.

### Trách nhiệm:
- Phân tích dữ liệu kinh doanh, viết báo cáo
- Xây dựng dashboard với Power BI hoặc Tableau
- Truy vấn và xử lý dữ liệu từ PostgreSQL, BigQuery
- Phát triển data pipeline đơn giản bằng Python
- A/B testing và statistical analysis

### Yêu cầu:
- 1+ năm kinh nghiệm Data Analyst
- Thành thạo SQL (complex queries, window functions)
- Python (pandas, numpy, matplotlib)
- Kinh nghiệm Power BI hoặc Tableau
- Kiến thức thống kê cơ bản
- Excel nâng cao

### Quyền lợi:
- Lương 15-25 triệu VND
- Làm việc giờ linh hoạt
- Được sponsor các khóa học Data Science`,
      skills: ['Python', 'SQL', 'Power BI', 'Tableau', 'pandas', 'Excel', 'Statistics', 'BigQuery'],
      employmentType: 'full-time',
      salaryMin: 15000000,
      salaryMax: 25000000,
      experienceLevel: 'junior',
      status: 'PUBLISHED' as const,
    },
  ];

  const createdJobs: { id: string; title: string }[] = [];
  for (const jd of jobsData) {
    const existing = await prisma.job.findUnique({ where: { slug: jd.slug } });
    if (existing) {
      createdJobs.push({ id: existing.id, title: existing.title });
      continue;
    }

    const job = await prisma.job.create({
      data: {
        recruiterId: jd.recruiterId,
        companyId: jd.companyId,
        title: jd.title,
        slug: jd.slug,
        description: jd.description,
        shortDescription: jd.shortDescription,
        skills: jd.skills,
        skillAtoms: jd.skills.map(s => ({ canonical: s.toLowerCase(), display: s, source: 'seed' })),
        employmentType: jd.employmentType,
        salaryMin: jd.salaryMin,
        salaryMax: jd.salaryMax,
        experienceLevel: jd.experienceLevel,
        status: jd.status,
        publishedAt: new Date(),
      },
    });
    createdJobs.push({ id: job.id, title: job.title });
  }
  console.log(`  ✅ Jobs created: ${createdJobs.length}`);
  createdJobs.forEach(j => console.log(`     - ${j.title}`));

  // ─── 5. Create CVs ──────────────────────────────────────────────
  console.log('📄 Creating CVs...');

  const cvsData = [
    {
      candidateIdx: 0, // Lê Minh Backend
      fileName: 'Le_Minh_Backend_CV.pdf',
      rawText: `Lê Minh Backend
Senior Backend Developer

SUMMARY
Experienced backend developer with 4 years of expertise in Node.js, NestJS, and cloud technologies. Passionate about building scalable microservices and RESTful APIs. Strong problem-solving skills and team collaboration.

EXPERIENCE
Senior Backend Developer at VNG Corporation
01/2023 - Present
- Designed and developed microservices architecture using NestJS and TypeScript
- Optimized PostgreSQL queries, reducing response time by 40%
- Implemented Redis caching layer for high-traffic endpoints
- Set up CI/CD pipeline with GitHub Actions and Docker
- Mentored 3 junior developers
Technologies: Node.js, NestJS, TypeScript, PostgreSQL, Redis, Docker, AWS

Backend Developer at Tiki Corporation
06/2021 - 12/2022
- Developed REST APIs for e-commerce platform serving 5M+ users
- Integrated payment gateways (VNPay, Momo)
- Built real-time notification system with WebSocket
- Database design and migration management
Technologies: Node.js, Express.js, MongoDB, RabbitMQ

EDUCATION
Bachelor of Computer Science - Ho Chi Minh University of Technology (HCMUT)
2017-2021, GPA: 3.4/4.0

SKILLS
Node.js, TypeScript, NestJS, Express.js, PostgreSQL, MongoDB, Redis, Docker, AWS, Git, REST API, GraphQL, Microservices, CI/CD, Linux

CERTIFICATIONS
AWS Solutions Architect Associate
Docker Certified Associate

LANGUAGES
Vietnamese (native), English (professional working proficiency)`,
      skills: ['Node.js', 'TypeScript', 'NestJS', 'PostgreSQL', 'MongoDB', 'Redis', 'Docker', 'AWS', 'Git', 'REST API', 'GraphQL', 'Microservices'],
      parsedData: {
        parseStatus: 'parsed_ok',
        title: 'Senior Backend Developer',
        summary: 'Experienced backend developer with 4 years of expertise in Node.js, NestJS, and cloud technologies.',
        headline: 'Senior Backend Developer',
      },
    },
    {
      candidateIdx: 1, // Phạm Thị Frontend
      fileName: 'Pham_Thi_Frontend_CV.pdf',
      rawText: `Phạm Thị Frontend
Frontend Developer

SUMMARY
Creative frontend developer with 3 years of experience building responsive web applications using React, Next.js, and modern CSS frameworks. Focused on pixel-perfect UI implementation and excellent user experience.

EXPERIENCE
Frontend Developer at Shopee Vietnam
03/2022 - Present
- Developed seller dashboard using React and TypeScript
- Implemented responsive layouts with TailwindCSS
- Built reusable component library (Design System)
- Improved page load performance by 35% with code splitting and lazy loading
- Wrote comprehensive unit tests with Jest and React Testing Library
Technologies: React, TypeScript, Next.js, TailwindCSS, Redux, Jest

Junior Frontend Developer atẾn Agency
01/2021 - 02/2022
- Built landing pages and corporate websites
- Converted Figma designs to pixel-perfect HTML/CSS
- Integrated REST APIs with Axios
- Used SCSS and Bootstrap for styling
Technologies: React, JavaScript, HTML5, CSS3, SCSS, Bootstrap

EDUCATION
Bachelor of Information Technology - FPT University
2017-2021, GPA: 3.6/4.0

SKILLS
React, Next.js, TypeScript, JavaScript, TailwindCSS, HTML5, CSS3, Redux, Zustand, Jest, React Testing Library, Figma, Git, REST API, Responsive Design

CERTIFICATIONS
Meta Frontend Developer Professional Certificate

LANGUAGES
Vietnamese (native), English (intermediate - IELTS 6.5)`,
      skills: ['React', 'Next.js', 'TypeScript', 'JavaScript', 'TailwindCSS', 'HTML5', 'CSS3', 'Redux', 'Jest', 'Git', 'Responsive Design', 'Figma'],
      parsedData: {
        parseStatus: 'parsed_ok',
        title: 'Frontend Developer',
        summary: 'Creative frontend developer with 3 years of experience building responsive web applications.',
        headline: 'Frontend Developer',
      },
    },
    {
      candidateIdx: 2, // Hoàng Văn Fullstack
      fileName: 'Hoang_Van_Fullstack_CV.pdf',
      rawText: `Hoàng Văn Fullstack
Fullstack Developer

SUMMARY
Versatile fullstack developer with 3 years of experience in both frontend and backend development. Proficient in Java Spring Boot, Angular, and DevOps practices. Quick learner with strong analytical skills.

EXPERIENCE
Fullstack Developer at NashTech Vietnam
06/2022 - Present
- Developed enterprise web applications using Java Spring Boot and Angular
- Designed RESTful APIs and database schemas (MySQL, PostgreSQL)
- Implemented authentication/authorization with Spring Security and JWT
- Set up Docker containers and basic Kubernetes deployments
- Participated in Agile/Scrum ceremonies
Technologies: Java, Spring Boot, Angular, PostgreSQL, MySQL, Docker, Kubernetes

Junior Developer at Axon Active Vietnam
01/2021 - 05/2022
- Built web modules using Java and React
- Wrote SQL queries and stored procedures
- Participated in code review and pair programming
- Learned CI/CD practices with Jenkins
Technologies: Java, React, MySQL, Jenkins, Git

EDUCATION
Bachelor of Software Engineering - University of Science (HCMUS)
2017-2021, GPA: 3.2/4.0

SKILLS
Java, Spring Boot, Angular, React, TypeScript, JavaScript, PostgreSQL, MySQL, MongoDB, Docker, Kubernetes, Jenkins, Git, REST API, Agile/Scrum, Linux

CERTIFICATIONS
Oracle Certified Professional Java SE 11

LANGUAGES
Vietnamese (native), English (professional - TOEIC 780), Japanese (N4)`,
      skills: ['Java', 'Spring Boot', 'Angular', 'React', 'TypeScript', 'PostgreSQL', 'MySQL', 'MongoDB', 'Docker', 'Kubernetes', 'Jenkins', 'Git', 'REST API'],
      parsedData: {
        parseStatus: 'parsed_ok',
        title: 'Fullstack Developer',
        summary: 'Versatile fullstack developer with 3 years of experience in both frontend and backend development.',
        headline: 'Fullstack Developer',
      },
    },
  ];

  const createdCvs: { id: string; fileName: string; candidateName: string }[] = [];
  for (const cvData of cvsData) {
    const candidate = candidates[cvData.candidateIdx];

    // Check if candidate already has a CV
    const existingCv = await prisma.cV.findFirst({
      where: { candidateId: candidate.candidateId, deletedAt: null },
    });
    if (existingCv) {
      createdCvs.push({ id: existingCv.id, fileName: existingCv.fileName, candidateName: candidate.name });
      continue;
    }

    const cv = await prisma.cV.create({
      data: {
        candidateId: candidate.candidateId,
        fileName: cvData.fileName,
        filePath: `uploads/cvs/${cvData.fileName}`,
        fileSize: cvData.rawText.length * 2,
        mimeType: 'application/pdf',
        parsedData: cvData.parsedData,
        skills: cvData.skills,
        skillAtoms: cvData.skills.map(s => ({ canonical: s.toLowerCase(), display: s, source: 'seed' })),
        rawText: cvData.rawText,
        isPrimary: true,
        source: 'upload',
        candidateProfile: {
          version: 'candidate_job_profile_v1',
          title: cvData.parsedData.title,
          summary: cvData.parsedData.summary,
          skills: cvData.skills,
        },
        candidateProfileVersion: 'candidate_job_profile_v1',
      },
    });
    createdCvs.push({ id: cv.id, fileName: cv.fileName, candidateName: candidate.name });
  }
  console.log(`  ✅ CVs created: ${createdCvs.length}`);
  createdCvs.forEach(cv => console.log(`     - ${cv.candidateName}: ${cv.fileName}`));

  // ─── 6. Summary ─────────────────────────────────────────────────
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ Seed completed successfully!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('\n📋 Test Accounts (password for all: Test@123):');
  console.log('  Recruiters:');
  console.log('    - recruiter1@test.com (Nguyễn Văn HR)');
  console.log('    - recruiter2@test.com (Trần Thị Tuyển Dụng)');
  console.log('  Candidates:');
  console.log('    - candidate1@test.com (Lê Minh Backend)');
  console.log('    - candidate2@test.com (Phạm Thị Frontend)');
  console.log('    - candidate3@test.com (Hoàng Văn Fullstack)');
  console.log('\n💼 Jobs (all PUBLISHED):');
  createdJobs.forEach(j => console.log(`    - ${j.title}`));
  console.log('\n📄 CVs:');
  createdCvs.forEach(cv => console.log(`    - ${cv.candidateName} → ${cv.fileName}`));
  console.log('\n🔗 Expected Match Scenarios:');
  console.log('  • Lê Minh Backend  ↔ Senior Backend Developer (Node.js)  → HIGH MATCH ✅');
  console.log('  • Phạm Thị Frontend ↔ Frontend Developer (React/Next.js) → HIGH MATCH ✅');
  console.log('  • Hoàng Văn Fullstack ↔ Fullstack Developer (Java/Angular) → HIGH MATCH ✅');
  console.log('  • Lê Minh Backend  ↔ Data Analyst (Python/SQL)          → LOW MATCH  ❌');
  console.log('  • Phạm Thị Frontend ↔ DevOps Engineer                   → LOW MATCH  ❌');
  console.log('\n💡 Next steps:');
  console.log('  1. Start API: npm run start:dev');
  console.log('  2. Login: POST /api/auth/login { email, password }');
  console.log('  3. Test matching: POST /api/matching/calculate { cvId, jobId }');
  console.log('  4. Test recommendation: POST /api/matching/recommend { cvId }');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
