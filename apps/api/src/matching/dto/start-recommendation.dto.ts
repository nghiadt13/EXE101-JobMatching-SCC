import { IsNotEmpty, IsString } from 'class-validator';

export class StartRecommendationDto {
  @IsString()
  @IsNotEmpty()
  cvId: string;
}
