import { Test, TestingModule } from '@nestjs/testing';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { HomepageCacheService } from './homepage-cache.service';
import { HomepageService } from './homepage.service';

describe('HomepageService', () => {
  let service: HomepageService;
  let prismaService: {
    homepageContent: { findUnique: jest.Mock };
    marketStatDaily: { findFirst: jest.Mock; findMany: jest.Mock };
    job: { findMany: jest.Mock };
    company: { findMany: jest.Mock };
    jobCategory: { findMany: jest.Mock };
    savedJob: { findMany: jest.Mock };
    user: { findFirst: jest.Mock };
    industryDemandDaily: { findMany: jest.Mock };
    notification: { count: jest.Mock };
  };
  let homepageCache: {
    get: jest.Mock;
    set: jest.Mock;
    clearAll: jest.Mock;
    clearByUser: jest.Mock;
  };

  beforeEach(async () => {
    prismaService = {
      homepageContent: {
        findUnique: jest.fn().mockResolvedValue(null),
      },
      marketStatDaily: {
        findFirst: jest.fn().mockResolvedValue({
          statDate: new Date('2026-03-13T00:00:00.000Z'),
          newJobs24h: 25,
          activeJobs: 640,
          hiringCompanies: 120,
        }),
        findMany: jest.fn().mockResolvedValue([
          {
            statDate: new Date('2026-03-10T00:00:00.000Z'),
            newJobs24h: 18,
          },
          {
            statDate: new Date('2026-03-11T00:00:00.000Z'),
            newJobs24h: 22,
          },
          {
            statDate: new Date('2026-03-12T00:00:00.000Z'),
            newJobs24h: 20,
          },
        ]),
      },
      job: {
        findMany: jest
          .fn()
          .mockImplementation(
            ({
              select,
            }: {
              select?: { id?: boolean; title?: boolean; location?: boolean };
            }) => {
              if (select?.id && select?.title) {
                return Promise.resolve([
                  {
                    id: 'job-1',
                    slug: 'backend-engineer',
                    title: 'Backend Engineer',
                    description: 'Build APIs and services',
                    shortDescription: null,
                    salaryMin: 20000000,
                    salaryMax: 40000000,
                    location: { city: 'Ho Chi Minh City', remote: false },
                    company: {
                      name: 'Acme Tech',
                      logoUrl: 'https://img.example/logo.png',
                      iconKey: 'fa-briefcase',
                    },
                  },
                ]);
              }

              if (select?.location) {
                return Promise.resolve([
                  { location: { city: 'Ho Chi Minh City', remote: false } },
                  { location: { city: 'Da Nang', remote: false } },
                  { location: { city: 'Ho Chi Minh City', remote: false } },
                  { location: { remote: true } },
                ]);
              }
              return Promise.resolve([]);
            },
          ),
      },
      company: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'company-1',
            name: 'Acme Tech',
            logoUrl: 'https://img.example/logo.png',
            iconKey: 'fa-building',
          },
        ]),
      },
      jobCategory: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'cat-1',
            slug: 'software-development',
            name: 'Software Development',
            iconKey: 'fa-code',
            jobs: [{ id: 'job-1' }, { id: 'job-2' }],
          },
        ]),
      },
      savedJob: {
        findMany: jest.fn().mockResolvedValue([{ jobId: 'job-1' }]),
      },
      user: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'user-1',
          name: 'Candidate One',
          avatar: 'https://img.example/avatar.png',
          planName: 'Pro Plan',
          role: UserRole.CANDIDATE,
        }),
      },
      industryDemandDaily: {
        findMany: jest.fn().mockResolvedValue([
          {
            industryKey: 'software',
            industryLabel: 'Software',
            demandValue: 88,
            sortOrder: 1,
          },
        ]),
      },
      notification: {
        count: jest.fn().mockResolvedValue(3),
      },
    };

    homepageCache = {
      get: jest.fn().mockReturnValue(null),
      set: jest.fn(),
      clearAll: jest.fn(),
      clearByUser: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HomepageService,
        {
          provide: PrismaService,
          useValue: prismaService,
        },
        {
          provide: HomepageCacheService,
          useValue: homepageCache,
        },
      ],
    }).compile();

    service = module.get<HomepageService>(HomepageService);
  });

  it('returns complete homepage payload for guest users', async () => {
    const result = await service.getHomepage(null, undefined);

    expect(result.currentUser).toBeNull();
    expect(result.hero.headline).toBe('Find Your Dream Job');
    expect(result.marketStats).toEqual(
      expect.objectContaining({
        newJobs24h: 25,
        activeJobs: 640,
        hiringCompanies: 120,
      }),
    );
    expect(result.featuredJobs).toHaveLength(1);
    expect(result.featuredJobs[0]).toEqual(
      expect.objectContaining({
        id: 'job-1',
        isSaved: false,
        salaryText: '20 - 40 million VND',
        locationLabel: 'Ho Chi Minh City',
      }),
    );
    expect(result.categories[0]).toEqual(
      expect.objectContaining({
        id: 'cat-1',
        openJobsCount: 2,
      }),
    );
    expect(result.locationFilters).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ label: 'Ho Chi Minh City', jobCount: 2 }),
        expect.objectContaining({ label: 'Da Nang', jobCount: 1 }),
      ]),
    );
    expect(homepageCache.set).toHaveBeenCalledTimes(1);
  });

  it('returns user block and saved flags for authenticated users', async () => {
    const mockUser = {
      sub: 'user-1',
      role: UserRole.CANDIDATE,
      email: 'test@example.com',
    };
    const result = await service.getHomepage(mockUser, undefined);

    expect(result.currentUser).toEqual(
      expect.objectContaining({
        id: 'user-1',
        name: 'Candidate One',
        planName: 'Pro Plan',
        unreadNotificationCount: 3,
      }),
    );
    expect(result.featuredJobs[0]?.isSaved).toBe(true);
    expect(prismaService.savedJob.findMany).toHaveBeenCalledWith({
      where: {
        userId: 'user-1',
        jobId: { in: ['job-1'] },
      },
      select: { jobId: true },
    });
  });

  it('returns cached payload when cache hit exists', async () => {
    const cachedPayload = {
      currentUser: null,
      hero: {
        headline: 'cached',
        subheadline: 'cached',
        backgroundImageUrl: 'https://cached',
        popularKeywords: [],
      },
      marketStats: {
        asOfDate: '2026-03-13',
        newJobs24h: 1,
        activeJobs: 1,
        hiringCompanies: 1,
      },
      jobGrowthSeries: [],
      demandByIndustry: [],
      trustedCompanies: [],
      categories: [],
      locationFilters: [],
      featuredJobs: [],
      footer: {
        quickLinks: [],
        supportLinks: [],
        socialLinks: [],
        copyrightText: '',
      },
      generatedAt: new Date().toISOString(),
    };
    homepageCache.get.mockReturnValue(cachedPayload);

    const result = await service.getHomepage(null, 'hcm');

    expect(result.hero.headline).toBe('cached');
    expect(prismaService.job.findMany).not.toHaveBeenCalled();
    expect(homepageCache.set).not.toHaveBeenCalled();
  });
});
