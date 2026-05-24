import {
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class SocialLoginDto {
  @IsEmail({}, { message: 'Email is invalid' })
  email!: string;

  @IsString()
  @IsNotEmpty({ message: 'Name must not be empty' })
  name!: string;

  @IsOptional()
  @IsString()
  avatar?: string;

  @IsString()
  @IsIn(['google', 'facebook'])
  provider!: 'google' | 'facebook';

  @IsString()
  @IsNotEmpty({ message: 'Provider ID must not be empty' })
  providerId!: string;

  @IsString()
  @IsIn(['CANDIDATE', 'RECRUITER'])
  role!: 'CANDIDATE' | 'RECRUITER';
}
