import { ApplicationStatus, JobStatus, PrismaClient, UserRole } from '@prisma/client';
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
  location: { city: string; district?: string; country: 'Vietnam'; remote?: boolean };
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
  { slug: 'seed-vn-software-engineering', name: 'Software Engineering', iconKey: 'fa-code', sortOrder: 1 },
  { slug: 'seed-vn-data-ai', name: 'Data & AI', iconKey: 'fa-chart-line', sortOrder: 2 },
  { slug: 'seed-vn-product-design', name: 'Product & Design', iconKey: 'fa-pen-nib', sortOrder: 3 },
  { slug: 'seed-vn-fintech', name: 'Fintech & Banking', iconKey: 'fa-building-columns', sortOrder: 4 },
  { slug: 'seed-vn-cybersecurity', name: 'Cybersecurity', iconKey: 'fa-shield-halved', sortOrder: 5 },
  { slug: 'seed-vn-marketing-growth', name: 'Marketing & Growth', iconKey: 'fa-bullhorn', sortOrder: 6 },
] as const;

export const SEED_JOBS: JobSeed[] = [
  {
    slug: 'seed-vn-senior-backend-engineer-viettel',
    title: 'Senior Backend Engineer (Microservices)',
    recruiterEmail: 'hr.viettel@seed.hr-platform.local',
    companySlug: 'seed-vn-viettel-solutions',
    categorySlug: 'seed-vn-software-engineering',
    shortDescription: 'Build high-throughput APIs for telecom-scale digital services.',
    description: 'Design and deliver microservice-based backend systems with NestJS, Kafka, and PostgreSQL. Collaborate with platform and SRE teams on reliability and observability.',
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
    description: 'Implement scalable UI architecture, optimize rendering performance, and collaborate with UX designers and backend engineers.',
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
    shortDescription: 'Build resilient data pipelines for product analytics at scale.',
    description: 'Develop and maintain data pipelines using Python, Airflow, and BigQuery/Spark. Support analytics and recommendation workloads.',
    skills: ['Python', 'SQL', 'Airflow', 'Spark'],
    salaryMin: 35000000,
    salaryMax: 65000000,
    location: { city: 'Ho Chi Minh', district: 'District 7', country: 'Vietnam' },
    publishedOffsetDays: 2,
  },
  {
    slug: 'seed-vn-product-designer-vnpay',
    title: 'Senior Product Designer (Fintech)',
    recruiterEmail: 'hr.vnpay@seed.hr-platform.local',
    companySlug: 'seed-vn-vnpay',
    categorySlug: 'seed-vn-product-design',
    shortDescription: 'Design payment and checkout experiences for millions of users.',
    description: 'Lead UX discovery, produce high-fidelity prototypes, and align design decisions with product and engineering constraints.',
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
    description: 'Implement security controls, threat detection, and incident response automation across distributed systems.',
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
    shortDescription: 'Ship recommendation and ranking models for consumer apps.',
    description: 'Productionize ML pipelines, deploy models, and monitor model quality in online serving environments.',
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
    description: 'Develop core payment gateways and settlement services with strict reliability and security requirements.',
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
    shortDescription: 'Drive growth campaigns for digital wallet acquisition and retention.',
    description: 'Own end-to-end growth strategy, run experimentation, and optimize user funnel metrics across channels.',
    skills: ['Performance Marketing', 'CRM', 'A/B Testing', 'Analytics'],
    salaryMin: 32000000,
    salaryMax: 58000000,
    location: { city: 'Ho Chi Minh', district: 'District 1', country: 'Vietnam' },
    publishedOffsetDays: 4,
  },
  {
    slug: 'seed-vn-devops-engineer-fpt',
    title: 'DevOps Engineer (Cloud Platform)',
    recruiterEmail: 'hr.fpt@seed.hr-platform.local',
    companySlug: 'seed-vn-fpt-software',
    categorySlug: 'seed-vn-software-engineering',
    shortDescription: 'Scale CI/CD and cloud infrastructure for global projects.',
    description: 'Build automation for deployments, observability, and Kubernetes operations for enterprise products.',
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
    shortDescription: 'Turn transaction data into lending and retention insights.',
    description: 'Build analytical models, dashboards, and reporting pipelines to support strategic decisions in retail banking.',
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
    description: 'Develop and optimize React Native features for scale, reliability, and smooth UX.',
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
    shortDescription: 'Design dashboards and B2B workflows for enterprise clients.',
    description: 'Translate business requirements into intuitive user journeys and maintain consistency across design systems.',
    skills: ['Figma', 'UX Research', 'Design Tokens', 'Prototyping'],
    salaryMin: 25000000,
    salaryMax: 45000000,
    location: { city: 'Ha Noi', country: 'Vietnam' },
    publishedOffsetDays: 4,
  },
];

export const SEED_CANDIDATES: CandidateSeed[] = [
  {
    email: 'candidate.linh@seed.hr-platform.local',
    name: 'Nguyen Linh',
    phone: '+84901110001',
    city: 'Ha Noi',
    bio: 'Backend engineer focused on reliable distributed systems.',
    rawText: 'Backend engineer with 5 years of experience in TypeScript, NestJS, PostgreSQL, and Kubernetes.',
    skills: ['TypeScript', 'NestJS', 'PostgreSQL', 'Kubernetes'],
  },
  {
    email: 'candidate.huy@seed.hr-platform.local',
    name: 'Tran Huy',
    phone: '+84901110002',
    city: 'Ho Chi Minh',
    bio: 'Data engineer with strong ETL and analytics delivery.',
    rawText: 'Data engineer with 4 years experience in Python, SQL, Airflow, and Spark pipelines.',
    skills: ['Python', 'SQL', 'Airflow', 'Spark'],
  },
  {
    email: 'candidate.an@seed.hr-platform.local',
    name: 'Le An',
    phone: '+84901110003',
    city: 'Da Nang',
    bio: 'Frontend developer specializing in Next.js and performance.',
    rawText: 'Frontend engineer with 4 years in React, Next.js, TypeScript, and design system implementation.',
    skills: ['React', 'Next.js', 'TypeScript'],
  },
  {
    email: 'candidate.quynh@seed.hr-platform.local',
    name: 'Pham Quynh',
    phone: '+84901110004',
    city: 'Ha Noi',
    bio: 'Product designer with fintech and e-commerce background.',
    rawText: 'Product designer with 5 years in user research, wireframing, design systems, and Figma.',
    skills: ['Figma', 'Design Systems', 'User Research'],
  },
  {
    email: 'candidate.long@seed.hr-platform.local',
    name: 'Vu Long',
    phone: '+84901110005',
    city: 'Ho Chi Minh',
    bio: 'DevOps engineer focused on cloud infra and CI/CD.',
    rawText: 'DevOps engineer with Terraform, AWS, Kubernetes, and GitHub Actions experience.',
    skills: ['Terraform', 'AWS', 'Kubernetes', 'CI/CD'],
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

export async function hashPassword(rawPassword = DEMO_PASSWORD): Promise<string> {
  return bcrypt.hash(rawPassword, 10);
}
