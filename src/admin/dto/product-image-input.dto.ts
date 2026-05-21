import { IsOptional, IsString } from 'class-validator';

export class ProductImageInputDto {
  @IsString()
  url!: string;

  @IsOptional()
  @IsString()
  alt?: string;
}
