import { OrderStatus } from '@prisma/client';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
export declare class AdminOrderQueryDto extends PaginationQueryDto {
    status?: OrderStatus;
}
