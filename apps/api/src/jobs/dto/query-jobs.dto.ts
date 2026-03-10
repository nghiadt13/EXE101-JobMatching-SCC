import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { JobStatus } from '@prisma/client';

export const JOB_SORT_VALUES = ['newest', 'salary_asc', 'salary_desc'] as const;
export type JobsSort = (typeof JOB_SORT_VALUES)[number];

export const JOB_REMOTE_VALUES = ['any', 'true', 'false'] as const;
export type JobsRemoteFilter = (typeof JOB_REMOTE_VALUES)[number];

export const JOB_POSTED_WITHIN_DAYS_VALUES = [1, 3, 7, 14, 30] as const;
export type JobsPostedWithinDays = (typeof JOB_POSTED_WITHIN_DAYS_VALUES)[number];

function parseCsvArray(value: unknown): string[] | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }

  let list: string[] = [];
  if (Array.isArray(value)) {
    list = value
      .map((entry) => {
        if (typeof entry === 'string') {
          return entry;
        }
        if (typeof entry === 'number' || typeof entry === 'boolean') {
          return String(entry);
        }
        return '';
      })
      .filter((entry) => entry.length > 0);
  } else if (
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  ) {
    list = String(value).split(',');
  } else {
    return undefined;
  }

  const unique = Array.from(
    new Set(
      list
        .map((entry) => entry.trim())
        .filter((entry) => entry.length > 0),
    ),
  );

  return unique.length > 0 ? unique : undefined;
}

export class QueryJobsDto {
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
  @IsString()
  @MaxLength(120)
  search?: string;

  @IsOptional()
  @IsIn(JOB_SORT_VALUES)
  sort?: JobsSort = 'newest';

  @IsOptional()
  @Transform(({ value }) => parseCsvArray(value))
  @IsArray()
  @ArrayMaxSize(10)
  @IsString({ each: true })
  employmentTypes?: string[];

  @IsOptional()
  @IsIn(JOB_REMOTE_VALUES)
  remote?: JobsRemoteFilter = 'any';

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(1_000_000_000)
  salaryMinGte?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(1_000_000_000)
  salaryMaxLte?: number;

  @IsOptional()
  @Type(() => Number)
  @IsIn(JOB_POSTED_WITHIN_DAYS_VALUES)
  postedWithinDays?: JobsPostedWithinDays;

  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  includeFacets?: boolean;

  @IsOptional()
  @IsEnum(JobStatus)
  status?: JobStatus;
}
