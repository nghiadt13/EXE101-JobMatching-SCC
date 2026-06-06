import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export const COMPANY_TYPE_VALUES = ['pro', 'normal', 'startup'] as const;
export type CompanyTypeFilter = (typeof COMPANY_TYPE_VALUES)[number];

export class QueryCompaniesDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(200)
  page: number = 1;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(60)
  limit: number = 20;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  q?: string;

  @IsOptional()
  @IsIn(COMPANY_TYPE_VALUES)
  type?: CompanyTypeFilter;
}

