"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CartResponseDto = exports.CartItemResponseDto = void 0;
class CartItemResponseDto {
    id;
    productId;
    name;
    slug;
    price;
    quantity;
    subtotal;
}
exports.CartItemResponseDto = CartItemResponseDto;
class CartResponseDto {
    id;
    items;
    totalItems;
    subtotal;
}
exports.CartResponseDto = CartResponseDto;
//# sourceMappingURL=cart-response.dto.js.map