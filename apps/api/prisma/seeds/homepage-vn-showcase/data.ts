import {
  ApplicationStatus,
  JobStatus,
  PrismaClient,
  UserRole,
} from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';

type RecruiterSeed = {
  email: string;
  name: string;
  companySlug: string;
};

type CompanySeed = {
  slug: string;
  name: string;
  logoUrl: string | null;
  iconKey: string;
  trusted: boolean;
};

type JobSeed = {
  slug: string;
  title: string;
  recruiterEmail: string;
  companySlug: string;
  categorySlug: string;
  shortDescription: string;
  description: string;
  skills: string[];
  salaryMin: number;
  salaryMax: number;
  location: {
    city: string;
    district?: string;
    country: 'Vietnam';
    remote?: boolean;
  };
  publishedOffsetDays: number;
};

type CandidateSeed = {
  email: string;
  name: string;
  phone: string;
  city: string;
  bio: string;
  rawText: string;
  skills: string[];
};

export const SEED_TAG = 'vnshowcase';
export const DEMO_PASSWORD = 'password123';

export const SEED_COMPANIES: CompanySeed[] = [
  {
    slug: 'seed-vn-viettel-solutions',
    name: 'Viettel Solutions',
    logoUrl: null,
    iconKey: 'fa-tower-cell',
    trusted: true,
  },
  {
    slug: 'seed-vn-fpt-software',
    name: 'FPT Software',
    logoUrl: null,
    iconKey: 'fa-laptop-code',
    trusted: true,
  },
  {
    slug: 'seed-vn-vng-corporation',
    name: 'VNG Corporation',
    logoUrl: null,
    iconKey: 'fa-gamepad',
    trusted: true,
  },
  {
    slug: 'seed-vn-vnpay',
    name: 'VNPay',
    logoUrl: null,
    iconKey: 'fa-wallet',
    trusted: true,
  },
  {
    slug: 'seed-vn-momo',
    name: 'MoMo',
    logoUrl: null,
    iconKey: 'fa-mobile-screen-button',
    trusted: true,
  },
  {
    slug: 'seed-vn-techcombank',
    name: 'Techcombank',
    logoUrl: null,
    iconKey: 'fa-building-columns',
    trusted: true,
  },
];

export const SEED_RECRUITERS: RecruiterSeed[] = [
  {
    email: 'hr.viettel@seed.hr-platform.local',
    name: 'Nguyen Minh - HR Viettel',
    companySlug: 'seed-vn-viettel-solutions',
  },
  {
    email: 'hr.fpt@seed.hr-platform.local',
    name: 'Tran Linh - HR FPT Software',
    companySlug: 'seed-vn-fpt-software',
  },
  {
    email: 'hr.vng@seed.hr-platform.local',
    name: 'Le Gia - HR VNG',
    companySlug: 'seed-vn-vng-corporation',
  },
  {
    email: 'hr.vnpay@seed.hr-platform.local',
    name: 'Pham An - HR VNPay',
    companySlug: 'seed-vn-vnpay',
  },
  {
    email: 'hr.momo@seed.hr-platform.local',
    name: 'Do Quynh - HR MoMo',
    companySlug: 'seed-vn-momo',
  },
  {
    email: 'hr.tcb@seed.hr-platform.local',
    name: 'Vu Nam - HR Techcombank',
    companySlug: 'seed-vn-techcombank',
  },
];

export const SEED_CATEGORIES = [
  {
    slug: 'seed-vn-software-engineering',
    name: 'Software Engineering',
    iconKey: 'fa-code',
    sortOrder: 1,
  },
  {
    slug: 'seed-vn-data-ai',
    name: 'Data & AI',
    iconKey: 'fa-chart-line',
    sortOrder: 2,
  },
  {
    slug: 'seed-vn-product-design',
    name: 'Product & Design',
    iconKey: 'fa-pen-nib',
    sortOrder: 3,
  },
  {
    slug: 'seed-vn-fintech',
    name: 'Fintech & Banking',
    iconKey: 'fa-building-columns',
    sortOrder: 4,
  },
  {
    slug: 'seed-vn-cybersecurity',
    name: 'Cybersecurity',
    iconKey: 'fa-shield-halved',
    sortOrder: 5,
  },
  {
    slug: 'seed-vn-marketing-growth',
    name: 'Marketing & Growth',
    iconKey: 'fa-bullhorn',
    sortOrder: 6,
  },
] as const;

export const SEED_JOBS: JobSeed[] = [
  {
    slug: 'seed-vn-senior-backend-engineer-viettel',
    title: 'Senior Backend Engineer (Microservices)',
    recruiterEmail: 'hr.viettel@seed.hr-platform.local',
    companySlug: 'seed-vn-viettel-solutions',
    categorySlug: 'seed-vn-software-engineering',
    shortDescription:
      'Build high-throughput APIs for telecom-scale digital services.',
    description:
      'Design and deliver microservice-based backend systems with NestJS, Kafka, and PostgreSQL. Collaborate with platform and SRE teams on reliability and observability.',
    skills: ['TypeScript', 'NestJS', 'PostgreSQL', 'Kafka', 'Docker'],
    salaryMin: 40000000,
    salaryMax: 70000000,
    location: { city: 'Ha Noi', district: 'Cau Giay', country: 'Vietnam' },
    publishedOffsetDays: 0,
  },
  {
    slug: 'seed-vn-frontend-react-engineer-fpt',
    title: 'Frontend Engineer (React/Next.js)',
    recruiterEmail: 'hr.fpt@seed.hr-platform.local',
    companySlug: 'seed-vn-fpt-software',
    categorySlug: 'seed-vn-software-engineering',
    shortDescription: 'Build enterprise web products with modern React stack.',
    description:
      'Implement scalable UI architecture, optimize rendering performance, and collaborate with UX designers and backend engineers.',
    skills: ['React', 'Next.js', 'TypeScript', 'Tailwind CSS'],
    salaryMin: 30000000,
    salaryMax: 55000000,
    location: { city: 'Da Nang', country: 'Vietnam' },
    publishedOffsetDays: 1,
  },
  {
    slug: 'seed-vn-data-engineer-vng',
    title: 'Data Engineer (Platform)',
    recruiterEmail: 'hr.vng@seed.hr-platform.local',
    companySlug: 'seed-vn-vng-corporation',
    categorySlug: 'seed-vn-data-ai',
    shortDescription:
      'Build resilient data pipelines for product analytics at scale.',
    description:
      'Develop and maintain data pipelines using Python, Airflow, and BigQuery/Spark. Support analytics and recommendation workloads.',
    skills: ['Python', 'SQL', 'Airflow', 'Spark'],
    salaryMin: 35000000,
    salaryMax: 65000000,
    location: {
      city: 'Ho Chi Minh',
      district: 'District 7',
      country: 'Vietnam',
    },
    publishedOffsetDays: 2,
  },
  {
    slug: 'seed-vn-product-designer-vnpay',
    title: 'Senior Product Designer (Fintech)',
    recruiterEmail: 'hr.vnpay@seed.hr-platform.local',
    companySlug: 'seed-vn-vnpay',
    categorySlug: 'seed-vn-product-design',
    shortDescription:
      'Design payment and checkout experiences for millions of users.',
    description:
      'Lead UX discovery, produce high-fidelity prototypes, and align design decisions with product and engineering constraints.',
    skills: ['Figma', 'Design Systems', 'User Research', 'Prototyping'],
    salaryMin: 28000000,
    salaryMax: 50000000,
    location: { city: 'Ha Noi', district: 'Dong Da', country: 'Vietnam' },
    publishedOffsetDays: 1,
  },
  {
    slug: 'seed-vn-security-engineer-viettel',
    title: 'Cybersecurity Engineer',
    recruiterEmail: 'hr.viettel@seed.hr-platform.local',
    companySlug: 'seed-vn-viettel-solutions',
    categorySlug: 'seed-vn-cybersecurity',
    shortDescription: 'Protect critical infrastructure and cloud workloads.',
    description:
      'Implement security controls, threat detection, and incident response automation across distributed systems.',
    skills: ['SIEM', 'SOC', 'Cloud Security', 'Incident Response'],
    salaryMin: 35000000,
    salaryMax: 65000000,
    location: { city: 'Ha Noi', country: 'Vietnam' },
    publishedOffsetDays: 3,
  },
  {
    slug: 'seed-vn-ml-engineer-vng',
    title: 'Machine Learning Engineer',
    recruiterEmail: 'hr.vng@seed.hr-platform.local',
    companySlug: 'seed-vn-vng-corporation',
    categorySlug: 'seed-vn-data-ai',
    shortDescription:
      'Ship recommendation and ranking models for consumer apps.',
    description:
      'Productionize ML pipelines, deploy models, and monitor model quality in online serving environments.',
    skills: ['Python', 'TensorFlow', 'MLOps', 'Feature Store'],
    salaryMin: 40000000,
    salaryMax: 75000000,
    location: { city: 'Ho Chi Minh', country: 'Vietnam' },
    publishedOffsetDays: 0,
  },
  {
    slug: 'seed-vn-payment-backend-engineer-vnpay',
    title: 'Payment Backend Engineer',
    recruiterEmail: 'hr.vnpay@seed.hr-platform.local',
    companySlug: 'seed-vn-vnpay',
    categorySlug: 'seed-vn-fintech',
    shortDescription: 'Build secure payment APIs and reconciliation services.',
    description:
      'Develop core payment gateways and settlement services with strict reliability and security requirements.',
    skills: ['Java', 'Spring Boot', 'PostgreSQL', 'Redis'],
    salaryMin: 35000000,
    salaryMax: 65000000,
    location: { city: 'Ha Noi', country: 'Vietnam' },
    publishedOffsetDays: 2,
  },
  {
    slug: 'seed-vn-growth-marketing-manager-momo',
    title: 'Growth Marketing Manager',
    recruiterEmail: 'hr.momo@seed.hr-platform.local',
    companySlug: 'seed-vn-momo',
    categorySlug: 'seed-vn-marketing-growth',
    shortDescription:
      'Drive growth campaigns for digital wallet acquisition and retention.',
    description:
      'Own end-to-end growth strategy, run experimentation, and optimize user funnel metrics across channels.',
    skills: ['Performance Marketing', 'CRM', 'A/B Testing', 'Analytics'],
    salaryMin: 32000000,
    salaryMax: 58000000,
    location: {
      city: 'Ho Chi Minh',
      district: 'District 1',
      country: 'Vietnam',
    },
    publishedOffsetDays: 4,
  },
  {
    slug: 'seed-vn-devops-engineer-fpt',
    title: 'DevOps Engineer (Cloud Platform)',
    recruiterEmail: 'hr.fpt@seed.hr-platform.local',
    companySlug: 'seed-vn-fpt-software',
    categorySlug: 'seed-vn-software-engineering',
    shortDescription:
      'Scale CI/CD and cloud infrastructure for global projects.',
    description:
      'Build automation for deployments, observability, and Kubernetes operations for enterprise products.',
    skills: ['Kubernetes', 'AWS', 'Terraform', 'GitHub Actions'],
    salaryMin: 32000000,
    salaryMax: 62000000,
    location: { city: 'Da Nang', country: 'Vietnam' },
    publishedOffsetDays: 2,
  },
  {
    slug: 'seed-vn-data-analyst-techcombank',
    title: 'Senior Data Analyst (Retail Banking)',
    recruiterEmail: 'hr.tcb@seed.hr-platform.local',
    companySlug: 'seed-vn-techcombank',
    categorySlug: 'seed-vn-fintech',
    shortDescription:
      'Turn transaction data into lending and retention insights.',
    description:
      'Build analytical models, dashboards, and reporting pipelines to support strategic decisions in retail banking.',
    skills: ['SQL', 'Power BI', 'Python', 'Statistics'],
    salaryMin: 28000000,
    salaryMax: 50000000,
    location: { city: 'Ha Noi', district: 'Ba Dinh', country: 'Vietnam' },
    publishedOffsetDays: 1,
  },
  {
    slug: 'seed-vn-mobile-engineer-momo',
    title: 'Mobile Engineer (React Native)',
    recruiterEmail: 'hr.momo@seed.hr-platform.local',
    companySlug: 'seed-vn-momo',
    categorySlug: 'seed-vn-software-engineering',
    shortDescription: 'Build user-facing mobile wallet experiences.',
    description:
      'Develop and optimize React Native features for scale, reliability, and smooth UX.',
    skills: ['React Native', 'TypeScript', 'Mobile Performance'],
    salaryMin: 30000000,
    salaryMax: 55000000,
    location: { city: 'Ho Chi Minh', country: 'Vietnam' },
    publishedOffsetDays: 3,
  },
  {
    slug: 'seed-vn-ui-ux-designer-fpt',
    title: 'UI/UX Designer (Enterprise Products)',
    recruiterEmail: 'hr.fpt@seed.hr-platform.local',
    companySlug: 'seed-vn-fpt-software',
    categorySlug: 'seed-vn-product-design',
    shortDescription:
      'Design dashboards and B2B workflows for enterprise clients.',
    description:
      'Translate business requirements into intuitive user journeys and maintain consistency across design systems.',
    skills: ['Figma', 'UX Research', 'Design Tokens', 'Prototyping'],
    salaryMin: 25000000,
    salaryMax: 45000000,
    location: { city: 'Ha Noi', country: 'Vietnam' },
    publishedOffsetDays: 4,
  },

  // =============================================
  // INTERN LEVEL — No experience required
  // =============================================
  {
    slug: 'seed-vn-frontend-intern-fpt',
    title: 'Frontend Intern (HTML/CSS/JS)',
    recruiterEmail: 'hr.fpt@seed.hr-platform.local',
    companySlug: 'seed-vn-fpt-software',
    categorySlug: 'seed-vn-software-engineering',
    shortDescription:
      'Thực tập frontend, học hỏi quy trình phát triển web chuyên nghiệp.',
    description:
      'Hỗ trợ team frontend xây dựng giao diện web cho các dự án nội bộ và outsource. ' +
      'Yêu cầu: nắm vững HTML, CSS, JavaScript cơ bản, có khả năng làm responsive layout. ' +
      'Ưu tiên sinh viên năm 3-4 ngành CNTT/KHMT. Không yêu cầu kinh nghiệm làm việc thực tế. ' +
      'Thời gian thực tập: 3-6 tháng, có cơ hội trở thành nhân viên chính thức.',
    skills: ['HTML', 'CSS', 'JavaScript', 'Responsive Design'],
    salaryMin: 3000000,
    salaryMax: 6000000,
    location: { city: 'Da Nang', country: 'Vietnam' },
    publishedOffsetDays: 0,
  },
  {
    slug: 'seed-vn-backend-intern-techcombank',
    title: 'Backend Intern (Java/Spring)',
    recruiterEmail: 'hr.tcb@seed.hr-platform.local',
    companySlug: 'seed-vn-techcombank',
    categorySlug: 'seed-vn-software-engineering',
    shortDescription: 'Thực tập backend Java cho đội core banking technology.',
    description:
      'Hỗ trợ phát triển và bảo trì các service backend bằng Java và Spring Boot. ' +
      'Yêu cầu: hiểu OOP, biết Java cơ bản, SQL cơ bản. Sinh viên năm cuối hoặc mới tốt nghiệp. ' +
      'Không yêu cầu kinh nghiệm thực tế. Được mentor 1-1 bởi senior engineer. ' +
      'Có trợ cấp ăn trưa và xe đưa đón.',
    skills: ['Java', 'SQL', 'OOP', 'Git'],
    salaryMin: 4000000,
    salaryMax: 7000000,
    location: { city: 'Ha Noi', district: 'Cau Giay', country: 'Vietnam' },
    publishedOffsetDays: 1,
  },

  // =============================================
  // JUNIOR LEVEL — 1-2 years experience
  // =============================================
  {
    slug: 'seed-vn-junior-qa-engineer-momo',
    title: 'Junior QA Engineer (Manual + Automation)',
    recruiterEmail: 'hr.momo@seed.hr-platform.local',
    companySlug: 'seed-vn-momo',
    categorySlug: 'seed-vn-software-engineering',
    shortDescription:
      'Đảm bảo chất lượng sản phẩm ví điện tử với manual và automation testing.',
    description:
      'Thực hiện test manual các tính năng payment, viết test case, và bắt đầu xây dựng automation test. ' +
      'Yêu cầu: 1-2 năm kinh nghiệm QA, biết viết test case, sử dụng Postman/REST API testing. ' +
      'Có kiến thức cơ bản về automation (Selenium/Playwright) là lợi thế. ' +
      'Hiểu quy trình Agile/Scrum. Tỉ mỉ, cẩn thận trong công việc.',
    skills: ['Manual Testing', 'Postman', 'Test Case Design', 'Agile', 'SQL'],
    salaryMin: 12000000,
    salaryMax: 18000000,
    location: {
      city: 'Ho Chi Minh',
      district: 'District 1',
      country: 'Vietnam',
    },
    publishedOffsetDays: 1,
  },
  {
    slug: 'seed-vn-junior-mobile-developer-vng',
    title: 'Junior Mobile Developer (Flutter)',
    recruiterEmail: 'hr.vng@seed.hr-platform.local',
    companySlug: 'seed-vn-vng-corporation',
    categorySlug: 'seed-vn-software-engineering',
    shortDescription:
      'Phát triển ứng dụng mobile cross-platform cho hệ sinh thái ZaloPay.',
    description:
      'Xây dựng tính năng mới cho app mobile sử dụng Flutter/Dart. ' +
      'Yêu cầu: 1 năm kinh nghiệm Flutter hoặc có ít nhất 1 project cá nhân đã publish lên store. ' +
      'Hiểu biết cơ bản về RESTful API, state management (Bloc/Riverpod). ' +
      'Biết Git workflow, có khả năng đọc hiểu tài liệu kỹ thuật tiếng Anh.',
    skills: ['Flutter', 'Dart', 'REST API', 'Git', 'State Management'],
    salaryMin: 14000000,
    salaryMax: 22000000,
    location: {
      city: 'Ho Chi Minh',
      district: 'District 7',
      country: 'Vietnam',
    },
    publishedOffsetDays: 0,
  },

  // =============================================
  // MID LEVEL — 2-4 years experience
  // =============================================
  {
    slug: 'seed-vn-mid-fullstack-engineer-viettel',
    title: 'Full-Stack Engineer (Node.js + React)',
    recruiterEmail: 'hr.viettel@seed.hr-platform.local',
    companySlug: 'seed-vn-viettel-solutions',
    categorySlug: 'seed-vn-software-engineering',
    shortDescription:
      'Phát triển end-to-end các sản phẩm nội bộ cho Viettel Digital.',
    description:
      'Thiết kế và phát triển full-stack web applications dùng Node.js/Express ở backend và React ở frontend. ' +
      'Yêu cầu: 2-4 năm kinh nghiệm, thành thạo TypeScript, hiểu biết về database design (PostgreSQL/MongoDB). ' +
      'Có kinh nghiệm với Docker, viết unit test, và CI/CD pipeline. ' +
      'Có khả năng làm việc độc lập và tự quản lý task theo sprint.',
    skills: [
      'TypeScript',
      'Node.js',
      'React',
      'PostgreSQL',
      'Docker',
      'Unit Testing',
    ],
    salaryMin: 25000000,
    salaryMax: 42000000,
    location: { city: 'Ha Noi', district: 'Cau Giay', country: 'Vietnam' },
    publishedOffsetDays: 2,
  },
  {
    slug: 'seed-vn-mid-sre-engineer-vnpay',
    title: 'Site Reliability Engineer (SRE)',
    recruiterEmail: 'hr.vnpay@seed.hr-platform.local',
    companySlug: 'seed-vn-vnpay',
    categorySlug: 'seed-vn-software-engineering',
    shortDescription: 'Đảm bảo uptime 99.99% cho hệ thống thanh toán quốc gia.',
    description:
      'Giám sát và đảm bảo reliability cho hệ thống payment processing xử lý hàng triệu giao dịch/ngày. ' +
      'Yêu cầu: 3+ năm kinh nghiệm, thành thạo Linux system administration, monitoring (Prometheus/Grafana). ' +
      'Có kinh nghiệm incident management, on-call rotation, post-mortem analysis. ' +
      'Biết scripting (Python/Bash), container orchestration (Kubernetes). ' +
      'Hiểu biết về networking, load balancing, và database replication.',
    skills: [
      'Linux',
      'Prometheus',
      'Grafana',
      'Kubernetes',
      'Python',
      'Incident Management',
    ],
    salaryMin: 30000000,
    salaryMax: 50000000,
    location: { city: 'Ha Noi', country: 'Vietnam' },
    publishedOffsetDays: 3,
  },

  // =============================================
  // SENIOR / STAFF LEVEL — 8+ years experience
  // =============================================
  {
    slug: 'seed-vn-solutions-architect-techcombank',
    title: 'Senior Solutions Architect (Cloud & Banking)',
    recruiterEmail: 'hr.tcb@seed.hr-platform.local',
    companySlug: 'seed-vn-techcombank',
    categorySlug: 'seed-vn-software-engineering',
    shortDescription:
      'Kiến trúc hệ thống lõi cho nền tảng digital banking thế hệ mới.',
    description:
      'Thiết kế kiến trúc tổng thể cho hệ thống core banking chạy trên cloud. ' +
      'Yêu cầu: 8+ năm kinh nghiệm phát triển phần mềm, trong đó ít nhất 3 năm ở vị trí architect. ' +
      'Thành thạo system design (high availability, scalability, disaster recovery). ' +
      'Kinh nghiệm sâu với AWS/GCP, microservices architecture, event-driven systems. ' +
      'Hiểu biết PCI-DSS compliance, data encryption at rest and in transit. ' +
      'Có khả năng lead cross-functional teams, mentoring junior/mid engineers. ' +
      'Ưu tiên ứng viên có kinh nghiệm fintech/banking.',
    skills: [
      'AWS',
      'System Design',
      'Microservices',
      'Kubernetes',
      'PCI-DSS',
      'Event-Driven Architecture',
    ],
    salaryMin: 80000000,
    salaryMax: 120000000,
    location: { city: 'Ha Noi', district: 'Ba Dinh', country: 'Vietnam' },
    publishedOffsetDays: 1,
  },
  {
    slug: 'seed-vn-staff-engineer-vng',
    title: 'Staff Engineer / Principal Engineer',
    recruiterEmail: 'hr.vng@seed.hr-platform.local',
    companySlug: 'seed-vn-vng-corporation',
    categorySlug: 'seed-vn-software-engineering',
    shortDescription:
      'Định hướng kỹ thuật cho toàn bộ platform engineering tại VNG.',
    description:
      'Làm việc trực tiếp với CTO và VP of Engineering để định hướng tech strategy. ' +
      'Yêu cầu: 10+ năm kinh nghiệm, có track record xây dựng hệ thống phục vụ hàng chục triệu users. ' +
      'Deep expertise trong distributed systems, database internals, performance engineering. ' +
      'Kinh nghiệm mentoring 10+ engineers, conducting architecture reviews, defining coding standards. ' +
      'Đã từng lead thành công ít nhất 2 large-scale system migrations hoặc ground-up platform builds. ' +
      'Excellent communication skills, khả năng translate business requirements thành technical roadmap.',
    skills: [
      'Distributed Systems',
      'System Design',
      'Tech Leadership',
      'Performance Engineering',
      'Go',
      'Java',
    ],
    salaryMin: 100000000,
    salaryMax: 150000000,
    location: {
      city: 'Ho Chi Minh',
      district: 'District 7',
      country: 'Vietnam',
    },
    publishedOffsetDays: 0,
  },
];

export const SEED_CANDIDATES: CandidateSeed[] = [
  {
    email: 'candidate.linh@seed.hr-platform.local',
    name: 'Nguyen Linh',
    phone: '+84901110001',
    city: 'Ha Noi',
    bio: 'Backend engineer focused on reliable distributed systems.',
    rawText:
      'Backend engineer with 5 years of experience in TypeScript, NestJS, PostgreSQL, and Kubernetes.',
    skills: ['TypeScript', 'NestJS', 'PostgreSQL', 'Kubernetes'],
  },
  {
    email: 'candidate.huy@seed.hr-platform.local',
    name: 'Tran Huy',
    phone: '+84901110002',
    city: 'Ho Chi Minh',
    bio: 'Data engineer with strong ETL and analytics delivery.',
    rawText:
      'Data engineer with 4 years experience in Python, SQL, Airflow, and Spark pipelines.',
    skills: ['Python', 'SQL', 'Airflow', 'Spark'],
  },
  {
    email: 'candidate.an@seed.hr-platform.local',
    name: 'Le An',
    phone: '+84901110003',
    city: 'Da Nang',
    bio: 'Frontend developer specializing in Next.js and performance.',
    rawText:
      'Frontend engineer with 4 years in React, Next.js, TypeScript, and design system implementation.',
    skills: ['React', 'Next.js', 'TypeScript'],
  },
  {
    email: 'candidate.quynh@seed.hr-platform.local',
    name: 'Pham Quynh',
    phone: '+84901110004',
    city: 'Ha Noi',
    bio: 'Product designer with fintech and e-commerce background.',
    rawText:
      'Product designer with 5 years in user research, wireframing, design systems, and Figma.',
    skills: ['Figma', 'Design Systems', 'User Research'],
  },
  {
    email: 'candidate.long@seed.hr-platform.local',
    name: 'Vu Long',
    phone: '+84901110005',
    city: 'Ho Chi Minh',
    bio: 'DevOps engineer focused on cloud infra and CI/CD.',
    rawText:
      'DevOps engineer with Terraform, AWS, Kubernetes, and GitHub Actions experience.',
    skills: ['Terraform', 'AWS', 'Kubernetes', 'CI/CD'],
  },

  // --- New diverse candidates ---
  {
    email: 'candidate.thao@seed.hr-platform.local',
    name: 'Hoang Thao',
    phone: '+84901110006',
    city: 'Ha Noi',
    bio: 'Sinh viên năm 4 ngành CNTT, đang tìm vị trí thực tập.',
    rawText:
      'Sinh viên năm 4 Đại học Bách Khoa Hà Nội ngành Công nghệ Thông tin. ' +
      'Đã hoàn thành các môn: Lập trình web, Cơ sở dữ liệu, OOP. ' +
      'Có 2 project trường: website bán hàng (HTML/CSS/JS/PHP) và app quản lý sinh viên (Java Swing). ' +
      'Biết cơ bản Git, HTML, CSS, JavaScript. Chưa có kinh nghiệm làm việc thực tế.',
    skills: ['HTML', 'CSS', 'JavaScript', 'Java', 'SQL', 'Git'],
  },
  {
    email: 'candidate.duc@seed.hr-platform.local',
    name: 'Nguyen Duc',
    phone: '+84901110007',
    city: 'Ho Chi Minh',
    bio: 'Junior QA engineer với 2 năm kinh nghiệm testing ứng dụng mobile.',
    rawText:
      'QA Engineer với 2 năm kinh nghiệm tại công ty startup fintech. ' +
      'Thành thạo manual testing, viết test case, sử dụng Postman và Jira. ' +
      'Bắt đầu học automation testing với Selenium và Playwright. ' +
      'Có kinh nghiệm test API, regression testing, và smoke testing. ' +
      'Hiểu quy trình Agile/Scrum, tham gia daily standup và sprint planning.',
    skills: [
      'Manual Testing',
      'Postman',
      'Jira',
      'Selenium',
      'API Testing',
      'Agile',
    ],
  },
  {
    email: 'candidate.mai@seed.hr-platform.local',
    name: 'Tran Mai',
    phone: '+84901110008',
    city: 'Ha Noi',
    bio: 'Senior Solutions Architect với 9 năm kinh nghiệm fintech và cloud.',
    rawText:
      'Solutions Architect với 9 năm kinh nghiệm phát triển phần mềm. ' +
      'Hiện tại là Technical Lead tại một ngân hàng số, quản lý team 12 người. ' +
      'Kinh nghiệm sâu: AWS (Solutions Architect Professional certified), Kubernetes, Terraform. ' +
      'Đã lead migration core banking system từ monolith sang microservices (18 tháng, 50+ services). ' +
      'Thành thạo system design, event-driven architecture, CQRS/Event Sourcing. ' +
      'Hiểu biết PCI-DSS, SOC2 compliance. Kinh nghiệm mentoring 10+ engineers. ' +
      'Kỹ năng: Java, Go, TypeScript, PostgreSQL, Redis, Kafka, AWS, GCP.',
    skills: [
      'AWS',
      'System Design',
      'Microservices',
      'Kubernetes',
      'Java',
      'Go',
      'Kafka',
      'PCI-DSS',
    ],
  },
];

export const SEED_APPLICATION_MATRIX: Array<{
  jobSlug: string;
  candidateEmail: string;
  matchScore: number;
  status: ApplicationStatus;
  notes: string;
}> = [
  {
    jobSlug: 'seed-vn-senior-backend-engineer-viettel',
    candidateEmail: 'candidate.linh@seed.hr-platform.local',
    matchScore: 91,
    status: ApplicationStatus.REVIEWING,
    notes: 'Strong architecture and API design profile.',
  },
  {
    jobSlug: 'seed-vn-devops-engineer-fpt',
    candidateEmail: 'candidate.long@seed.hr-platform.local',
    matchScore: 88,
    status: ApplicationStatus.INTERVIEW,
    notes: 'Good infra automation and cloud operations depth.',
  },
  {
    jobSlug: 'seed-vn-data-engineer-vng',
    candidateEmail: 'candidate.huy@seed.hr-platform.local',
    matchScore: 90,
    status: ApplicationStatus.REVIEWING,
    notes: 'Excellent ETL and Spark foundations.',
  },
  {
    jobSlug: 'seed-vn-frontend-react-engineer-fpt',
    candidateEmail: 'candidate.an@seed.hr-platform.local',
    matchScore: 89,
    status: ApplicationStatus.OFFER,
    notes: 'Great portfolio fit and strong frontend fundamentals.',
  },
  {
    jobSlug: 'seed-vn-product-designer-vnpay',
    candidateEmail: 'candidate.quynh@seed.hr-platform.local',
    matchScore: 86,
    status: ApplicationStatus.APPLIED,
    notes: 'Relevant fintech design experience.',
  },
  {
    jobSlug: 'seed-vn-payment-backend-engineer-vnpay',
    candidateEmail: 'candidate.linh@seed.hr-platform.local',
    matchScore: 84,
    status: ApplicationStatus.APPLIED,
    notes: 'Solid backend profile, needs deeper Java exposure.',
  },
  {
    jobSlug: 'seed-vn-mobile-engineer-momo',
    candidateEmail: 'candidate.an@seed.hr-platform.local',
    matchScore: 83,
    status: ApplicationStatus.REVIEWING,
    notes: 'Strong React experience translates well to RN.',
  },
  {
    jobSlug: 'seed-vn-data-analyst-techcombank',
    candidateEmail: 'candidate.huy@seed.hr-platform.local',
    matchScore: 82,
    status: ApplicationStatus.INTERVIEW,
    notes: 'Good analytical and BI reporting experience.',
  },
  {
    jobSlug: 'seed-vn-security-engineer-viettel',
    candidateEmail: 'candidate.long@seed.hr-platform.local',
    matchScore: 79,
    status: ApplicationStatus.APPLIED,
    notes: 'Security fundamentals good, SOC depth moderate.',
  },

  // --- Cross-level matching scenarios ---

  // Intern → Intern (expected: match tốt)
  {
    jobSlug: 'seed-vn-frontend-intern-fpt',
    candidateEmail: 'candidate.thao@seed.hr-platform.local',
    matchScore: 88,
    status: ApplicationStatus.REVIEWING,
    notes: 'Sinh viên CNTT, có project web trường, skill HTML/CSS/JS phù hợp.',
  },
  {
    jobSlug: 'seed-vn-backend-intern-techcombank',
    candidateEmail: 'candidate.thao@seed.hr-platform.local',
    matchScore: 82,
    status: ApplicationStatus.APPLIED,
    notes: 'Biết Java và SQL cơ bản, phù hợp yêu cầu intern.',
  },

  // Intern apply Senior (expected: score rất thấp)
  {
    jobSlug: 'seed-vn-solutions-architect-techcombank',
    candidateEmail: 'candidate.thao@seed.hr-platform.local',
    matchScore: 18,
    status: ApplicationStatus.REJECTED,
    notes: 'Không đủ kinh nghiệm cho vị trí senior architect (yêu cầu 8+ năm).',
  },
  {
    jobSlug: 'seed-vn-staff-engineer-vng',
    candidateEmail: 'candidate.thao@seed.hr-platform.local',
    matchScore: 12,
    status: ApplicationStatus.REJECTED,
    notes: 'Profile không phù hợp, thiếu toàn bộ yêu cầu staff-level.',
  },

  // Junior apply cùng level (expected: match khá)
  {
    jobSlug: 'seed-vn-junior-qa-engineer-momo',
    candidateEmail: 'candidate.duc@seed.hr-platform.local',
    matchScore: 91,
    status: ApplicationStatus.INTERVIEW,
    notes: '2 năm QA, thành thạo manual testing và Postman, rất phù hợp.',
  },

  // Junior apply Mid (expected: partial match)
  {
    jobSlug: 'seed-vn-mid-fullstack-engineer-viettel',
    candidateEmail: 'candidate.duc@seed.hr-platform.local',
    matchScore: 35,
    status: ApplicationStatus.REJECTED,
    notes: 'Profile QA, thiếu kinh nghiệm full-stack development.',
  },

  // Senior apply Senior (expected: excellent match)
  {
    jobSlug: 'seed-vn-solutions-architect-techcombank',
    candidateEmail: 'candidate.mai@seed.hr-platform.local',
    matchScore: 95,
    status: ApplicationStatus.OFFER,
    notes:
      '9 năm kinh nghiệm, AWS certified, đã lead migration lớn. Fit tuyệt vời.',
  },
  {
    jobSlug: 'seed-vn-staff-engineer-vng',
    candidateEmail: 'candidate.mai@seed.hr-platform.local',
    matchScore: 87,
    status: ApplicationStatus.REVIEWING,
    notes: 'Profile rất mạnh, cần thêm đánh giá về tech leadership scope.',
  },

  // Senior apply Intern (expected: overqualified)
  {
    jobSlug: 'seed-vn-frontend-intern-fpt',
    candidateEmail: 'candidate.mai@seed.hr-platform.local',
    matchScore: 72,
    status: ApplicationStatus.REJECTED,
    notes:
      'Overqualified — 9 năm kinh nghiệm apply intern. Skill match tốt nhưng level không phù hợp.',
  },

  // Senior apply Mid-level (expected: good match nhưng overqualified warning)
  {
    jobSlug: 'seed-vn-mid-sre-engineer-vnpay',
    candidateEmail: 'candidate.mai@seed.hr-platform.local',
    matchScore: 83,
    status: ApplicationStatus.APPLIED,
    notes: 'Skill phù hợp nhưng có thể overqualified cho mid-level.',
  },

  // Intern apply Junior (expected: gần đạt nhưng thiếu kinh nghiệm)
  {
    jobSlug: 'seed-vn-junior-mobile-developer-vng',
    candidateEmail: 'candidate.thao@seed.hr-platform.local',
    matchScore: 38,
    status: ApplicationStatus.APPLIED,
    notes: 'Chưa có kinh nghiệm Flutter, chỉ có JS cơ bản.',
  },
];

export function buildPrismaClient(): PrismaClient {
  const connectionString = process.env['DATABASE_URL'];
  if (!connectionString) {
    throw new Error('DATABASE_URL is required');
  }

  return new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
  });
}

export async function hashPassword(
  rawPassword = DEMO_PASSWORD,
): Promise<string> {
  return bcrypt.hash(rawPassword, 10);
}
