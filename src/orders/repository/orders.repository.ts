import { BadRequestException, Injectable } from '@nestjs/common';
import { CartStatus, OrderStatus, Prisma, ProductStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CheckoutDto } from '../dto/checkout.dto';

@Injectable()
export class OrdersRepository {
  constructor(private readonly prisma: PrismaService) {}

  async checkout(userId: number, dto: CheckoutDto) {
    return this.prisma.$transaction(async (tx) => {
      const cart = await tx.cart.findFirst({
        where: {
          userId,
          status: CartStatus.ACTIVE,
        },
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
      });

      if (!cart || cart.items.length === 0) {
        throw new BadRequestException('Giỏ hàng trống');
      }

      for (const item of cart.items) {
        if (
          item.product.status !== ProductStatus.ACTIVE ||
          item.product.deletedAt
        ) {
          throw new BadRequestException('Sản phẩm không còn bán');
        }

        if (item.product.stock < item.quantity) {
          throw new BadRequestException('Sản phẩm không đủ hàng');
        }
      }

      const orderItemsData = cart.items.map((item) => ({
        productId: item.productId,
        productName: item.product.name,
        productPrice: item.product.price,
        quantity: item.quantity,
        subtotal: item.product.price.mul(item.quantity),
      }));

      const total = orderItemsData.reduce(
        (sum, item) => sum.plus(item.subtotal),
        new Prisma.Decimal(0),
      );

      const order = await tx.order.create({
        data: {
          userId,
          status: OrderStatus.PENDING,
          total,
          address: dto.address,
          items: {
            create: orderItemsData,
          },
        },
        include: {
          items: true,
        },
      });

      for (const item of cart.items) {
        const updated = await tx.product.updateMany({
          where: {
            id: item.productId,
            status: ProductStatus.ACTIVE,
            deletedAt: null,
            stock: { gte: item.quantity },
          },
          data: {
            stock: { decrement: item.quantity },
          },
        });

        if (updated.count !== 1) {
          throw new BadRequestException(`${item.product.name} không đủ hàng`);
        }
      }

      await tx.cart.update({
        where: { id: cart.id },
        data: { status: CartStatus.COMPLETED },
      });

      return order;
    });
  }

  async findOrders(userId: number) {
    return this.prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        items: true,
      },
    });
  }

  async findOrderById(userId: number, orderId: number) {
    return this.prisma.order.findFirst({
      where: {
        id: orderId,
        userId,
      },
      include: {
        items: true,
      },
    });
  }
}
