import { Test, TestingModule } from '@nestjs/testing';
import { UserRole } from '@prisma/client';
import { HomepageController } from './homepage.controller';
import { HomepageService } from './homepage.service';

describe('HomepageController', () => {
  let controller: HomepageController;
  let homepageService: { getHomepage: jest.Mock };

  beforeEach(async () => {
    homepageService = {
      getHomepage: jest.fn().mockResolvedValue({
        currentUser: null,
        hero: {
          headline: 'Find Your Dream Job',
          subheadline: 'Subheadline',
          backgroundImageUrl: 'https://img.example/hero.png',
          popularKeywords: [],
        },
        marketStats: {
          asOfDate: '2026-03-13',
          newJobs24h: 10,
          activeJobs: 100,
          hiringCompanies: 30,
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
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [HomepageController],
      providers: [
        {
          provide: HomepageService,
          useValue: homepageService,
        },
      ],
    }).compile();

    controller = module.get<HomepageController>(HomepageController);
  });

  it('passes guest user context to service', async () => {
    await controller.getHomepage(null, undefined);

    expect(homepageService.getHomepage).toHaveBeenCalledWith(null, undefined);
  });

  it('passes authenticated user and location to service', async () => {
    await controller.getHomepage(
      { sub: 'user-1', role: UserRole.CANDIDATE },
      'hcm',
    );

    expect(homepageService.getHomepage).toHaveBeenCalledWith(
      { sub: 'user-1', role: UserRole.CANDIDATE },
      'hcm',
    );
  });
});
