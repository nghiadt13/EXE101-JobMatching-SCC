import { IsUUID } from 'class-validator';

export class SuggestCvDto {
  @IsUUID()
  jobId!: string;
}
