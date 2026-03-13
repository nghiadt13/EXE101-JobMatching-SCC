import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UserRole } from '@prisma/client';
import { memoryStorage } from 'multer';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import type { JwtPayload } from '../auth/auth.types';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { DOCUMENT_MAX_FILE_SIZE_BYTES } from '../documents/document-upload.constants';
import { CreateJobDto } from './dto/create-job.dto';
import { QueryJobsDto } from './dto/query-jobs.dto';
import { UpdateJobDto } from './dto/update-job.dto';
import { JobsService } from './jobs.service';
import { JobView, JobsListResponse, SaveJobResponse } from './jobs.types';

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

  @Post('upload')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.RECRUITER)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: {
        fileSize: DOCUMENT_MAX_FILE_SIZE_BYTES,
      },
    }),
  )
  upload(
    @CurrentUser() user: JwtPayload,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<JobView> {
    return this.jobsService.createFromFile(user.sub, file);
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

  @Post(':id/save')
  @UseGuards(JwtAuthGuard)
  saveJob(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ): Promise<SaveJobResponse> {
    return this.jobsService.saveJob(user.sub, id);
  }

  @Delete(':id/save')
  @UseGuards(JwtAuthGuard)
  unsaveJob(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ): Promise<SaveJobResponse> {
    return this.jobsService.unsaveJob(user.sub, id);
  }
}
