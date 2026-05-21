"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var AdminService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const cache_constants_1 = require("../common/constants/cache.constants");
const prisma_service_1 = require("../prisma/prisma.service");
const redis_service_1 = require("../redis/redis.service");
const admin_order_response_dto_1 = require("./dto/admin-order-response.dto");
let AdminService = AdminService_1 = class AdminService {
    prisma;
    redisService;
    logger = new common_1.Logger(AdminService_1.name);
    constructor(prisma, redisService) {
        this.prisma = prisma;
        this.redisService = redisService;
    }
    async createCategory(adminUserId, dto) {
        await this.ensureUniqueCategorySlug(dto.slug);
        const category = await this.prisma.category.create({
            data: dto,
        });
        await this.invalidateCategoryCache();
        this.logger.log(`Admin ${adminUserId} created category ${category.id}`);
        return category;
    }
    async updateCategory(adminUserId, id, dto) {
        await this.ensureCategoryExists(id);
        if (dto.slug) {
            await this.ensureUniqueCategorySlug(dto.slug, id);
        }
        const category = await this.prisma.category.update({
            where: { id },
            data: dto,
        });
        await this.invalidateCategoryCache();
        this.logger.log(`Admin ${adminUserId} updated category ${category.id}`);
        return category;
    }
    async createProduct(adminUserId, dto) {
        await this.ensureCategoryExists(dto.categoryId);
        await this.ensureUniqueProductSlug(dto.slug);
        const product = await this.prisma.product.create({
            data: {
                name: dto.name,
                slug: dto.slug,
                description: dto.description,
                price: new client_1.Prisma.Decimal(dto.price),
                stock: dto.stock,
                categoryId: dto.categoryId,
                status: dto.status ?? client_1.ProductStatus.ACTIVE,
                images: dto.images?.length
                    ? {
                        create: dto.images.map((image) => ({
                            url: image.url,
                            alt: image.alt,
                        })),
                    }
                    : undefined,
            },
            include: {
                images: true,
                category: true,
            },
        });
        await this.invalidateProductCache(product.slug);
        this.logger.log(`Admin ${adminUserId} created product ${product.id}`);
        return product;
    }
    async updateProduct(adminUserId, id, dto) {
        const existing = await this.ensureProductExists(id);
        if (dto.categoryId) {
            await this.ensureCategoryExists(dto.categoryId);
        }
        if (dto.slug) {
            await this.ensureUniqueProductSlug(dto.slug, id);
        }
        const { images, price, ...rest } = dto;
        const product = await this.prisma.product.update({
            where: { id },
            data: {
                ...rest,
                ...(price ? { price: new client_1.Prisma.Decimal(price) } : {}),
                ...(images
                    ? {
                        images: {
                            deleteMany: {},
                            create: images.map((image) => ({
                                url: image.url,
                                alt: image.alt,
                            })),
                        },
                    }
                    : {}),
            },
            include: {
                images: true,
                category: true,
            },
        });
        await this.invalidateProductCache(existing.slug, product.slug);
        this.logger.log(`Admin ${adminUserId} updated product ${product.id}`);
        return product;
    }
    async softDeleteProduct(adminUserId, id) {
        const existing = await this.ensureProductExists(id);
        const product = await this.prisma.product.update({
            where: { id },
            data: {
                deletedAt: new Date(),
            },
        });
        await this.invalidateProductCache(existing.slug, product.slug);
        this.logger.log(`Admin ${adminUserId} soft deleted product ${product.id}`);
        return product;
    }
    async findOrders(query) {
        const page = query.page ?? 1;
        const limit = query.limit ?? 10;
        const skip = (page - 1) * limit;
        const where = {
            ...(query.status ? { status: query.status } : {}),
        };
        const [orders, total] = await Promise.all([
            this.prisma.order.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    user: {
                        select: {
                            id: true,
                            email: true,
                            name: true,
                        },
                    },
                    items: true,
                },
            }),
            this.prisma.order.count({ where }),
        ]);
        return {
            data: orders.map((order) => new admin_order_response_dto_1.AdminOrderResponseDto(order)),
            total,
            page,
            limit,
        };
    }
    async updateOrderStatus(adminUserId, orderId, dto) {
        const existing = await this.prisma.order.findUnique({
            where: { id: orderId },
        });
        if (!existing) {
            throw new common_1.NotFoundException('Không tìm thấy đơn hàng');
        }
        const order = await this.prisma.order.update({
            where: { id: orderId },
            data: { status: dto.status },
            include: {
                items: true,
                user: {
                    select: {
                        id: true,
                        email: true,
                        name: true,
                    },
                },
            },
        });
        this.logger.log(`Admin ${adminUserId} updated order ${order.id} status ${existing.status} -> ${dto.status}`);
        return new admin_order_response_dto_1.AdminOrderResponseDto(order);
    }
    async ensureCategoryExists(id) {
        const category = await this.prisma.category.findUnique({
            where: { id },
        });
        if (!category) {
            throw new common_1.NotFoundException('Danh mục không tồn tại');
        }
        return category;
    }
    async ensureProductExists(id) {
        const product = await this.prisma.product.findUnique({
            where: { id },
        });
        if (!product) {
            throw new common_1.NotFoundException('Sản phẩm không tồn tại');
        }
        return product;
    }
    async ensureUniqueCategorySlug(slug, excludeId) {
        const existing = await this.prisma.category.findUnique({
            where: { slug },
        });
        if (existing && existing.id !== excludeId) {
            throw new common_1.ConflictException('Slug danh mục đã tồn tại');
        }
    }
    async ensureUniqueProductSlug(slug, excludeId) {
        const existing = await this.prisma.product.findUnique({
            where: { slug },
        });
        if (existing && existing.id !== excludeId) {
            throw new common_1.ConflictException('Slug sản phẩm đã tồn tại');
        }
    }
    async invalidateCategoryCache() {
        await this.redisService.del(cache_constants_1.CACHE_KEYS.CATEGORIES);
        await this.redisService.reset();
    }
    async invalidateProductCache(oldSlug, newSlug) {
        await this.redisService.reset();
        if (oldSlug) {
            await this.redisService.del(cache_constants_1.CACHE_KEYS.PRODUCT(oldSlug));
        }
        if (newSlug && newSlug !== oldSlug) {
            await this.redisService.del(cache_constants_1.CACHE_KEYS.PRODUCT(newSlug));
        }
    }
};
exports.AdminService = AdminService;
exports.AdminService = AdminService = AdminService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        redis_service_1.RedisService])
], AdminService);
//# sourceMappingURL=admin.service.js.map