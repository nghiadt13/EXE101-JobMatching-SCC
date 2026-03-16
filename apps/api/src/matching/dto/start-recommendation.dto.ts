import { IsUUID } from 'class-validator';

export class StartRecommendationDto {
  @IsUUID()
  cvId: string;
}
