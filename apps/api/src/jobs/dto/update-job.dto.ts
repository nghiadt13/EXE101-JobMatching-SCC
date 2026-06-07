import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsISO8601,
  IsObject,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import {
  CUSTOMER_TYPE_VALUES,
  EMPLOYMENT_TYPE_VALUES,
  EXPERIENCE_LEVEL_VALUES,
  JOB_LEVEL_VALUES,
  SALES_MODEL_VALUES,
  WORKING_DAY_STATUS_VALUES,
} from '../job-filter.constants';

export class UpdateJobDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(160)
  title?: string;

  @IsOptional()
  @IsString()
  @MinLength(10)
  @MaxLength(20000)
  description?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(100)
  @IsString({ each: true })
  @MaxLength(100, { each: true })
  skills?: string[];

  @IsOptional()
  @IsObject()
  location?: Record<string, unknown>;

  @IsOptional()
  @IsInt()
  @Min(0)
  salaryMin?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  salaryMax?: number;

  @IsOptional()
  @IsString()
  @IsIn(EMPLOYMENT_TYPE_VALUES)
  employmentType?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @MaxLength(100, { each: true })
  certifications?: string[];

  // Filter metadata fields
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @IsString({ each: true })
  categorySlugs?: string[];

  @IsOptional()
  @IsIn(WORKING_DAY_STATUS_VALUES)
  workingDayStatus?: string;

  @IsOptional()
  @IsIn(EXPERIENCE_LEVEL_VALUES)
  experienceLevel?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(600)
  minExperienceMonths?: number;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  companyIndustryKey?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  jobFieldKey?: string;

  @IsOptional()
  @IsIn(JOB_LEVEL_VALUES)
  jobLevel?: string;

  @IsOptional()
  @IsIn(SALES_MODEL_VALUES)
  salesModel?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(5)
  @IsString({ each: true })
  customerTypes?: string[];

  @IsOptional()
  @IsBoolean()
  salaryNegotiable?: boolean;

  @IsOptional()
  @IsISO8601()
  applicationDeadline?: string;
}
