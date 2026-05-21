import { ProductStatus } from '@prisma/client';
import { ProductImageInputDto } from './product-image-input.dto';
export declare class CreateProductDto {
    name: string;
    slug: string;
    description?: string;
    price: string;
    stock: number;
    categoryId: number;
    status?: ProductStatus;
    images?: ProductImageInputDto[];
}
