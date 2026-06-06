import { Module } from '@nestjs/common';
import { MatchingModule } from '../matching/matching.module';
import { ApplicationsController } from './applications.controller';
import { ApplicationsService } from './applications.service';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [MatchingModule, NotificationsModule],
  controllers: [ApplicationsController],
  providers: [ApplicationsService],
})
export class ApplicationsModule {}
