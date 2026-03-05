import { IsNotEmpty, IsString } from 'class-validator';

export class CalculateMatchingDto {
  @IsString()
  @IsNotEmpty()
  cvId!: string;

  @IsString()
  @IsNotEmpty()
  jobId!: string;
}
