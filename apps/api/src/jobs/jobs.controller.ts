import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import type { JwtPayload } from '../auth/auth.types';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CreateJobDto } from './dto/create-job.dto';
import { QueryJobsDto } from './dto/query-jobs.dto';
import { UpdateJobDto } from './dto/update-job.dto';
import { JobsService } from './jobs.service';
import { JobView, JobsListResponse } from './jobs.types';

@Controller('jobs')
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.RECRUITER)
  create(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateJobDto,
  ): Promise<JobView> {
    return this.jobsService.create(user.sub, dto);
  }

  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  list(
    @CurrentUser() user: JwtPayload | null,
    @Query() query: QueryJobsDto,
  ): Promise<JobsListResponse> {
    return this.jobsService.list(user ?? null, query);
  }

  @Get(':idOrSlug')
  @UseGuards(OptionalJwtAuthGuard)
  getByIdOrSlug(
    @CurrentUser() user: JwtPayload | null,
    @Param('idOrSlug') idOrSlug: string,
  ): Promise<JobView> {
    return this.jobsService.getByIdOrSlug(user ?? null, idOrSlug);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.RECRUITER)
  update(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdateJobDto,
  ): Promise<JobView> {
    return this.jobsService.update(user.sub, id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.RECRUITER)
  softDelete(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ): Promise<{ success: true }> {
    return this.jobsService.softDelete(user.sub, id);
  }

  @Post(':id/publish')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.RECRUITER)
  publish(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ): Promise<JobView> {
    return this.jobsService.publish(user.sub, id);
  }

  @Post(':id/close')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.RECRUITER)
  close(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ): Promise<JobView> {
    return this.jobsService.close(user.sub, id);
  }
}
