import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import type { JwtPayload } from '../auth/auth.types';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { HomepageService } from './homepage.service';
import type { HomepageResponse } from './homepage.types';

@Controller('home')
export class HomepageController {
  constructor(private readonly homepageService: HomepageService) {}

  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  getHomepage(
    @CurrentUser() user: JwtPayload | null,
    @Query('location') location?: string,
  ): Promise<HomepageResponse> {
    return this.homepageService.getHomepage(user ?? null, location);
  }
}
