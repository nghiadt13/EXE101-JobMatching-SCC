import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { ApplicationStatus, JobStatus, PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
const connectionString = process.env['DATABASE_URL'];
if (!connectionString) {
  throw new Error('DATABASE_URL is required to run seed');
}
const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});
const DEFAULT_PASSWORD = 'password123';
type DemoUser = { id: string; email: string; name: string; role: UserRole };
async function createUser(email: string, name: string, role: UserRole, password: string) {
  return prisma.user.create({
    data: { email, name, role, password },
    select: { id: true, email: true, name: true, role: true },
  });
}

async function main() {
  const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, 10);

  await prisma.$transaction([
    prisma.application.deleteMany(),
    prisma.cV.deleteMany(),
    prisma.job.deleteMany(),
    prisma.candidate.deleteMany(),
    prisma.user.deleteMany(),
    prisma.skill.deleteMany(),
  ]);

  const users = (await Promise.all([
    createUser('admin@example.com', 'Admin User', UserRole.ADMIN, hashedPassword),
    createUser('recruiter.alpha@example.com', 'Recruiter Alpha', UserRole.RECRUITER, hashedPassword),
    createUser('recruiter.beta@example.com', 'Recruiter Beta', UserRole.RECRUITER, hashedPassword),
    createUser('candidate.anna@example.com', 'Anna Candidate', UserRole.CANDIDATE, hashedPassword),
    createUser('candidate.bao@example.com', 'Bao Candidate', UserRole.CANDIDATE, hashedPassword),
  ])) as DemoUser[];
  const recruiterAlpha = users.find((user) => user.email === 'recruiter.alpha@example.com');
  const recruiterBeta = users.find((user) => user.email === 'recruiter.beta@example.com');
  const candidateAnnaUser = users.find((user) => user.email === 'candidate.anna@example.com');
  const candidateBaoUser = users.find((user) => user.email === 'candidate.bao@example.com');

  if (!recruiterAlpha || !recruiterBeta || !candidateAnnaUser || !candidateBaoUser) {
    throw new Error('Failed to initialize demo users');
  }
  const [candidateAnna, candidateBao] = await Promise.all([
    prisma.candidate.create({
      data: {
        userId: candidateAnnaUser.id,
        phone: '+84901111111',
        location: { city: 'Ho Chi Minh', country: 'Vietnam' },
        bio: 'Backend-focused engineer with production API experience.',
      },
    }),
    prisma.candidate.create({
      data: {
        userId: candidateBaoUser.id,
        phone: '+84902222222',
        location: { city: 'Da Nang', country: 'Vietnam' },
        bio: 'Fullstack engineer with strong frontend product delivery.',
      },
    }),
  ]);

  const [cvAnna, cvBao] = await Promise.all([
    prisma.cV.create({
      data: {
        candidateId: candidateAnna.id,
        fileName: 'anna-backend-cv.pdf',
        filePath: '/uploads/cvs/anna-backend-cv.pdf',
        fileSize: 900000,
        mimeType: 'application/pdf',
        parsedData: { parseStatus: 'pending_apply' },
        rawText: 'Anna is a Backend engineer with 5 years of experience using TypeScript, NestJS, and PostgreSQL. She has a bachelors degree in computer science.',
        skills: [],
        isPrimary: true,
      },
    }),
    prisma.cV.create({
      data: {
        candidateId: candidateBao.id,
        fileName: 'bao-fullstack-cv.pdf',
        filePath: '/uploads/cvs/bao-fullstack-cv.pdf',
        fileSize: 930000,
        mimeType: 'application/pdf',
        parsedData: { parseStatus: 'pending_apply' },
        rawText: 'Bao is a Fullstack engineer specialized in React, Next.js, and TypeScript. Has 4 years frontend experience.',
        skills: [],
        isPrimary: true,
      },
    }),
  ]);

  const now = new Date();
  const [jobBackendPublished, jobFrontendDraft, jobQaClosed, jobDataPublished] = await Promise.all([
    prisma.job.create({
      data: {
        recruiterId: recruiterAlpha.id,
        title: 'Backend Engineer',
        slug: 'backend-engineer-alpha',
        description: 'Build and maintain core backend APIs.',
        skills: ['TypeScript', 'NestJS', 'PostgreSQL'],
        location: { city: 'Ho Chi Minh', remote: false },
        salaryMin: 1800,
        salaryMax: 2600,
        employmentType: 'FULL_TIME',
        status: JobStatus.PUBLISHED,
        publishedAt: now,
      },
    }),
    prisma.job.create({
      data: {
        recruiterId: recruiterAlpha.id,
        title: 'Frontend Engineer Draft',
        slug: 'frontend-engineer-draft-alpha',
        description: 'Prepare hiring plan for frontend role.',
        skills: ['React', 'Next.js', 'TypeScript'],
        location: { city: 'Remote', remote: true },
        salaryMin: 1600,
        salaryMax: 2400,
        employmentType: 'FULL_TIME',
        status: JobStatus.DRAFT,
      },
    }),
    prisma.job.create({
      data: {
        recruiterId: recruiterAlpha.id,
        title: 'QA Engineer Closed',
        slug: 'qa-engineer-closed-alpha',
        description: 'Position has been filled.',
        skills: ['Testing', 'Playwright', 'API Testing'],
        location: { city: 'Ho Chi Minh', remote: true },
        salaryMin: 1400,
        salaryMax: 2000,
        employmentType: 'FULL_TIME',
        status: JobStatus.CLOSED,
        publishedAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
        closedAt: now,
      },
    }),
    prisma.job.create({
      data: {
        recruiterId: recruiterBeta.id,
        title: 'Data Engineer',
        slug: 'data-engineer-beta',
        description: 'Build ETL and analytics-ready datasets.',
        skills: ['Python', 'SQL', 'Airflow'],
        location: { city: 'Ha Noi', remote: true },
        salaryMin: 1700,
        salaryMax: 2500,
        employmentType: 'FULL_TIME',
        status: JobStatus.PUBLISHED,
        publishedAt: now,
      },
    }),
  ]);

  await prisma.application.createMany({
    data: [
      {
        jobId: jobDataPublished.id,
        candidateId: candidateAnna.id,
        cvId: cvAnna.id,
        matchScore: 76,
        matchingSnapshot: {
          version: 'schema_v1',
          scoreBreakdown: { mustHave: 78, niceToHave: 72, experience: 75, education: 80, language: 100, location: 90, final: 76 },
          requirements: [],
          strengths: ['Strong Python and SQL fundamentals'],
          gaps: ['Airflow production depth not explicit'],
          warnings: [],
        },
        status: ApplicationStatus.APPLIED,
      },
      {
        jobId: jobBackendPublished.id,
        candidateId: candidateAnna.id,
        cvId: cvAnna.id,
        matchScore: 84,
        matchingSnapshot: {
          version: 'matching_snapshot_v2',
          scoreBreakdown: { skillScore: 85, constraintScore: 100, final: 87 },
          requirements: [
            { requirementId: 'critical-skill-typescript', status: 'met', evidence: ['TypeScript, NestJS'], confidence: 'high' }
          ],
          constraints: [
            { constraintId: 'constraint-experience-year', met: true, evidence: '5 years experience' }
          ],
          candidateSummary: {
            headline: 'Backend engineer',
            totalExperienceMonths: 60,
            relevantExperienceMonths: 60,
            skills: ['TypeScript', 'NestJS', 'PostgreSQL'],
            location: { city: 'Ho Chi Minh', country: 'Vietnam' }
          },
          strengths: ['TypeScript and NestJS experience aligns well'],
          gaps: ['Limited explicit cloud deployment evidence'],
          constraintsFailed: [],
          warnings: [],
        },
        status: ApplicationStatus.REVIEWING,
        notes: 'Strong backend profile',
      },
      {
        jobId: jobDataPublished.id,
        candidateId: candidateBao.id,
        cvId: cvBao.id,
        matchScore: 71,
        matchingSnapshot: {
          version: 'schema_v1',
          scoreBreakdown: { mustHave: 74, niceToHave: 68, experience: 70, education: 75, language: 90, location: 85, final: 71 },
          requirements: [],
          strengths: ['Solid analytics workflow experience'],
          gaps: ['ETL tooling breadth could be stronger'],
          warnings: [],
        },
        status: ApplicationStatus.INTERVIEW,
        notes: 'Interview scheduled Friday',
      },
      {
        jobId: jobBackendPublished.id,
        candidateId: candidateBao.id,
        cvId: cvBao.id,
        matchScore: 79,
        matchingSnapshot: {
          version: 'schema_v1',
          scoreBreakdown: { mustHave: 80, niceToHave: 74, experience: 78, education: 75, language: 95, location: 90, final: 79 },
          requirements: [],
          strengths: ['Backend problem-solving and API fundamentals'],
          gaps: ['Less direct NestJS depth than top candidates'],
          warnings: [],
        },
        status: ApplicationStatus.OFFER,
        notes: 'Offer under final approval',
      },
      {
        jobId: jobQaClosed.id,
        candidateId: candidateAnna.id,
        cvId: cvAnna.id,
        matchScore: 63,
        matchingSnapshot: {
          version: 'schema_v1',
          scoreBreakdown: { mustHave: 64, niceToHave: 60, experience: 62, education: 80, language: 100, location: 90, final: 63 },
          requirements: [],
          strengths: ['Good automation discipline'],
          gaps: ['Role closed before further review'],
          warnings: [],
        },
        status: ApplicationStatus.REJECTED,
        notes: 'Closed role',
      },
    ],
  });

  await prisma.skill.createMany({
    data: [
      { name: 'TypeScript', category: 'PROGRAMMING' },
      { name: 'Python', category: 'PROGRAMMING' },
      { name: 'SQL', category: 'DATABASE' },
      { name: 'PostgreSQL', category: 'DATABASE' },
      { name: 'NestJS', category: 'FRAMEWORK' },
      { name: 'React', category: 'FRAMEWORK' },
      { name: 'Next.js', category: 'FRAMEWORK' },
      { name: 'Airflow', category: 'TOOL' },
      { name: 'Playwright', category: 'TOOL' },
      { name: 'API Testing', category: 'TOOL' },
    ],
  });

  console.log('Seed completed with deterministic demo dataset');
  users.forEach((user) => {
    console.log(`${user.role}: ${user.email} / ${DEFAULT_PASSWORD}`);
  });
}

main()
  .catch((error) => {
    console.error('Seed failed', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
