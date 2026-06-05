import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  Res,
  StreamableFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UserRole } from '@prisma/client';
import { createReadStream } from 'node:fs';
import { memoryStorage } from 'multer';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CV_MAX_FILE_SIZE_BYTES } from './cvs.constants';
import { CreateCvDto } from './dto/create-cv.dto';
import { QueryCvsDto } from './dto/query-cvs.dto';
import { SuggestCvDto } from './dto/suggest-cv.dto';
import { UpdateCvDto } from './dto/update-cv.dto';
import { CvsService } from './cvs.service';
import { CvSuggestionService } from './services/cv-suggestion.service';
import { CvView, CvsListResponse } from './cvs.types';
import { CvSuggestion } from './cv-suggestion.types';

@Controller('cvs')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.CANDIDATE)
export class CvsController {
  constructor(
    private readonly cvsService: CvsService,
    private readonly cvSuggestionService: CvSuggestionService,
  ) {}

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

  @Post('create')
  create(
    @CurrentUser() user: { sub: string },
    @Body() dto: CreateCvDto,
  ): Promise<CvView> {
    return this.cvsService.createFromBuilder(user.sub, dto);
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

  @Get(':id/file')
  async getFile(
    @CurrentUser() user: { sub: string },
    @Param('id') id: string,
    @Res({ passthrough: true }) res: any,
  ): Promise<StreamableFile> {
    const { absolutePath, mimeType, fileName } =
      await this.cvsService.getFileInfo(user.sub, id);

    res.set({
      'Content-Type': mimeType,
      'Content-Disposition': `inline; filename="${fileName}"`,
    });

    const file = createReadStream(absolutePath);
    return new StreamableFile(file);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: { sub: string },
    @Param('id') id: string,
    @Body() dto: UpdateCvDto,
  ): Promise<CvView> {
    return this.cvsService.update(user.sub, id, dto);
  }

  @Put(':id/builder')
  updateBuilder(
    @CurrentUser() user: { sub: string },
    @Param('id') id: string,
    @Body() dto: CreateCvDto,
  ): Promise<CvView> {
    return this.cvsService.updateBuilderCv(user.sub, id, dto);
  }

  @Delete(':id')
  softDelete(
    @CurrentUser() user: { sub: string },
    @Param('id') id: string,
  ): Promise<{ success: true }> {
    return this.cvsService.softDelete(user.sub, id);
  }

  @Post(':id/suggest')
  suggest(
    @CurrentUser() user: { sub: string },
    @Param('id') id: string,
    @Body() dto: SuggestCvDto,
  ): Promise<CvSuggestion> {
    return this.cvSuggestionService.suggest(user.sub, id, dto.jobId);
  }

  @Post(':id/set-primary')
  setPrimary(
    @CurrentUser() user: { sub: string },
    @Param('id') id: string,
  ): Promise<CvView> {
    return this.cvsService.setPrimary(user.sub, id);
  }
}
