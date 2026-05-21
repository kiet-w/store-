import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { OrderStatus, Prisma, ProductStatus } from '@prisma/client';
import { CACHE_KEYS } from '../common/constants/cache.constants';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { AdminOrderQueryDto } from './dto/admin-order-query.dto';
import { AdminOrderResponseDto } from './dto/admin-order-response.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
  ) {}

  async createCategory(adminUserId: number, dto: CreateCategoryDto) {
    await this.ensureUniqueCategorySlug(dto.slug);

    const category = await this.prisma.category.create({
      data: dto,
    });

    await this.invalidateCategoryCache();
    this.logger.log(`Admin ${adminUserId} created category ${category.id}`);

    return category;
  }

  async updateCategory(
    adminUserId: number,
    id: number,
    dto: UpdateCategoryDto,
  ) {
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

  async createProduct(adminUserId: number, dto: CreateProductDto) {
    await this.ensureCategoryExists(dto.categoryId);
    await this.ensureUniqueProductSlug(dto.slug);

    const product = await this.prisma.product.create({
      data: {
        name: dto.name,
        slug: dto.slug,
        description: dto.description,
        price: new Prisma.Decimal(dto.price),
        stock: dto.stock,
        categoryId: dto.categoryId,
        status: dto.status ?? ProductStatus.ACTIVE,
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

  async updateProduct(adminUserId: number, id: number, dto: UpdateProductDto) {
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
        ...(price ? { price: new Prisma.Decimal(price) } : {}),
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

  async softDeleteProduct(adminUserId: number, id: number) {
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

  async findOrders(query: AdminOrderQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;
    const where: Prisma.OrderWhereInput = {
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
      data: orders.map((order) => new AdminOrderResponseDto(order)),
      total,
      page,
      limit,
    };
  }

  async updateOrderStatus(
    adminUserId: number,
    orderId: number,
    dto: UpdateOrderStatusDto,
  ) {
    const existing = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!existing) {
      throw new NotFoundException('Không tìm thấy đơn hàng');
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

    this.logger.log(
      `Admin ${adminUserId} updated order ${order.id} status ${existing.status} -> ${dto.status}`,
    );

    return new AdminOrderResponseDto(order);
  }

  private async ensureCategoryExists(id: number) {
    const category = await this.prisma.category.findUnique({
      where: { id },
    });

    if (!category) {
      throw new NotFoundException('Danh mục không tồn tại');
    }

    return category;
  }

  private async ensureProductExists(id: number) {
    const product = await this.prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      throw new NotFoundException('Sản phẩm không tồn tại');
    }

    return product;
  }

  private async ensureUniqueCategorySlug(slug: string, excludeId?: number) {
    const existing = await this.prisma.category.findUnique({
      where: { slug },
    });

    if (existing && existing.id !== excludeId) {
      throw new ConflictException('Slug danh mục đã tồn tại');
    }
  }

  private async ensureUniqueProductSlug(slug: string, excludeId?: number) {
    const existing = await this.prisma.product.findUnique({
      where: { slug },
    });

    if (existing && existing.id !== excludeId) {
      throw new ConflictException('Slug sản phẩm đã tồn tại');
    }
  }

  private async invalidateCategoryCache() {
    await this.redisService.del(CACHE_KEYS.CATEGORIES);
    await this.redisService.reset();
  }

  private async invalidateProductCache(oldSlug?: string, newSlug?: string) {
    await this.redisService.reset();

    if (oldSlug) {
      await this.redisService.del(CACHE_KEYS.PRODUCT(oldSlug));
    }

    if (newSlug && newSlug !== oldSlug) {
      await this.redisService.del(CACHE_KEYS.PRODUCT(newSlug));
    }
  }
}
