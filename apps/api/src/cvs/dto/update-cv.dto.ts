import {
  ArrayMaxSize,
  IsArray,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class UpdateCvDto {
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(100)
  @IsString({ each: true })
  @MaxLength(500, { each: true })
  skills?: string[];

  @IsOptional()
  @IsObject()
  parsedData?: Record<string, unknown>;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  fileName?: string;
}
