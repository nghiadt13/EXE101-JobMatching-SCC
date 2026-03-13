import { Module } from '@nestjs/common';
import { HomepageCacheService } from './homepage-cache.service';
import { HomepageController } from './homepage.controller';
import { HomepageService } from './homepage.service';
import { NotificationsController } from './notifications.controller';

@Module({
  controllers: [HomepageController, NotificationsController],
  providers: [HomepageService, HomepageCacheService],
  exports: [HomepageService, HomepageCacheService],
})
export class HomepageModule {}
