import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { ApplicationsModule } from './applications/applications.module';
import { CommonModule } from './common/common.module';
import { CvsModule } from './cvs/cvs.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { JobsModule } from './jobs/jobs.module';
import { HomepageModule } from './homepage/homepage.module';
import { MatchingModule } from './matching/matching.module';
import { ProfileModule } from './profile/profile.module';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { NormalizationModule } from './normalization/normalization.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    CommonModule,
    NormalizationModule,
    PrismaModule,
    AuthModule,
    ApplicationsModule,
    UsersModule,
    ProfileModule,
    CvsModule,
    JobsModule,
    HomepageModule,
    MatchingModule,
    DashboardModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
