import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/auth.types';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { StartRecommendationDto } from './dto/start-recommendation.dto';
import { RecommendationService } from './services/recommendation.service';

@Controller('matching/recommend')
@UseGuards(JwtAuthGuard)
export class RecommendationController {
  constructor(
    private readonly recommendationService: RecommendationService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.ACCEPTED)
  startScan(
    @CurrentUser() user: JwtPayload,
    @Body() dto: StartRecommendationDto,
  ) {
    return this.recommendationService.startScan(dto.cvId, user);
  }

  @Get()
  listScans(
    @CurrentUser() user: JwtPayload,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.recommendationService.listScans(
      user,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 5,
    );
  }

  @Get(':scanId')
  getScanResult(
    @CurrentUser() user: JwtPayload,
    @Param('scanId', ParseUUIDPipe) scanId: string,
  ) {
    return this.recommendationService.getScanResult(scanId, user);
  }
}
