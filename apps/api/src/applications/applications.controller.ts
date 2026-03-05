import {
  Body,
  Controller,
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
import { RolesGuard } from '../auth/guards/roles.guard';
import { ApplicationsService } from './applications.service';
import {
  ApplicationsListResponse,
  ApplicationView,
} from './applications.types';
import { CreateApplicationDto } from './dto/create-application.dto';
import { QueryApplicationsDto } from './dto/query-applications.dto';
import { UpdateApplicationStatusDto } from './dto/update-application-status.dto';

@Controller('applications')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ApplicationsController {
  constructor(private readonly applicationsService: ApplicationsService) {}

  @Post()
  @Roles(UserRole.CANDIDATE)
  create(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateApplicationDto,
  ): Promise<ApplicationView> {
    return this.applicationsService.create(user, dto);
  }

  @Get()
  @Roles(UserRole.CANDIDATE, UserRole.RECRUITER)
  list(
    @CurrentUser() user: JwtPayload,
    @Query() query: QueryApplicationsDto,
  ): Promise<ApplicationsListResponse> {
    return this.applicationsService.list(user, query);
  }

  @Get(':id')
  @Roles(UserRole.CANDIDATE, UserRole.RECRUITER)
  getById(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ): Promise<ApplicationView> {
    return this.applicationsService.getById(user, id);
  }

  @Patch(':id/status')
  @Roles(UserRole.RECRUITER)
  updateStatus(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdateApplicationStatusDto,
  ): Promise<ApplicationView> {
    return this.applicationsService.updateStatus(user, id, dto);
  }
}
