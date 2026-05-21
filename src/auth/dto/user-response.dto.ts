import { UserRole } from '@prisma/client';
import { Exclude } from 'class-transformer';
import { IsEmail, IsEnum, IsInt, IsOptional, IsString } from 'class-validator';

export class UserResponseDto {
  @IsInt()
  id!: number;

  @IsEmail()
  email!: string;

  @IsString()
  @IsOptional()
  name!: string | null;

  @IsEnum(UserRole)
  role!: UserRole;

  @Exclude()
  password?: string;

  @Exclude()
  refreshToken?: string | null;

  constructor(partial: Partial<UserResponseDto>) {
    Object.assign(this, partial);
  }
}
