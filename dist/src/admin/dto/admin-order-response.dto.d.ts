import { OrderStatus } from '@prisma/client';
export declare class AdminOrderResponseDto {
    id: number;
    status: OrderStatus;
    total: string;
    address: any;
    createdAt: Date;
    updatedAt: Date;
    user: any;
    items: any[];
    constructor(order: any);
}
