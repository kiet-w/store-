import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { UserRole } from '@prisma/client';
import { AuthGuard } from '../auth/auth.guard';
import { JwtPayloadDto } from '../auth/dto/jwt-payload.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { paginated, success } from '../common/utils/api-response.util';
import { AdminService } from './admin.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { AdminOrderQueryDto } from './dto/admin-order-query.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Controller('admin')
@UseGuards(AuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Post('categories')
  async createCategory(
    @Req() request: Request & { user: JwtPayloadDto },
    @Body() dto: CreateCategoryDto,
  ) {
    const category = await this.adminService.createCategory(
      request.user.userId,
      dto,
    );
    return success(category);
  }

  @Patch('categories/:id')
  async updateCategory(
    @Req() request: Request & { user: JwtPayloadDto },
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCategoryDto,
  ) {
    const category = await this.adminService.updateCategory(
      request.user.userId,
      id,
      dto,
    );
    return success(category);
  }

  @Post('products')
  async createProduct(
    @Req() request: Request & { user: JwtPayloadDto },
    @Body() dto: CreateProductDto,
  ) {
    const product = await this.adminService.createProduct(
      request.user.userId,
      dto,
    );
    return success(product);
  }

  @Patch('products/:id')
  async updateProduct(
    @Req() request: Request & { user: JwtPayloadDto },
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateProductDto,
  ) {
    const product = await this.adminService.updateProduct(
      request.user.userId,
      id,
      dto,
    );
    return success(product);
  }

  @Delete('products/:id')
  async softDeleteProduct(
    @Req() request: Request & { user: JwtPayloadDto },
    @Param('id', ParseIntPipe) id: number,
  ) {
    const product = await this.adminService.softDeleteProduct(
      request.user.userId,
      id,
    );
    return success(product);
  }

  @Get('orders')
  async getOrders(@Query() query: AdminOrderQueryDto) {
    const result = await this.adminService.findOrders(query);
    return paginated(result.data, result.total, result.page, result.limit);
  }

  @Patch('orders/:id/status')
  async updateOrderStatus(
    @Req() request: Request & { user: JwtPayloadDto },
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    const order = await this.adminService.updateOrderStatus(
      request.user.userId,
      id,
      dto,
    );
    return success(order);
  }
}
