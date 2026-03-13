import { Controller, Get, UseGuards } from '@nestjs/common';
import type { JwtPayload } from '../auth/auth.types';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { HomepageService } from './homepage.service';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly homepageService: HomepageService) {}

  @Get('unread-count')
  async getUnreadCount(
    @CurrentUser() user: JwtPayload,
  ): Promise<{ unreadCount: number }> {
    return {
      unreadCount: await this.homepageService.getUnreadNotificationCount(
        user.sub,
      ),
    };
  }
}
