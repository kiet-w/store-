"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminOrderResponseDto = void 0;
class AdminOrderResponseDto {
    id;
    status;
    total;
    address;
    createdAt;
    updatedAt;
    user;
    items;
    constructor(order) {
        this.id = order.id;
        this.status = order.status;
        this.total = order.total.toString();
        this.address = order.address;
        this.createdAt = order.createdAt;
        this.updatedAt = order.updatedAt;
        this.user = order.user;
        this.items = order.items.map((item) => ({
            id: item.id,
            productId: item.productId,
            productName: item.productName,
            productPrice: item.productPrice.toString(),
            quantity: item.quantity,
            subtotal: item.subtotal.toString(),
        }));
    }
}
exports.AdminOrderResponseDto = AdminOrderResponseDto;
//# sourceMappingURL=admin-order-response.dto.js.map