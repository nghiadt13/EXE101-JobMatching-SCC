import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/auth.types';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CalculateMatchingDto } from './dto/calculate-matching.dto';
import { MatchingService } from './matching.service';
import { MatchingResult } from './matching.types';

@Controller('matching')
export class MatchingController {
  constructor(private readonly matchingService: MatchingService) {}

  @Post('calculate')
  @UseGuards(JwtAuthGuard)
  calculate(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CalculateMatchingDto,
  ): Promise<MatchingResult> {
    return this.matchingService.calculateForCvAndJob(dto.cvId, dto.jobId, user);
  }
}
