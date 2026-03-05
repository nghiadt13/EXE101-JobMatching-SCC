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

async function main() {
  const hashedPassword = await bcrypt.hash('password123', 10);

  await prisma.$transaction([
    prisma.application.deleteMany(),
    prisma.cV.deleteMany(),
    prisma.job.deleteMany(),
    prisma.candidate.deleteMany(),
    prisma.user.deleteMany(),
    prisma.skill.deleteMany(),
  ]);

  const admin = await prisma.user.create({
    data: {
      email: 'admin@example.com',
      password: hashedPassword,
      name: 'Admin User',
      role: UserRole.ADMIN,
    },
  });

  const recruiter = await prisma.user.create({
    data: {
      email: 'recruiter@example.com',
      password: hashedPassword,
      name: 'John Recruiter',
      role: UserRole.RECRUITER,
    },
  });

  const candidateUser = await prisma.user.create({
    data: {
      email: 'candidate@example.com',
      password: hashedPassword,
      name: 'Jane Candidate',
      role: UserRole.CANDIDATE,
    },
  });

  const candidate = await prisma.candidate.create({
    data: {
      userId: candidateUser.id,
      phone: '+84901234567',
      location: { city: 'Ho Chi Minh', country: 'Vietnam' },
      bio: 'Experienced software developer with 5 years in web development.',
    },
  });

  const cv = await prisma.cV.create({
    data: {
      candidateId: candidate.id,
      fileName: 'jane-cv.pdf',
      filePath: '/uploads/cvs/jane-cv.pdf',
      fileSize: 1024000,
      mimeType: 'application/pdf',
      parsedData: {
        contact: {
          email: 'candidate@example.com',
          phone: '+84901234567',
        },
        experience: [
          {
            title: 'Senior Developer',
            company: 'Tech Corp',
            duration: '2020-2025',
            description: 'Led development of web applications',
          },
        ],
        education: [
          {
            degree: 'Bachelor of Computer Science',
            school: 'University of Technology',
            year: '2019',
          },
        ],
      },
      skills: ['Python', 'Django', 'PostgreSQL', 'React', 'TypeScript'],
      isPrimary: true,
    },
  });

  const job1 = await prisma.job.create({
    data: {
      recruiterId: recruiter.id,
      title: 'Senior Backend Developer',
      slug: 'senior-backend-developer',
      description: 'We are looking for an experienced backend developer.',
      skills: ['Python', 'Django', 'PostgreSQL', 'Docker'],
      location: { city: 'Ho Chi Minh', country: 'Vietnam', remote: false },
      salaryMin: 2000,
      salaryMax: 3000,
      employmentType: 'FULL_TIME',
      status: JobStatus.PUBLISHED,
      publishedAt: new Date(),
    },
  });

  const job2 = await prisma.job.create({
    data: {
      recruiterId: recruiter.id,
      title: 'Frontend Developer',
      slug: 'frontend-developer',
      description: 'Join our team to build user interfaces.',
      skills: ['React', 'TypeScript', 'Next.js', 'Tailwind CSS'],
      location: { city: 'Ha Noi', country: 'Vietnam', remote: true },
      salaryMin: 1500,
      salaryMax: 2500,
      employmentType: 'FULL_TIME',
      status: JobStatus.PUBLISHED,
      publishedAt: new Date(),
    },
  });

  await prisma.application.createMany({
    data: [
      {
        jobId: job1.id,
        candidateId: candidate.id,
        cvId: cv.id,
        matchScore: 78.5,
        tfidfScore: 0.72,
        skillsScore: 0.85,
        status: ApplicationStatus.APPLIED,
      },
      {
        jobId: job2.id,
        candidateId: candidate.id,
        cvId: cv.id,
        matchScore: 65,
        tfidfScore: 0.6,
        skillsScore: 0.7,
        status: ApplicationStatus.REVIEWING,
        notes: 'Good candidate, schedule interview',
      },
    ],
  });

  await prisma.skill.createMany({
    data: [
      { name: 'Python', category: 'PROGRAMMING' },
      { name: 'JavaScript', category: 'PROGRAMMING' },
      { name: 'TypeScript', category: 'PROGRAMMING' },
      { name: 'Django', category: 'FRAMEWORK' },
      { name: 'React', category: 'FRAMEWORK' },
      { name: 'Next.js', category: 'FRAMEWORK' },
      { name: 'PostgreSQL', category: 'DATABASE' },
      { name: 'MongoDB', category: 'DATABASE' },
      { name: 'Docker', category: 'TOOL' },
      { name: 'Git', category: 'TOOL' },
    ],
  });

  console.log('Seed completed');
  console.log(`Admin: ${admin.email} / password123`);
  console.log(`Recruiter: ${recruiter.email} / password123`);
  console.log(`Candidate: ${candidateUser.email} / password123`);
}

main()
  .catch((error) => {
    console.error('Seed failed', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
