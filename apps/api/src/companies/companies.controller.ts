import { Controller, Get, Param, Query } from '@nestjs/common';
import { CompaniesService } from './companies.service';
import type { CompaniesListResponse, CompanyView } from './companies.types';
import { QueryCompaniesDto } from './dto/query-companies.dto';

@Controller('companies')
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Get()
  list(@Query() query: QueryCompaniesDto): Promise<CompaniesListResponse> {
    return this.companiesService.list(query);
  }

  @Get(':slug')
  getBySlug(@Param('slug') slug: string): Promise<CompanyView> {
    return this.companiesService.getBySlug(slug);
  }
}

