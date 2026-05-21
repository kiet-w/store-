import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { AddCartItemDto } from './dto/add-cart-item.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import { CartResponseDto } from './dto/cart-response.dto';
export declare class CartService {
    private readonly prisma;
    private readonly redisService;
    constructor(prisma: PrismaService, redisService: RedisService);
    getCart(userId: number): Promise<CartResponseDto>;
    addItem(userId: number, dto: AddCartItemDto): Promise<CartResponseDto>;
    updateItem(userId: number, itemId: number, dto: UpdateCartItemDto): Promise<CartResponseDto>;
    removeItem(userId: number, itemId: number): Promise<CartResponseDto>;
    clearCart(userId: number): Promise<CartResponseDto>;
    private refreshCart;
    private getOrCreateActiveCart;
    private getCartWithItems;
    private validateProductAvailability;
    private findOwnedCartItem;
    private serializeCart;
}
