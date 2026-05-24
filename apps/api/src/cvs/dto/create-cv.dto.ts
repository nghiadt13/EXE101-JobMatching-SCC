import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export class LocationDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  country?: string;
}

export class ProfileDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(200)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  website?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  summary?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => LocationDto)
  location?: LocationDto;
}

export class ExperienceDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(200)
  role: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(200)
  company: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(10)
  startDate: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  endDate?: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(50)
  tech?: string[];
}

export class EducationDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(200)
  school: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(200)
  degree: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  field?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  startDate?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  endDate?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  gpa?: string;
}

export class ProjectDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(200)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(50)
  tech?: string[];
}

export class CvDesignTokensDto {
  @IsString()
  fontFamily: string;

  @IsNumber()
  @Min(10)
  @Max(16)
  fontSize: number;

  @IsNumber()
  @Min(1.2)
  @Max(2.0)
  lineHeight: number;

  @IsString()
  primaryColor: string;

  @IsNumber()
  @Min(20)
  @Max(60)
  pageMargin: number;
}

export class CreateCvDto {
  @IsOptional()
  @IsIn(['simple', 'professional', 'modern'])
  templateId?: string;

  @ValidateNested()
  @Type(() => ProfileDto)
  profile: ProfileDto;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExperienceDto)
  @ArrayMaxSize(50)
  experience: ExperienceDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EducationDto)
  @ArrayMaxSize(50)
  education: EducationDto[];

  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(100)
  skills: string[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProjectDto)
  @ArrayMaxSize(50)
  projects?: ProjectDto[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(50)
  certifications?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(50)
  languages?: string[];

  @IsOptional()
  @ValidateNested()
  @Type(() => CvDesignTokensDto)
  designTokens?: CvDesignTokensDto;
}
