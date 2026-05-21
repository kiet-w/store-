export declare class CartItemResponseDto {
    id: number;
    productId: number;
    name: string;
    slug: string;
    price: string;
    quantity: number;
    subtotal: string;
}
export declare class CartResponseDto {
    id: number;
    items: CartItemResponseDto[];
    totalItems: number;
    subtotal: string;
}
