import { Test, TestingModule } from '@nestjs/testing';
import { UserRole } from '@prisma/client';
import { NotificationsController } from './notifications.controller';
import { HomepageService } from './homepage.service';

describe('NotificationsController', () => {
  let controller: NotificationsController;
  let homepageService: { getUnreadNotificationCount: jest.Mock };

  beforeEach(async () => {
    homepageService = {
      getUnreadNotificationCount: jest.fn().mockResolvedValue(5),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotificationsController],
      providers: [
        {
          provide: HomepageService,
          useValue: homepageService,
        },
      ],
    }).compile();

    controller = module.get<NotificationsController>(NotificationsController);
  });

  it('returns unread notification count', async () => {
    const result = await controller.getUnreadCount({
      sub: 'mockUserId',
      role: UserRole.CANDIDATE,
      email: 'test@example.com',
    });

    expect(result).toEqual({ unreadCount: 5 });
    expect(homepageService.getUnreadNotificationCount).toHaveBeenCalledWith(
      'mockUserId',
    );
  });
});
