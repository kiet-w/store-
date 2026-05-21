import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { AdminOrderQueryDto } from './dto/admin-order-query.dto';
import { AdminOrderResponseDto } from './dto/admin-order-response.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
export declare class AdminService {
    private readonly prisma;
    private readonly redisService;
    private readonly logger;
    constructor(prisma: PrismaService, redisService: RedisService);
    createCategory(adminUserId: number, dto: CreateCategoryDto): Promise<{
        id: number;
        name: string;
        slug: string;
        description: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    updateCategory(adminUserId: number, id: number, dto: UpdateCategoryDto): Promise<{
        id: number;
        name: string;
        slug: string;
        description: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    createProduct(adminUserId: number, dto: CreateProductDto): Promise<{
        category: {
            id: number;
            name: string;
            slug: string;
            description: string | null;
            createdAt: Date;
            updatedAt: Date;
        };
        images: {
            url: string;
            id: number;
            createdAt: Date;
            alt: string | null;
            productId: number;
        }[];
    } & {
        id: number;
        name: string;
        slug: string;
        description: string | null;
        createdAt: Date;
        updatedAt: Date;
        price: Prisma.Decimal;
        stock: number;
        status: import("@prisma/client").$Enums.ProductStatus;
        deletedAt: Date | null;
        categoryId: number;
    }>;
    updateProduct(adminUserId: number, id: number, dto: UpdateProductDto): Promise<{
        category: {
            id: number;
            name: string;
            slug: string;
            description: string | null;
            createdAt: Date;
            updatedAt: Date;
        };
        images: {
            url: string;
            id: number;
            createdAt: Date;
            alt: string | null;
            productId: number;
        }[];
    } & {
        id: number;
        name: string;
        slug: string;
        description: string | null;
        createdAt: Date;
        updatedAt: Date;
        price: Prisma.Decimal;
        stock: number;
        status: import("@prisma/client").$Enums.ProductStatus;
        deletedAt: Date | null;
        categoryId: number;
    }>;
    softDeleteProduct(adminUserId: number, id: number): Promise<{
        id: number;
        name: string;
        slug: string;
        description: string | null;
        createdAt: Date;
        updatedAt: Date;
        price: Prisma.Decimal;
        stock: number;
        status: import("@prisma/client").$Enums.ProductStatus;
        deletedAt: Date | null;
        categoryId: number;
    }>;
    findOrders(query: AdminOrderQueryDto): Promise<{
        data: AdminOrderResponseDto[];
        total: number;
        page: number;
        limit: number;
    }>;
    updateOrderStatus(adminUserId: number, orderId: number, dto: UpdateOrderStatusDto): Promise<AdminOrderResponseDto>;
    private ensureCategoryExists;
    private ensureProductExists;
    private ensureUniqueCategorySlug;
    private ensureUniqueProductSlug;
    private invalidateCategoryCache;
    private invalidateProductCache;
}
