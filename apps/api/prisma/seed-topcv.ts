import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { JobStatus, Prisma, PrismaClient, UserRole } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const connectionString = process.env['DATABASE_URL'];
if (!connectionString) {
  throw new Error('DATABASE_URL is required to seed companies');
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

type RawTopCvCompany = {
  company_name: string;
  company_logo: string;
};

type CompanySeed = {
  name: string;
  slug: string;
  logoUrl: string;
  website: string;
  taxCode: string;
  size: string;
  industry: string;
  location: string;
  shortDescription: string;
  description: string[];
  highlights: string[];
  companyType: 'pro' | 'normal' | 'startup';
  isTrusted: boolean;
  priorityRank: number;
};

type JobSeed = {
  title: string;
  slug: string;
  companySlug: string;
  shortDescription: string;
  description: string;
  skills: string[];
  salaryMin: number | null;
  salaryMax: number | null;
  location: Record<string, unknown>;
  experienceLevel: string;
};

const curatedCompanies: CompanySeed[] = [
  {
    name: 'CÔNG TY CỔ PHẦN DREAM VIET EDUCATION',
    slug: 'dream-viet-education',
    logoUrl: 'https://kynaforkids.vn/favicon.ico',
    website: 'https://kynaforkids.vn/',
    taxCode: '0313589030',
    size: '100-499 nhân viên',
    industry: 'Giáo dục / Đào tạo',
    location:
      'Bcons Tower, 4A/167A Nguyễn Văn Thương, Phường 25, Quận Bình Thạnh, TP.HCM',
    shortDescription:
      'Nền tảng giáo dục trực tuyến cho trẻ em với hệ sinh thái Kyna English, Kyna Math và nhiều chương trình học tương tác.',
    description: [
      'Công ty Cổ phần Dream Viet Education - KYNA PTE. LTD. (KYNA ENGLISH) là đơn vị đào tạo trực tuyến hàng đầu dành cho trẻ em, học sinh với hơn 200,000 học sinh trên toàn quốc.',
      'KYNA cung cấp chương trình học video, ứng dụng học tập Tiếng Anh, Toán học, Kyna Mentor và hệ thống 1-1 với giáo viên trong nước lẫn giáo viên nước ngoài.',
      'Môi trường làm việc năng động, chú trọng phát triển sản phẩm giáo dục số và khuyến khích nhân sự chủ động thử nghiệm những ý tưởng mới.',
    ],
    highlights: ['EdTech', 'Hybrid', 'Đào tạo nội bộ', 'Sản phẩm số'],
    companyType: 'pro',
    isTrusted: true,
    priorityRank: 1,
  },
  {
    name: 'FPT SOFTWARE',
    slug: 'fpt-software',
    logoUrl: 'https://www.google.com/s2/favicons?domain=fptsoftware.com&sz=128',
    website: 'https://fptsoftware.com/',
    taxCode: '0101601092',
    size: '10,000+ nhân viên',
    industry: 'Công nghệ thông tin',
    location: 'FPT Tower, 10 Phạm Văn Bạch, Cầu Giấy, Hà Nội',
    shortDescription:
      'Công ty công nghệ toàn cầu thuộc Tập đoàn FPT, cung cấp dịch vụ chuyển đổi số, AI, cloud và phần mềm quy mô lớn.',
    description: [
      'FPT Software là một trong những doanh nghiệp công nghệ Việt Nam có quy mô nhân sự lớn nhất, phục vụ khách hàng tại nhiều thị trường quốc tế.',
      'Công ty tập trung vào chuyển đổi số, trí tuệ nhân tạo, dữ liệu, cloud, automotive và các giải pháp phần mềm doanh nghiệp.',
      'Ứng viên có cơ hội tham gia dự án quốc tế, lộ trình phát triển nghề nghiệp rõ ràng và hệ sinh thái đào tạo kỹ thuật rộng.',
    ],
    highlights: ['Global', 'AI', 'Cloud', 'Enterprise'],
    companyType: 'pro',
    isTrusted: true,
    priorityRank: 2,
  },
  {
    name: 'VNG CORPORATION',
    slug: 'vng-corporation',
    logoUrl: 'https://www.google.com/s2/favicons?domain=vng.com.vn&sz=128',
    website: 'https://vng.com.vn/',
    taxCode: '0303490096',
    size: '1,000-4,999 nhân viên',
    industry: 'Internet / Sản phẩm số',
    location: 'VNG Campus, Quận 7, TP.HCM',
    shortDescription:
      'Công ty sản phẩm số với các mảng game, nền tảng kết nối, thanh toán, cloud và AI phục vụ hàng chục triệu người dùng.',
    description: [
      'VNG phát triển nhiều sản phẩm Internet quy mô lớn, từ nền tảng giải trí, kết nối người dùng đến các dịch vụ cloud và AI.',
      'Đội ngũ sản phẩm, kỹ thuật, dữ liệu và vận hành làm việc theo mô hình đa ngành, tập trung tốc độ thử nghiệm và chất lượng trải nghiệm người dùng.',
      'Môi trường phù hợp với ứng viên muốn xây sản phẩm có lưu lượng lớn và tác động trực tiếp tới thị trường Việt Nam.',
    ],
    highlights: ['Product', 'High scale', 'Cloud', 'AI'],
    companyType: 'pro',
    isTrusted: true,
    priorityRank: 3,
  },
  {
    name: 'VIETTEL SOLUTIONS',
    slug: 'viettel-solutions',
    logoUrl: 'https://www.google.com/s2/favicons?domain=viettel.com.vn&sz=128',
    website: 'https://viettel-solutions.vn/',
    taxCode: '0100109106',
    size: '5,000-9,999 nhân viên',
    industry: 'Viễn thông / Chuyển đổi số',
    location: 'Tòa nhà Viettel, Duy Tân, Cầu Giấy, Hà Nội',
    shortDescription:
      'Đơn vị triển khai giải pháp chuyển đổi số, hạ tầng số và nền tảng công nghệ cho khối chính phủ, doanh nghiệp lớn.',
    description: [
      'Viettel Solutions xây dựng các giải pháp công nghệ trong lĩnh vực chính phủ số, doanh nghiệp số, an ninh mạng và hạ tầng số.',
      'Dự án thường có quy mô lớn, yêu cầu tiêu chuẩn vận hành cao và tạo tác động rõ rệt tới hoạt động của tổ chức khách hàng.',
      'Công ty phù hợp với nhân sự thích bài toán hệ thống, quy trình chuyên nghiệp và lộ trình phát triển kỹ thuật dài hạn.',
    ],
    highlights: ['GovTech', 'Enterprise', 'Security', 'Infrastructure'],
    companyType: 'pro',
    isTrusted: true,
    priorityRank: 4,
  },
  {
    name: 'MOMO',
    slug: 'momo',
    logoUrl: 'https://www.google.com/s2/favicons?domain=momo.vn&sz=128',
    website: 'https://momo.vn/',
    taxCode: '0305281432',
    size: '1,000-4,999 nhân viên',
    industry: 'Fintech',
    location: 'Phú Mỹ Hưng Tower, Quận 7, TP.HCM',
    shortDescription:
      'Ví điện tử và nền tảng tài chính số với hệ sinh thái thanh toán, tín dụng, bảo hiểm và dịch vụ tiêu dùng.',
    description: [
      'MoMo phát triển nền tảng tài chính số phục vụ người dùng cá nhân và đối tác doanh nghiệp trên nhiều lĩnh vực thanh toán.',
      'Đội ngũ sản phẩm và kỹ thuật tập trung vào độ tin cậy, bảo mật, tăng trưởng người dùng và trải nghiệm giao dịch nhanh.',
      'Ứng viên có thể tham gia các bài toán fintech, dữ liệu, hệ thống thanh toán và tối ưu trải nghiệm mobile.',
    ],
    highlights: ['Fintech', 'Mobile', 'Data', 'Security'],
    companyType: 'pro',
    isTrusted: true,
    priorityRank: 5,
  },
];

const jobs: JobSeed[] = [
  {
    title: 'Giáo viên Tiếng Anh online',
    slug: 'giao-vien-tieng-anh-online-kyna',
    companySlug: 'dream-viet-education',
    shortDescription:
      'Giảng dạy tiếng Anh trực tuyến cho học sinh theo giáo trình và nền tảng học tập của KYNA.',
    description:
      'Giảng dạy lớp online, theo dõi tiến độ học viên, phối hợp với đội học thuật để cải thiện chất lượng bài học.',
    skills: ['Teaching', 'English', 'Online learning'],
    salaryMin: 12_000_000,
    salaryMax: 20_000_000,
    location: { city: 'TP.HCM', remote: true },
    experienceLevel: '2',
  },
  {
    title: 'Product Owner - Learning Platform',
    slug: 'product-owner-learning-platform-kyna',
    companySlug: 'dream-viet-education',
    shortDescription:
      'Phát triển roadmap sản phẩm học tập trực tuyến và phối hợp cùng team kỹ thuật, học thuật.',
    description:
      'Quản lý backlog, phân tích nhu cầu người học, ưu tiên tính năng và đo lường hiệu quả sản phẩm giáo dục số.',
    skills: ['Product', 'EdTech', 'Agile'],
    salaryMin: 25_000_000,
    salaryMax: 35_000_000,
    location: { city: 'TP.HCM', remote: false },
    experienceLevel: '3',
  },
  {
    title: 'Senior Java Developer',
    slug: 'senior-java-developer-fpt-software',
    companySlug: 'fpt-software',
    shortDescription:
      'Tham gia dự án phần mềm doanh nghiệp quốc tế với kiến trúc microservices.',
    description:
      'Thiết kế, phát triển và tối ưu backend Java/Spring Boot cho khách hàng global; phối hợp cùng team đa quốc gia.',
    skills: ['Java', 'Spring Boot', 'Microservices'],
    salaryMin: 30_000_000,
    salaryMax: 55_000_000,
    location: { city: 'Hà Nội', remote: false },
    experienceLevel: '4',
  },
  {
    title: 'AI Engineer',
    slug: 'ai-engineer-fpt-software',
    companySlug: 'fpt-software',
    shortDescription:
      'Xây dựng giải pháp AI/LLM phục vụ chuyển đổi số cho khách hàng doanh nghiệp.',
    description:
      'Phát triển pipeline AI, fine-tune model, tích hợp LLM vào sản phẩm và vận hành trên cloud.',
    skills: ['Python', 'LLM', 'Cloud'],
    salaryMin: 35_000_000,
    salaryMax: 65_000_000,
    location: { city: 'Đà Nẵng', remote: true },
    experienceLevel: '3',
  },
  {
    title: 'Backend Engineer - Platform',
    slug: 'backend-engineer-platform-vng',
    companySlug: 'vng-corporation',
    shortDescription:
      'Xây dựng service nền tảng có lưu lượng lớn cho hệ sinh thái sản phẩm số.',
    description:
      'Thiết kế API, tối ưu hiệu năng, vận hành service phân tán và phối hợp xử lý sự cố production.',
    skills: ['Go', 'Kubernetes', 'Distributed systems'],
    salaryMin: 35_000_000,
    salaryMax: 60_000_000,
    location: { city: 'TP.HCM', remote: false },
    experienceLevel: '4',
  },
  {
    title: 'Product Designer',
    slug: 'product-designer-vng',
    companySlug: 'vng-corporation',
    shortDescription:
      'Thiết kế trải nghiệm người dùng cho sản phẩm có lượng truy cập lớn.',
    description:
      'Nghiên cứu người dùng, thiết kế prototype, phối hợp cùng PM và engineering để cải thiện conversion.',
    skills: ['UX', 'Figma', 'Design System'],
    salaryMin: 25_000_000,
    salaryMax: 45_000_000,
    location: { city: 'TP.HCM', remote: false },
    experienceLevel: '3',
  },
  {
    title: 'Solution Architect',
    slug: 'solution-architect-viettel-solutions',
    companySlug: 'viettel-solutions',
    shortDescription:
      'Thiết kế giải pháp chuyển đổi số cho khách hàng enterprise và chính phủ.',
    description:
      'Tư vấn kiến trúc hệ thống, phối hợp presales, đánh giá rủi ro kỹ thuật và dẫn dắt triển khai giải pháp.',
    skills: ['Architecture', 'Cloud', 'Presale'],
    salaryMin: 40_000_000,
    salaryMax: 70_000_000,
    location: { city: 'Hà Nội', remote: false },
    experienceLevel: '5',
  },
  {
    title: 'Mobile Engineer',
    slug: 'mobile-engineer-momo',
    companySlug: 'momo',
    shortDescription:
      'Phát triển trải nghiệm mobile cho nền tảng tài chính số có hàng triệu người dùng.',
    description:
      'Xây dựng tính năng thanh toán, tối ưu hiệu năng app, phối hợp bảo mật và backend để đảm bảo giao dịch ổn định.',
    skills: ['React Native', 'Mobile', 'Payment'],
    salaryMin: 35_000_000,
    salaryMax: 55_000_000,
    location: { city: 'TP.HCM', remote: false },
    experienceLevel: '3',
  },
];

function toSlug(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function toFallbackCompany(raw: RawTopCvCompany, index: number): CompanySeed {
  const name = raw.company_name.trim();
  const isStartup = /SÁNG TẠO|CREATIVE/i.test(name);
  return {
    name,
    slug: toSlug(name),
    logoUrl: raw.company_logo,
    website: `https://${toSlug(name)}.example.vn/`,
    taxCode: '',
    size: '25-99 nhân viên',
    industry: isStartup ? 'Marketing / Công nghệ sáng tạo' : 'Công nghệ thông tin',
    location: index % 2 === 0 ? 'TP.HCM' : 'Hà Nội',
    shortDescription:
      'Doanh nghiệp đang tuyển dụng trên SCC, hồ sơ được import từ dữ liệu công ty TopCV trong project.',
    description: [
      'Hồ sơ công ty được import từ dữ liệu có sẵn trong project và có thể được bổ sung thêm thông tin chi tiết từ dashboard quản trị.',
      'Các vị trí tuyển dụng sẽ được liên kết trực tiếp với công ty để hiển thị trong danh sách và trang chi tiết.',
    ],
    highlights: ['Imported', 'Hiring', 'SCC'],
    companyType: isStartup ? 'startup' : 'normal',
    isTrusted: false,
    priorityRank: 100 + index,
  };
}

async function ensureRecruiter() {
  const existing = await prisma.user.findFirst({
    where: { role: UserRole.RECRUITER, deletedAt: null },
  });
  if (existing) {
    return existing;
  }

  return prisma.user.create({
    data: {
      email: 'company.seed.recruiter@example.com',
      password: 'seeded-password-placeholder',
      name: 'Company Seed Recruiter',
      role: UserRole.RECRUITER,
    },
  });
}

async function readTopCvCompanies(): Promise<CompanySeed[]> {
  const filePath = path.join(__dirname, '../../../topcv_companies_logo_only.json');
  if (!fs.existsSync(filePath)) {
    return [];
  }

  const raw = JSON.parse(fs.readFileSync(filePath, 'utf-8')) as RawTopCvCompany[];
  const existingNames = new Set(curatedCompanies.map((company) => company.name));
  return raw
    .filter((company) => company.company_name?.trim() && company.company_logo?.trim())
    .filter((company) => !existingNames.has(company.company_name.trim()))
    .map(toFallbackCompany);
}

async function main() {
  const recruiter = await ensureRecruiter();
  const importedCompanies = await readTopCvCompanies();
  const companies = [...curatedCompanies, ...importedCompanies];

  for (const company of companies) {
    await prisma.company.upsert({
      where: { slug: company.slug },
      create: {
        ...company,
        description: company.description,
        highlights: company.highlights,
      },
      update: {
        name: company.name,
        logoUrl: company.logoUrl,
        website: company.website,
        taxCode: company.taxCode || null,
        size: company.size,
        industry: company.industry,
        location: company.location,
        shortDescription: company.shortDescription,
        description: company.description,
        highlights: company.highlights,
        companyType: company.companyType,
        isTrusted: company.isTrusted,
        priorityRank: company.priorityRank,
      },
    });
  }

  const companyBySlug = new Map(
    (
      await prisma.company.findMany({
        where: { slug: { in: companies.map((company) => company.slug) } },
        select: { id: true, slug: true },
      })
    ).map((company) => [company.slug, company.id]),
  );

  for (const job of jobs) {
    const companyId = companyBySlug.get(job.companySlug);
    if (!companyId) {
      continue;
    }

    await prisma.job.upsert({
      where: { slug: job.slug },
      create: {
        recruiterId: recruiter.id,
        companyId,
        title: job.title,
        slug: job.slug,
        description: job.description,
        shortDescription: job.shortDescription,
        skills: job.skills,
        skillAtoms: job.skills.map((skill) => ({
          canonical: skill.toLowerCase(),
          display: skill,
          source: 'company_seed',
        })),
        location: job.location as Prisma.InputJsonValue,
        employmentType: 'FULL_TIME',
        salaryMin: job.salaryMin,
        salaryMax: job.salaryMax,
        experienceLevel: job.experienceLevel,
        status: JobStatus.PUBLISHED,
        publishedAt: new Date(),
        companyIndustryKey: 'it_software',
        salaryNegotiable: job.salaryMin === null && job.salaryMax === null,
      },
      update: {
        recruiterId: recruiter.id,
        companyId,
        title: job.title,
        description: job.description,
        shortDescription: job.shortDescription,
        skills: job.skills,
        location: job.location as Prisma.InputJsonValue,
        employmentType: 'FULL_TIME',
        salaryMin: job.salaryMin,
        salaryMax: job.salaryMax,
        experienceLevel: job.experienceLevel,
        status: JobStatus.PUBLISHED,
        publishedAt: new Date(),
      },
    });
  }

  console.log(
    `Seeded ${companies.length} companies and ${jobs.length} company jobs.`,
  );
}

main()
  .catch((error) => {
    console.error('Company seed failed', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
