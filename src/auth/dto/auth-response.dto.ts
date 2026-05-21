import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { UserResponseDto } from './user-response.dto';

export class AuthResponseDto {
  @IsBoolean()
  success!: boolean;

  @IsString()
  @IsOptional()
  message?: string;

  @IsString()
  @IsOptional()
  accessToken?: string;

  @ValidateNested()
  @Type(() => UserResponseDto)
  @IsOptional()
  user?: UserResponseDto;

  constructor(partial: Partial<AuthResponseDto>) {
    Object.assign(this, partial);
  }
}
