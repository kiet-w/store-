import type { Request } from 'express';
import { JwtPayloadDto } from '../auth/dto/jwt-payload.dto';
import { AdminService } from './admin.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { AdminOrderQueryDto } from './dto/admin-order-query.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
export declare class AdminController {
    private readonly adminService;
    constructor(adminService: AdminService);
    createCategory(request: Request & {
        user: JwtPayloadDto;
    }, dto: CreateCategoryDto): Promise<import("../common/interfaces/api-response.interface").ApiResponse<{
        id: number;
        name: string;
        slug: string;
        description: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>>;
    updateCategory(request: Request & {
        user: JwtPayloadDto;
    }, id: number, dto: UpdateCategoryDto): Promise<import("../common/interfaces/api-response.interface").ApiResponse<{
        id: number;
        name: string;
        slug: string;
        description: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>>;
    createProduct(request: Request & {
        user: JwtPayloadDto;
    }, dto: CreateProductDto): Promise<import("../common/interfaces/api-response.interface").ApiResponse<{
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
        price: import("@prisma/client-runtime-utils").Decimal;
        stock: number;
        status: import("@prisma/client").$Enums.ProductStatus;
        deletedAt: Date | null;
        categoryId: number;
    }>>;
    updateProduct(request: Request & {
        user: JwtPayloadDto;
    }, id: number, dto: UpdateProductDto): Promise<import("../common/interfaces/api-response.interface").ApiResponse<{
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
        price: import("@prisma/client-runtime-utils").Decimal;
        stock: number;
        status: import("@prisma/client").$Enums.ProductStatus;
        deletedAt: Date | null;
        categoryId: number;
    }>>;
    softDeleteProduct(request: Request & {
        user: JwtPayloadDto;
    }, id: number): Promise<import("../common/interfaces/api-response.interface").ApiResponse<{
        id: number;
        name: string;
        slug: string;
        description: string | null;
        createdAt: Date;
        updatedAt: Date;
        price: import("@prisma/client-runtime-utils").Decimal;
        stock: number;
        status: import("@prisma/client").$Enums.ProductStatus;
        deletedAt: Date | null;
        categoryId: number;
    }>>;
    getOrders(query: AdminOrderQueryDto): Promise<import("../common/interfaces/api-response.interface").PaginatedApiResponse<import("./dto/admin-order-response.dto").AdminOrderResponseDto>>;
    updateOrderStatus(request: Request & {
        user: JwtPayloadDto;
    }, id: number, dto: UpdateOrderStatusDto): Promise<import("../common/interfaces/api-response.interface").ApiResponse<import("./dto/admin-order-response.dto").AdminOrderResponseDto>>;
}
