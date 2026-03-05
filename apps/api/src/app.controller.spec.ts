import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaService } from './prisma/prisma.service';

describe('AppController', () => {
  let appController: AppController;
  let prismaService: { user: { count: jest.Mock } };

  beforeEach(async () => {
    prismaService = {
      user: {
        count: jest.fn().mockResolvedValue(3),
      },
    };

    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        AppService,
        {
          provide: PrismaService,
          useValue: prismaService,
        },
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(appController.getHello()).toBe('Hello World!');
    });
  });

  describe('health', () => {
    it('should return health response with user count', async () => {
      await expect(appController.healthCheck()).resolves.toEqual({
        status: 'ok',
        database: 'connected',
        users: 3,
      });
    });
  });
});
