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
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CV_MAX_FILE_SIZE_BYTES } from './cvs.constants';
import { QueryCvsDto } from './dto/query-cvs.dto';
import { UpdateCvDto } from './dto/update-cv.dto';
import { CvsService } from './cvs.service';
import { CvView, CvsListResponse } from './cvs.types';

@Controller('cvs')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.CANDIDATE)
export class CvsController {
  constructor(private readonly cvsService: CvsService) {}

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: {
        fileSize: CV_MAX_FILE_SIZE_BYTES,
      },
    }),
  )
  upload(
    @CurrentUser() user: { sub: string },
    @UploadedFile() file: Express.Multer.File,
  ): Promise<CvView> {
    return this.cvsService.upload(user.sub, file);
  }

  @Get()
  list(
    @CurrentUser() user: { sub: string },
    @Query() query: QueryCvsDto,
  ): Promise<CvsListResponse> {
    return this.cvsService.list(user.sub, query);
  }

  @Get(':id')
  getById(
    @CurrentUser() user: { sub: string },
    @Param('id') id: string,
  ): Promise<CvView> {
    return this.cvsService.getById(user.sub, id);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: { sub: string },
    @Param('id') id: string,
    @Body() dto: UpdateCvDto,
  ): Promise<CvView> {
    return this.cvsService.update(user.sub, id, dto);
  }

  @Delete(':id')
  softDelete(
    @CurrentUser() user: { sub: string },
    @Param('id') id: string,
  ): Promise<{ success: true }> {
    return this.cvsService.softDelete(user.sub, id);
  }

  @Post(':id/set-primary')
  setPrimary(
    @CurrentUser() user: { sub: string },
    @Param('id') id: string,
  ): Promise<CvView> {
    return this.cvsService.setPrimary(user.sub, id);
  }
}
