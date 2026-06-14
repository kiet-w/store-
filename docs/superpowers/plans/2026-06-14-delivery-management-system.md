# Delivery Management System — Backend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Build a NestJS backend that optimizes delivery routes for shippers with multiple orders ("đơn ghép"), manages warehouse inventory with full transaction-log auditability, and provides admin APIs for warehouse operations.

**Architecture:** Modular NestJS with repository pattern. Prisma ORM → PostgreSQL (Supabase). Mapbox Optimization API solves the Vehicle Routing Problem (VRP) — no custom algorithm needed for MVP. Inventory uses a transaction-log pattern (never update stock directly — always insert a transaction row and derive current stock from the log) to ensure 100% auditability. Auth via JWT with role-based access (ADMIN, WAREHOUSE_MANAGER, SHIPPER).

**Tech Stack:** NestJS 11, Prisma 7, PostgreSQL (Supabase), Mapbox (Geocoding + Optimization + Directions APIs), JWT, class-validator, class-transformer.

**Why Mapbox over Google Maps:**
- Optimization API built-in (solves TSP/VRP directly — send waypoints, get optimal order)
- Free tier: 100k directions/month, 100k geocoding/month, generous optimization quota
- Cheaper than Google at scale
- If scale demands it later, swap to OR-Tools (Python) for custom constraints (weight limits, time windows, multi-vehicle)

**Project Location:** `store/` (new NestJS project, independent from parent)

---

## File Structure

```
store/
├── .env
├── .env.example
├── prisma/
│   ├── schema.prisma           # All models
│   └── seed.ts                 # Seed data for dev
├── src/
│   ├── main.ts
│   ├── app.module.ts
│   ├── prisma/
│   │   ├── prisma.module.ts
│   │   └── prisma.service.ts
│   ├── auth/
│   │   ├── auth.module.ts
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── auth.guard.ts
│   │   ├── roles.guard.ts
│   │   ├── roles.decorator.ts
│   │   └── dto/
│   │       ├── login.dto.ts
│   │       └── register.dto.ts
│   ├── products/
│   │   ├── products.module.ts
│   │   ├── products.controller.ts
│   │   ├── products.service.ts
│   │   ├── products.repository.ts
│   │   └── dto/
│   │       ├── create-product.dto.ts
│   │       └── update-product.dto.ts
│   ├── warehouses/
│   │   ├── warehouses.module.ts
│   │   ├── warehouses.controller.ts
│   │   ├── warehouses.service.ts
│   │   ├── warehouses.repository.ts
│   │   └── dto/
│   │       ├── create-warehouse.dto.ts
│   │       └── update-warehouse.dto.ts
│   ├── inventory/
│   │   ├── inventory.module.ts
│   │   ├── inventory.controller.ts
│   │   ├── inventory.service.ts
│   │   ├── inventory.repository.ts
│   │   └── dto/
│   │       ├── import-stock.dto.ts
│   │       └── adjust-stock.dto.ts
│   ├── shippers/
│   │   ├── shippers.module.ts
│   │   ├── shippers.controller.ts
│   │   ├── shippers.service.ts
│   │   ├── shippers.repository.ts
│   │   └── dto/
│   │       ├── create-shipper.dto.ts
│   │       └── update-shipper.dto.ts
│   ├── delivery-orders/
│   │   ├── delivery-orders.module.ts
│   │   ├── delivery-orders.controller.ts
│   │   ├── delivery-orders.service.ts
│   │   ├── delivery-orders.repository.ts
│   │   └── dto/
│   │       ├── create-delivery-order.dto.ts
│   │       └── update-order-status.dto.ts
│   ├── delivery-batches/
│   │   ├── delivery-batches.module.ts
│   │   ├── delivery-batches.controller.ts
│   │   ├── delivery-batches.service.ts
│   │   ├── delivery-batches.repository.ts
│   │   └── dto/
│   │       └── create-batch.dto.ts
│   ├── mapbox/
│   │   ├── mapbox.module.ts
│   │   ├── mapbox.service.ts
│   │   └── mapbox.types.ts
│   └── admin/
│       ├── admin.module.ts
│       ├── dashboard/
│       │   ├── dashboard.controller.ts
│       │   └── dashboard.service.ts
│       └── reports/
│           ├── reports.controller.ts
│           └── reports.service.ts
├── test/
│   └── jest-e2e.json
├── package.json
├── tsconfig.json
├── tsconfig.build.json
├── nest-cli.json
└── eslint.config.mjs
```

---

## Task 1: Scaffold NestJS Project

**Files:**
- Create: `store/` (entire NestJS scaffold via CLI)
- Create: `store/.env`
- Create: `store/.env.example`

- [x] **Step 1: Scaffold with NestJS CLI**

```bash
cd /home/baudui/Downloads/project
npx -y @nestjs/cli@latest new store --package-manager npm --skip-git --language ts --strict
```

Expected: NestJS project created inside `store/` with `package.json`, `src/`, `test/`, etc.

- [x] **Step 2: Install core dependencies**

```bash
cd /home/baudui/Downloads/project/store
npm install @prisma/client @nestjs/config @nestjs/mapped-types class-validator class-transformer bcryptjs jsonwebtoken
npm install -D prisma @types/bcryptjs @types/jsonwebtoken
```

- [x] **Step 3: Create `.env.example`**

```env
# Database (Supabase)
DATABASE_URL="postgresql://USER:PASSWORD@HOST:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://USER:PASSWORD@HOST:5432/postgres"

# JWT
JWT_ACCESS_SECRET=change_me_access
JWT_REFRESH_SECRET=change_me_refresh
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Mapbox
MAPBOX_ACCESS_TOKEN=pk.your_mapbox_token_here
```

- [x] **Step 4: Create `.env` with real credentials**

Copy `.env.example` to `.env` and fill in:
- Supabase credentials (same instance as parent project, or create a new one)
- Generate JWT secrets
- Get Mapbox token from https://account.mapbox.com/access-tokens/

- [x] **Step 5: Enable ValidationPipe globally in `main.ts`**

Replace `store/src/main.ts`:

```typescript
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );
  app.enableCors();

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
```

- [x] **Step 6: Configure `AppModule` with ConfigModule**

Replace `store/src/app.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
  ],
})
export class AppModule {}
```

- [x] **Step 7: Verify scaffold works**

```bash
cd /home/baudui/Downloads/project/store
npm run build
```

Expected: Build succeeds with no errors.

- [x] **Step 8: Commit**

```bash
cd /home/baudui/Downloads/project/store
git init
git add .
git commit -m "chore: scaffold NestJS project for delivery management system"
```

---

## Task 2: Prisma Schema & Database Migration

**Files:**
- Create: `store/prisma/schema.prisma`
- Modify: `store/package.json` (add prisma scripts)

- [x] **Step 1: Initialize Prisma**

```bash
cd /home/baudui/Downloads/project/store
npx prisma init --datasource-provider postgresql
```

- [x] **Step 2: Write the complete Prisma schema**

Replace `store/prisma/schema.prisma`:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}

// ─── Enums ────────────────────────────────────────────

enum UserRole {
  ADMIN
  WAREHOUSE_MANAGER
  SHIPPER
}

enum TransactionType {
  IMPORT          // Nhập kho từ tổng kho
  EXPORT          // Xuất kho (giao hàng)
  ADJUSTMENT      // Điều chỉnh thủ công (kiểm kê)
  RETURN          // Hàng trả về
}

enum DeliveryOrderStatus {
  PENDING         // Chờ xử lý
  ASSIGNED        // Đã gán shipper
  PICKED_UP       // Đã lấy hàng
  IN_TRANSIT      // Đang giao
  DELIVERED       // Đã giao
  FAILED          // Giao thất bại
  CANCELLED       // Hủy
}

enum BatchStatus {
  PLANNING        // Đang lên kế hoạch tuyến
  OPTIMIZED       // Đã tối ưu tuyến
  IN_PROGRESS     // Đang giao
  COMPLETED       // Hoàn thành
  CANCELLED       // Hủy
}

// ─── Users & Auth ─────────────────────────────────────

model User {
  id           Int       @id @default(autoincrement())
  email        String    @unique
  password     String
  name         String
  phone        String?
  role         UserRole  @default(SHIPPER)
  isActive     Boolean   @default(true)
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt

  // Relations
  shipper               Shipper?
  inventoryTransactions  InventoryTransaction[]
  createdOrders          DeliveryOrder[]        @relation("CreatedBy")
}

// ─── Products ─────────────────────────────────────────

model Product {
  id          Int       @id @default(autoincrement())
  name        String
  sku         String    @unique
  unit        String    // Đơn vị tính: "cái", "kg", "thùng"...
  description String?
  price       Decimal   @db.Decimal(12, 2)
  isActive    Boolean   @default(true)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  warehouseStocks        WarehouseStock[]
  inventoryTransactions  InventoryTransaction[]
  deliveryOrderItems     DeliveryOrderItem[]
}

// ─── Warehouses ───────────────────────────────────────

model Warehouse {
  id          Int       @id @default(autoincrement())
  name        String
  address     String
  lat         Float?
  lng         Float?
  isActive    Boolean   @default(true)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  stocks                WarehouseStock[]
  inventoryTransactions InventoryTransaction[]
  deliveryOrders        DeliveryOrder[]
}

// ─── Stock (current quantity per product per warehouse) ──

model WarehouseStock {
  id          Int       @id @default(autoincrement())
  warehouseId Int
  productId   Int
  quantity    Int       @default(0)
  updatedAt   DateTime  @updatedAt

  warehouse   Warehouse @relation(fields: [warehouseId], references: [id])
  product     Product   @relation(fields: [productId], references: [id])

  @@unique([warehouseId, productId])
}

// ─── Inventory Transaction Log ────────────────────────
// NEVER update WarehouseStock.quantity directly.
// Always insert a transaction, then update stock atomically.

model InventoryTransaction {
  id            Int             @id @default(autoincrement())
  warehouseId   Int
  productId     Int
  type          TransactionType
  quantity      Int             // Positive = in, negative = out
  balanceBefore Int             // Stock trước giao dịch
  balanceAfter  Int             // Stock sau giao dịch
  reason        String?         // Lý do: "Nhập từ tổng kho PO#123", "Giao đơn #456"
  referenceId   String?         // ID tham chiếu (orderId, PO number, etc.)
  createdById   Int
  createdAt     DateTime        @default(now())

  warehouse     Warehouse       @relation(fields: [warehouseId], references: [id])
  product       Product         @relation(fields: [productId], references: [id])
  createdBy     User            @relation(fields: [createdById], references: [id])

  @@index([warehouseId, productId])
  @@index([createdAt])
}

// ─── Shippers ─────────────────────────────────────────

model Shipper {
  id          Int       @id @default(autoincrement())
  userId      Int       @unique
  phone       String
  vehicleType String?   // "xe máy", "ô tô", "xe tải nhỏ"
  isAvailable Boolean   @default(true)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  user            User              @relation(fields: [userId], references: [id])
  deliveryOrders  DeliveryOrder[]
  deliveryBatches DeliveryBatch[]
}

// ─── Delivery Orders (đơn hàng giao) ─────────────────

model DeliveryOrder {
  id              Int                 @id @default(autoincrement())
  recipientName   String
  recipientPhone  String
  address         String
  lat             Float?              // Geocoded từ Mapbox
  lng             Float?
  warehouseId     Int
  shipperId       Int?
  status          DeliveryOrderStatus @default(PENDING)
  notes           String?
  createdById     Int
  createdAt       DateTime            @default(now())
  updatedAt       DateTime            @updatedAt

  warehouse       Warehouse           @relation(fields: [warehouseId], references: [id])
  shipper         Shipper?            @relation(fields: [shipperId], references: [id])
  createdBy       User                @relation("CreatedBy", fields: [createdById], references: [id])
  items           DeliveryOrderItem[]
  batchOrder      DeliveryBatchOrder?

  @@index([status])
  @@index([shipperId, status])
  @@index([warehouseId])
}

model DeliveryOrderItem {
  id        Int     @id @default(autoincrement())
  orderId   Int
  productId Int
  quantity  Int

  order     DeliveryOrder @relation(fields: [orderId], references: [id], onDelete: Cascade)
  product   Product       @relation(fields: [productId], references: [id])

  @@unique([orderId, productId])
}

// ─── Delivery Batches (đơn ghép) ──────────────────────
// A batch groups multiple DeliveryOrders for one shipper, one trip.

model DeliveryBatch {
  id                 Int          @id @default(autoincrement())
  shipperId          Int
  status             BatchStatus  @default(PLANNING)
  optimizedRoute     Json?        // Mapbox response: waypoint order, polyline, etc.
  totalDistanceM     Float?       // Tổng khoảng cách (meters)
  estimatedDurationS Float?       // Thời gian ước tính (seconds)
  startedAt          DateTime?
  completedAt        DateTime?
  createdAt          DateTime     @default(now())
  updatedAt          DateTime     @updatedAt

  shipper            Shipper             @relation(fields: [shipperId], references: [id])
  orders             DeliveryBatchOrder[]
}

model DeliveryBatchOrder {
  id            Int     @id @default(autoincrement())
  batchId       Int
  orderId       Int     @unique   // Mỗi đơn chỉ thuộc 1 batch
  sequenceOrder Int               // Thứ tự ghé (1, 2, 3...) — từ Mapbox Optimization

  batch         DeliveryBatch @relation(fields: [batchId], references: [id], onDelete: Cascade)
  order         DeliveryOrder @relation(fields: [orderId], references: [id])

  @@index([batchId])
}
```

- [x] **Step 3: Run migration**

```bash
cd /home/baudui/Downloads/project/store
npx prisma migrate dev --name init
```

Expected: Migration created and applied. All tables created in Supabase.

- [x] **Step 4: Verify with Prisma Studio**

```bash
npx prisma studio
```

Expected: Opens browser at `localhost:5555`, showing all 11 models with correct relations.

- [x] **Step 5: Commit**

```bash
git add prisma/ package.json
git commit -m "feat: add Prisma schema with all delivery management models"
```

---

## Task 3: PrismaService & PrismaModule

**Files:**
- Create: `store/src/prisma/prisma.service.ts`
- Create: `store/src/prisma/prisma.module.ts`
- Modify: `store/src/app.module.ts`

- [x] **Step 1: Create PrismaService**

Create `store/src/prisma/prisma.service.ts`:

```typescript
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
```

- [x] **Step 2: Create PrismaModule (global)**

Create `store/src/prisma/prisma.module.ts`:

```typescript
import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
```

- [x] **Step 3: Register PrismaModule in AppModule**

Update `store/src/app.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
  ],
})
export class AppModule {}
```

- [x] **Step 4: Verify build**

```bash
cd /home/baudui/Downloads/project/store
npm run build
```

Expected: Build succeeds.

- [x] **Step 5: Commit**

```bash
git add src/prisma/
git commit -m "feat: add PrismaService and PrismaModule"
```

---

## Task 4: Auth Module (JWT + Roles)

**Files:**
- Create: `store/src/auth/auth.module.ts`
- Create: `store/src/auth/auth.controller.ts`
- Create: `store/src/auth/auth.service.ts`
- Create: `store/src/auth/auth.guard.ts`
- Create: `store/src/auth/roles.guard.ts`
- Create: `store/src/auth/roles.decorator.ts`
- Create: `store/src/auth/dto/register.dto.ts`
- Create: `store/src/auth/dto/login.dto.ts`
- Modify: `store/src/app.module.ts`

- [x] **Step 1: Create DTOs**

Create `store/src/auth/dto/register.dto.ts`:

```typescript
import { IsEmail, IsString, MinLength, IsEnum, IsOptional } from 'class-validator';
import { UserRole } from '@prisma/client';

export class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}
```

Create `store/src/auth/dto/login.dto.ts`:

```typescript
import { IsEmail, IsString } from 'class-validator';

export class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  password: string;
}
```

- [x] **Step 2: Create AuthService**

Create `store/src/auth/auth.service.ts`:

```typescript
import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    const exists = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (exists) throw new ConflictException('Email đã tồn tại');

    const hashed = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: { ...dto, password: hashed },
    });

    return this.generateTokens(user.id, user.role);
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (!user) throw new UnauthorizedException('Email hoặc mật khẩu sai');

    const valid = await bcrypt.compare(dto.password, user.password);
    if (!valid) throw new UnauthorizedException('Email hoặc mật khẩu sai');

    return this.generateTokens(user.id, user.role);
  }

  private generateTokens(userId: number, role: string) {
    const payload = { sub: userId, role };

    const accessToken = jwt.sign(
      payload,
      this.config.getOrThrow<string>('JWT_ACCESS_SECRET'),
      { expiresIn: this.config.get('JWT_ACCESS_EXPIRES_IN', '15m') },
    );

    const refreshToken = jwt.sign(
      payload,
      this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
      { expiresIn: this.config.get('JWT_REFRESH_EXPIRES_IN', '7d') },
    );

    return { accessToken, refreshToken };
  }
}
```

- [x] **Step 3: Create AuthGuard**

Create `store/src/auth/auth.guard.ts`:

```typescript
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const token = this.extractToken(request);
    if (!token) throw new UnauthorizedException('Thiếu token');

    try {
      const payload = jwt.verify(
        token,
        this.config.getOrThrow<string>('JWT_ACCESS_SECRET'),
      );
      request.user = payload;
      return true;
    } catch {
      throw new UnauthorizedException('Token không hợp lệ');
    }
  }

  private extractToken(request: any): string | undefined {
    const auth = request.headers.authorization;
    if (!auth) return undefined;
    const [type, token] = auth.split(' ');
    return type === 'Bearer' ? token : undefined;
  }
}
```

- [x] **Step 4: Create Roles decorator & guard**

Create `store/src/auth/roles.decorator.ts`:

```typescript
import { SetMetadata } from '@nestjs/common';
import { UserRole } from '@prisma/client';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
```

Create `store/src/auth/roles.guard.ts`:

```typescript
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@prisma/client';
import { ROLES_KEY } from './roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!requiredRoles) return true;

    const { user } = context.switchToHttp().getRequest();
    return requiredRoles.includes(user.role);
  }
}
```

- [x] **Step 5: Create AuthController**

Create `store/src/auth/auth.controller.ts`:

```typescript
import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }
}
```

- [x] **Step 6: Create AuthModule & register in AppModule**

Create `store/src/auth/auth.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

@Module({
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}
```

Update `store/src/app.module.ts` — add `AuthModule` to imports:

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
  ],
})
export class AppModule {}
```

- [x] **Step 7: Verify build**

```bash
npm run build
```

Expected: Build succeeds.

- [x] **Step 8: Commit**

```bash
git add src/auth/
git commit -m "feat: add auth module with JWT login, register, and role-based guards"
```

---

## Task 5: Products Module (Admin CRUD)

**Files:**
- Create: `store/src/products/dto/create-product.dto.ts`
- Create: `store/src/products/dto/update-product.dto.ts`
- Create: `store/src/products/products.repository.ts`
- Create: `store/src/products/products.service.ts`
- Create: `store/src/products/products.controller.ts`
- Create: `store/src/products/products.module.ts`
- Modify: `store/src/app.module.ts`

- [x] **Step 1: Create DTOs**

Create `store/src/products/dto/create-product.dto.ts`:

```typescript
import { IsString, IsNumber, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateProductDto {
  @IsString()
  name: string;

  @IsString()
  sku: string;

  @IsString()
  unit: string;

  @IsOptional()
  @IsString()
  description?: string;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  price: number;
}
```

Create `store/src/products/dto/update-product.dto.ts`:

```typescript
import { PartialType } from '@nestjs/mapped-types';
import { CreateProductDto } from './create-product.dto';

export class UpdateProductDto extends PartialType(CreateProductDto) {}
```

- [x] **Step 2: Create Repository**

Create `store/src/products/products.repository.ts`:

```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateProductDto) {
    return this.prisma.product.create({ data: dto });
  }

  findAll() {
    return this.prisma.product.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
  }

  findById(id: number) {
    return this.prisma.product.findUnique({ where: { id } });
  }

  findBySku(sku: string) {
    return this.prisma.product.findUnique({ where: { sku } });
  }

  update(id: number, dto: UpdateProductDto) {
    return this.prisma.product.update({ where: { id }, data: dto });
  }

  softDelete(id: number) {
    return this.prisma.product.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
```

- [x] **Step 3: Create Service**

Create `store/src/products/products.service.ts`:

```typescript
import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { ProductsRepository } from './products.repository';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  constructor(private readonly repo: ProductsRepository) {}

  async create(dto: CreateProductDto) {
    const existing = await this.repo.findBySku(dto.sku);
    if (existing) throw new ConflictException(`SKU "${dto.sku}" đã tồn tại`);
    return this.repo.create(dto);
  }

  findAll() {
    return this.repo.findAll();
  }

  async findById(id: number) {
    const product = await this.repo.findById(id);
    if (!product) throw new NotFoundException('Sản phẩm không tồn tại');
    return product;
  }

  async update(id: number, dto: UpdateProductDto) {
    await this.findById(id); // throws if not found
    return this.repo.update(id, dto);
  }

  async remove(id: number) {
    await this.findById(id);
    return this.repo.softDelete(id);
  }
}
```

- [x] **Step 4: Create Controller (admin only)**

Create `store/src/products/products.controller.ts`:

```typescript
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Controller('products')
@UseGuards(AuthGuard, RolesGuard)
export class ProductsController {
  constructor(private readonly service: ProductsService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.WAREHOUSE_MANAGER)
  create(@Body() dto: CreateProductDto) {
    return this.service.create(dto);
  }

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findById(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.WAREHOUSE_MANAGER)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateProductDto,
  ) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
```

- [x] **Step 5: Create Module & register**

Create `store/src/products/products.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { ProductsRepository } from './products.repository';

@Module({
  controllers: [ProductsController],
  providers: [ProductsService, ProductsRepository],
  exports: [ProductsService, ProductsRepository],
})
export class ProductsModule {}
```

Add `ProductsModule` to `store/src/app.module.ts` imports array.

- [x] **Step 6: Verify build & commit**

```bash
npm run build
git add src/products/
git commit -m "feat: add products module with admin CRUD"
```

---

## Task 6: Warehouses Module

**Files:**
- Create: `store/src/warehouses/dto/create-warehouse.dto.ts`
- Create: `store/src/warehouses/dto/update-warehouse.dto.ts`
- Create: `store/src/warehouses/warehouses.repository.ts`
- Create: `store/src/warehouses/warehouses.service.ts`
- Create: `store/src/warehouses/warehouses.controller.ts`
- Create: `store/src/warehouses/warehouses.module.ts`
- Modify: `store/src/app.module.ts`

- [x] **Step 1: Create DTOs**

Create `store/src/warehouses/dto/create-warehouse.dto.ts`:

```typescript
import { IsString, IsOptional, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateWarehouseDto {
  @IsString()
  name: string;

  @IsString()
  address: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  lat?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  lng?: number;
}
```

Create `store/src/warehouses/dto/update-warehouse.dto.ts`:

```typescript
import { PartialType } from '@nestjs/mapped-types';
import { CreateWarehouseDto } from './create-warehouse.dto';

export class UpdateWarehouseDto extends PartialType(CreateWarehouseDto) {}
```

- [x] **Step 2: Create Repository**

Create `store/src/warehouses/warehouses.repository.ts`:

```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateWarehouseDto } from './dto/create-warehouse.dto';
import { UpdateWarehouseDto } from './dto/update-warehouse.dto';

@Injectable()
export class WarehousesRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateWarehouseDto) {
    return this.prisma.warehouse.create({ data: dto });
  }

  findAll() {
    return this.prisma.warehouse.findMany({
      where: { isActive: true },
      include: { stocks: { include: { product: true } } },
    });
  }

  findById(id: number) {
    return this.prisma.warehouse.findUnique({
      where: { id },
      include: { stocks: { include: { product: true } } },
    });
  }

  update(id: number, dto: UpdateWarehouseDto) {
    return this.prisma.warehouse.update({ where: { id }, data: dto });
  }

  softDelete(id: number) {
    return this.prisma.warehouse.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
```

- [x] **Step 3: Create Service**

Create `store/src/warehouses/warehouses.service.ts`:

```typescript
import { Injectable, NotFoundException } from '@nestjs/common';
import { WarehousesRepository } from './warehouses.repository';
import { CreateWarehouseDto } from './dto/create-warehouse.dto';
import { UpdateWarehouseDto } from './dto/update-warehouse.dto';

@Injectable()
export class WarehousesService {
  constructor(private readonly repo: WarehousesRepository) {}

  create(dto: CreateWarehouseDto) {
    return this.repo.create(dto);
  }

  findAll() {
    return this.repo.findAll();
  }

  async findById(id: number) {
    const warehouse = await this.repo.findById(id);
    if (!warehouse) throw new NotFoundException('Kho không tồn tại');
    return warehouse;
  }

  async update(id: number, dto: UpdateWarehouseDto) {
    await this.findById(id);
    return this.repo.update(id, dto);
  }

  async remove(id: number) {
    await this.findById(id);
    return this.repo.softDelete(id);
  }
}
```

- [x] **Step 4: Create Controller (admin only)**

Create `store/src/warehouses/warehouses.controller.ts`:

```typescript
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { WarehousesService } from './warehouses.service';
import { CreateWarehouseDto } from './dto/create-warehouse.dto';
import { UpdateWarehouseDto } from './dto/update-warehouse.dto';

@Controller('warehouses')
@UseGuards(AuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.WAREHOUSE_MANAGER)
export class WarehousesController {
  constructor(private readonly service: WarehousesService) {}

  @Post()
  create(@Body() dto: CreateWarehouseDto) {
    return this.service.create(dto);
  }

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findById(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateWarehouseDto,
  ) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
```

- [x] **Step 5: Create Module & register**

Create `store/src/warehouses/warehouses.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { WarehousesController } from './warehouses.controller';
import { WarehousesService } from './warehouses.service';
import { WarehousesRepository } from './warehouses.repository';

@Module({
  controllers: [WarehousesController],
  providers: [WarehousesService, WarehousesRepository],
  exports: [WarehousesService, WarehousesRepository],
})
export class WarehousesModule {}
```

Add `WarehousesModule` to `store/src/app.module.ts` imports.

- [x] **Step 6: Verify build & commit**

```bash
npm run build
git add src/warehouses/
git commit -m "feat: add warehouses module with CRUD"
```

---

## Task 7: Inventory Module (Transaction Log Pattern)

> **Design rationale:** This is the most critical module for data integrity. NEVER update `WarehouseStock.quantity` directly. Every stock change goes through a transaction that records `balanceBefore` and `balanceAfter`. This makes debugging stock discrepancies trivial — just query the transaction log.

**Files:**
- Create: `store/src/inventory/dto/import-stock.dto.ts`
- Create: `store/src/inventory/dto/adjust-stock.dto.ts`
- Create: `store/src/inventory/inventory.repository.ts`
- Create: `store/src/inventory/inventory.service.ts`
- Create: `store/src/inventory/inventory.controller.ts`
- Create: `store/src/inventory/inventory.module.ts`
- Modify: `store/src/app.module.ts`

- [x] **Step 1: Create DTOs**

Create `store/src/inventory/dto/import-stock.dto.ts`:

```typescript
import { IsInt, IsString, IsOptional, Min } from 'class-validator';

export class ImportStockDto {
  @IsInt()
  warehouseId: number;

  @IsInt()
  productId: number;

  @IsInt()
  @Min(1)
  quantity: number;

  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @IsString()
  referenceId?: string; // PO number, etc.
}
```

Create `store/src/inventory/dto/adjust-stock.dto.ts`:

```typescript
import { IsInt, IsString } from 'class-validator';

export class AdjustStockDto {
  @IsInt()
  warehouseId: number;

  @IsInt()
  productId: number;

  @IsInt()
  quantity: number; // Positive = add, negative = subtract

  @IsString()
  reason: string; // Bắt buộc khi điều chỉnh thủ công
}
```

- [x] **Step 2: Create Repository (atomic stock operations)**

Create `store/src/inventory/inventory.repository.ts`:

```typescript
import { Injectable } from '@nestjs/common';
import { TransactionType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class InventoryRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Atomic stock change: upsert WarehouseStock + insert transaction log.
   * Uses Prisma interactive transaction to guarantee consistency.
   */
  async changeStock(params: {
    warehouseId: number;
    productId: number;
    quantity: number; // positive = in, negative = out
    type: TransactionType;
    reason?: string;
    referenceId?: string;
    createdById: number;
  }) {
    return this.prisma.$transaction(async (tx) => {
      // 1. Get or create current stock record
      const stock = await tx.warehouseStock.upsert({
        where: {
          warehouseId_productId: {
            warehouseId: params.warehouseId,
            productId: params.productId,
          },
        },
        create: {
          warehouseId: params.warehouseId,
          productId: params.productId,
          quantity: 0,
        },
        update: {},
      });

      const balanceBefore = stock.quantity;
      const balanceAfter = balanceBefore + params.quantity;

      if (balanceAfter < 0) {
        throw new Error(
          `Tồn kho không đủ. Hiện có: ${balanceBefore}, yêu cầu xuất: ${Math.abs(params.quantity)}`,
        );
      }

      // 2. Update stock quantity
      await tx.warehouseStock.update({
        where: {
          warehouseId_productId: {
            warehouseId: params.warehouseId,
            productId: params.productId,
          },
        },
        data: { quantity: balanceAfter },
      });

      // 3. Insert transaction log
      const transaction = await tx.inventoryTransaction.create({
        data: {
          warehouseId: params.warehouseId,
          productId: params.productId,
          type: params.type,
          quantity: params.quantity,
          balanceBefore,
          balanceAfter,
          reason: params.reason,
          referenceId: params.referenceId,
          createdById: params.createdById,
        },
      });

      return { transaction, balanceBefore, balanceAfter };
    });
  }

  findStockByWarehouse(warehouseId: number) {
    return this.prisma.warehouseStock.findMany({
      where: { warehouseId },
      include: { product: true },
    });
  }

  findTransactions(params: {
    warehouseId?: number;
    productId?: number;
    type?: TransactionType;
    take?: number;
    skip?: number;
  }) {
    return this.prisma.inventoryTransaction.findMany({
      where: {
        warehouseId: params.warehouseId,
        productId: params.productId,
        type: params.type,
      },
      include: { product: true, createdBy: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
      take: params.take ?? 50,
      skip: params.skip ?? 0,
    });
  }

  findStockByProduct(productId: number) {
    return this.prisma.warehouseStock.findMany({
      where: { productId },
      include: { warehouse: true },
    });
  }
}
```

- [x] **Step 3: Create Service**

Create `store/src/inventory/inventory.service.ts`:

```typescript
import {
  Injectable,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { TransactionType } from '@prisma/client';
import { InventoryRepository } from './inventory.repository';
import { ImportStockDto } from './dto/import-stock.dto';
import { AdjustStockDto } from './dto/adjust-stock.dto';

@Injectable()
export class InventoryService {
  private readonly logger = new Logger(InventoryService.name);

  constructor(private readonly repo: InventoryRepository) {}

  /** Nhập kho từ tổng kho */
  async importStock(dto: ImportStockDto, userId: number) {
    const result = await this.repo.changeStock({
      warehouseId: dto.warehouseId,
      productId: dto.productId,
      quantity: dto.quantity,
      type: TransactionType.IMPORT,
      reason: dto.reason ?? 'Nhập kho từ tổng kho',
      referenceId: dto.referenceId,
      createdById: userId,
    });

    this.logger.log(
      `IMPORT: product=${dto.productId} warehouse=${dto.warehouseId} qty=${dto.quantity} ` +
      `balance: ${result.balanceBefore} → ${result.balanceAfter}`,
    );

    return result;
  }

  /** Xuất kho (gọi từ delivery order service) */
  async exportStock(params: {
    warehouseId: number;
    productId: number;
    quantity: number;
    referenceId: string;
    userId: number;
  }) {
    try {
      return await this.repo.changeStock({
        warehouseId: params.warehouseId,
        productId: params.productId,
        quantity: -params.quantity,
        type: TransactionType.EXPORT,
        reason: `Xuất kho cho đơn giao #${params.referenceId}`,
        referenceId: params.referenceId,
        createdById: params.userId,
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes('Tồn kho không đủ')) {
        throw new BadRequestException(error.message);
      }
      throw error;
    }
  }

  /** Điều chỉnh thủ công (kiểm kê) */
  async adjustStock(dto: AdjustStockDto, userId: number) {
    try {
      return await this.repo.changeStock({
        warehouseId: dto.warehouseId,
        productId: dto.productId,
        quantity: dto.quantity,
        type: TransactionType.ADJUSTMENT,
        reason: dto.reason,
        createdById: userId,
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes('Tồn kho không đủ')) {
        throw new BadRequestException(error.message);
      }
      throw error;
    }
  }

  getStockByWarehouse(warehouseId: number) {
    return this.repo.findStockByWarehouse(warehouseId);
  }

  getStockByProduct(productId: number) {
    return this.repo.findStockByProduct(productId);
  }

  getTransactions(params: {
    warehouseId?: number;
    productId?: number;
    type?: TransactionType;
    take?: number;
    skip?: number;
  }) {
    return this.repo.findTransactions(params);
  }
}
```

- [x] **Step 4: Create Controller**

Create `store/src/inventory/inventory.controller.ts`:

```typescript
import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { TransactionType, UserRole } from '@prisma/client';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { InventoryService } from './inventory.service';
import { ImportStockDto } from './dto/import-stock.dto';
import { AdjustStockDto } from './dto/adjust-stock.dto';

@Controller('inventory')
@UseGuards(AuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.WAREHOUSE_MANAGER)
export class InventoryController {
  constructor(private readonly service: InventoryService) {}

  @Post('import')
  importStock(@Body() dto: ImportStockDto, @Req() req: any) {
    return this.service.importStock(dto, req.user.sub);
  }

  @Post('adjust')
  adjustStock(@Body() dto: AdjustStockDto, @Req() req: any) {
    return this.service.adjustStock(dto, req.user.sub);
  }

  @Get('warehouse/:warehouseId')
  getStockByWarehouse(@Param('warehouseId', ParseIntPipe) id: number) {
    return this.service.getStockByWarehouse(id);
  }

  @Get('product/:productId')
  getStockByProduct(@Param('productId', ParseIntPipe) id: number) {
    return this.service.getStockByProduct(id);
  }

  @Get('transactions')
  getTransactions(
    @Query('warehouseId') warehouseId?: string,
    @Query('productId') productId?: string,
    @Query('type') type?: TransactionType,
    @Query('take') take?: string,
    @Query('skip') skip?: string,
  ) {
    return this.service.getTransactions({
      warehouseId: warehouseId ? +warehouseId : undefined,
      productId: productId ? +productId : undefined,
      type,
      take: take ? +take : undefined,
      skip: skip ? +skip : undefined,
    });
  }
}
```

- [x] **Step 5: Create Module & register**

Create `store/src/inventory/inventory.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { InventoryController } from './inventory.controller';
import { InventoryService } from './inventory.service';
import { InventoryRepository } from './inventory.repository';

@Module({
  controllers: [InventoryController],
  providers: [InventoryService, InventoryRepository],
  exports: [InventoryService],
})
export class InventoryModule {}
```

Add `InventoryModule` to `store/src/app.module.ts` imports.

- [x] **Step 6: Verify build & commit**

```bash
npm run build
git add src/inventory/
git commit -m "feat: add inventory module with transaction-log pattern for stock tracking"
```

---

## Task 8: Shippers Module

**Files:**
- Create: `store/src/shippers/dto/create-shipper.dto.ts`
- Create: `store/src/shippers/dto/update-shipper.dto.ts`
- Create: `store/src/shippers/shippers.repository.ts`
- Create: `store/src/shippers/shippers.service.ts`
- Create: `store/src/shippers/shippers.controller.ts`
- Create: `store/src/shippers/shippers.module.ts`
- Modify: `store/src/app.module.ts`

- [x] **Step 1: Create DTOs**

Create `store/src/shippers/dto/create-shipper.dto.ts`:

```typescript
import { IsInt, IsString, IsOptional } from 'class-validator';

export class CreateShipperDto {
  @IsInt()
  userId: number;

  @IsString()
  phone: string;

  @IsOptional()
  @IsString()
  vehicleType?: string;
}
```

Create `store/src/shippers/dto/update-shipper.dto.ts`:

```typescript
import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class UpdateShipperDto {
  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  vehicleType?: string;

  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean;
}
```

- [x] **Step 2: Create Repository**

Create `store/src/shippers/shippers.repository.ts`:

```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateShipperDto } from './dto/create-shipper.dto';
import { UpdateShipperDto } from './dto/update-shipper.dto';

@Injectable()
export class ShippersRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateShipperDto) {
    return this.prisma.shipper.create({
      data: dto,
      include: { user: { select: { id: true, name: true, email: true } } },
    });
  }

  findAll() {
    return this.prisma.shipper.findMany({
      include: { user: { select: { id: true, name: true, email: true } } },
    });
  }

  findById(id: number) {
    return this.prisma.shipper.findUnique({
      where: { id },
      include: { user: { select: { id: true, name: true, email: true } } },
    });
  }

  findAvailable() {
    return this.prisma.shipper.findMany({
      where: { isAvailable: true },
      include: { user: { select: { id: true, name: true } } },
    });
  }

  update(id: number, dto: UpdateShipperDto) {
    return this.prisma.shipper.update({ where: { id }, data: dto });
  }
}
```

- [x] **Step 3: Create Service**

Create `store/src/shippers/shippers.service.ts`:

```typescript
import { Injectable, NotFoundException } from '@nestjs/common';
import { ShippersRepository } from './shippers.repository';
import { CreateShipperDto } from './dto/create-shipper.dto';
import { UpdateShipperDto } from './dto/update-shipper.dto';

@Injectable()
export class ShippersService {
  constructor(private readonly repo: ShippersRepository) {}

  create(dto: CreateShipperDto) {
    return this.repo.create(dto);
  }

  findAll() {
    return this.repo.findAll();
  }

  async findById(id: number) {
    const shipper = await this.repo.findById(id);
    if (!shipper) throw new NotFoundException('Shipper không tồn tại');
    return shipper;
  }

  findAvailable() {
    return this.repo.findAvailable();
  }

  async update(id: number, dto: UpdateShipperDto) {
    await this.findById(id);
    return this.repo.update(id, dto);
  }
}
```

- [x] **Step 4: Create Controller**

Create `store/src/shippers/shippers.controller.ts`:

```typescript
import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { ShippersService } from './shippers.service';
import { CreateShipperDto } from './dto/create-shipper.dto';
import { UpdateShipperDto } from './dto/update-shipper.dto';

@Controller('shippers')
@UseGuards(AuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.WAREHOUSE_MANAGER)
export class ShippersController {
  constructor(private readonly service: ShippersService) {}

  @Post()
  create(@Body() dto: CreateShipperDto) {
    return this.service.create(dto);
  }

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get('available')
  findAvailable() {
    return this.service.findAvailable();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findById(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateShipperDto,
  ) {
    return this.service.update(id, dto);
  }
}
```

- [x] **Step 5: Create Module & register**

Create `store/src/shippers/shippers.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { ShippersController } from './shippers.controller';
import { ShippersService } from './shippers.service';
import { ShippersRepository } from './shippers.repository';

@Module({
  controllers: [ShippersController],
  providers: [ShippersService, ShippersRepository],
  exports: [ShippersService, ShippersRepository],
})
export class ShippersModule {}
```

Add `ShippersModule` to `store/src/app.module.ts` imports.

- [x] **Step 6: Verify build & commit**

```bash
npm run build
git add src/shippers/
git commit -m "feat: add shippers module"
```

---

## Task 9: Mapbox Integration Module

> **This module wraps 3 Mapbox APIs:**
> 1. **Geocoding** — convert street address → lat/lng coordinates
> 2. **Optimization** — solve TSP/VRP (send N waypoints, get optimal visit order)
> 3. **Directions** — get driving route between waypoints (for map rendering)

**Files:**
- Create: `store/src/mapbox/mapbox.types.ts`
- Create: `store/src/mapbox/mapbox.service.ts`
- Create: `store/src/mapbox/mapbox.module.ts`
- Create: `store/src/mapbox/mapbox.service.spec.ts`

- [x] **Step 1: Create types**

Create `store/src/mapbox/mapbox.types.ts`:

```typescript
export interface Coordinates {
  lat: number;
  lng: number;
}

export interface GeocodingResult {
  placeName: string;
  lat: number;
  lng: number;
}

export interface OptimizedWaypoint {
  waypointIndex: number;     // Original index in input array
  tripsIndex: number;        // Position in optimized route
  name: string;
}

export interface OptimizationResult {
  waypoints: OptimizedWaypoint[];
  totalDistanceM: number;    // Total distance in meters
  totalDurationS: number;    // Total duration in seconds
  geometry: string;          // Encoded polyline for map rendering
}

export interface DirectionsResult {
  distanceM: number;
  durationS: number;
  geometry: string;
}
```

- [x] **Step 2: Create MapboxService**

Create `store/src/mapbox/mapbox.service.ts`:

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  Coordinates,
  GeocodingResult,
  OptimizationResult,
  DirectionsResult,
} from './mapbox.types';

@Injectable()
export class MapboxService {
  private readonly logger = new Logger(MapboxService.name);
  private readonly token: string;
  private readonly baseUrl = 'https://api.mapbox.com';

  constructor(private readonly config: ConfigService) {
    this.token = this.config.getOrThrow<string>('MAPBOX_ACCESS_TOKEN');
  }

  /**
   * Geocode an address to lat/lng coordinates.
   * Mapbox Geocoding API v5.
   */
  async geocode(address: string): Promise<GeocodingResult | null> {
    const encoded = encodeURIComponent(address);
    const url =
      `${this.baseUrl}/geocoding/v5/mapbox.places/${encoded}.json` +
      `?access_token=${this.token}&country=VN&limit=1&language=vi`;

    const res = await fetch(url);
    if (!res.ok) {
      this.logger.error(`Geocoding failed: ${res.status} ${res.statusText}`);
      return null;
    }

    const data = await res.json();
    const feature = data.features?.[0];
    if (!feature) return null;

    return {
      placeName: feature.place_name,
      lng: feature.center[0],
      lat: feature.center[1],
    };
  }

  /**
   * Optimize route for multiple waypoints (solve TSP).
   * Mapbox Optimization API v1.
   *
   * @param waypoints - Array of coordinates. First = start (warehouse), rest = delivery stops.
   * @param roundtrip - If true, shipper returns to start after last delivery. Default true.
   *
   * Limits: max 12 waypoints per request (free tier).
   */
  async optimizeRoute(
    waypoints: Coordinates[],
    roundtrip = true,
  ): Promise<OptimizationResult | null> {
    if (waypoints.length < 2) return null;
    if (waypoints.length > 12) {
      this.logger.warn(`Too many waypoints (${waypoints.length}), max 12. Truncating.`);
      waypoints = waypoints.slice(0, 12);
    }

    // Mapbox format: lng,lat;lng,lat;...
    const coordinates = waypoints.map((w) => `${w.lng},${w.lat}`).join(';');
    const url =
      `${this.baseUrl}/optimized-trips/v1/mapbox/driving/${coordinates}` +
      `?access_token=${this.token}` +
      `&roundtrip=${roundtrip}` +
      `&source=first` +
      `&geometries=polyline` +
      `&overview=full`;

    const res = await fetch(url);
    if (!res.ok) {
      this.logger.error(`Optimization failed: ${res.status} ${res.statusText}`);
      return null;
    }

    const data = await res.json();
    if (data.code !== 'Ok' || !data.trips?.length) {
      this.logger.error(`Optimization returned: ${data.code}`);
      return null;
    }

    const trip = data.trips[0];
    return {
      waypoints: data.waypoints.map((wp: any) => ({
        waypointIndex: wp.waypoint_index,
        tripsIndex: wp.trips_index,
        name: wp.name,
      })),
      totalDistanceM: trip.distance,
      totalDurationS: trip.duration,
      geometry: trip.geometry,
    };
  }

  /**
   * Get driving directions between ordered waypoints.
   * Mapbox Directions API v5.
   */
  async getDirections(waypoints: Coordinates[]): Promise<DirectionsResult | null> {
    if (waypoints.length < 2) return null;

    const coordinates = waypoints.map((w) => `${w.lng},${w.lat}`).join(';');
    const url =
      `${this.baseUrl}/directions/v5/mapbox/driving/${coordinates}` +
      `?access_token=${this.token}` +
      `&geometries=polyline` +
      `&overview=full`;

    const res = await fetch(url);
    if (!res.ok) {
      this.logger.error(`Directions failed: ${res.status} ${res.statusText}`);
      return null;
    }

    const data = await res.json();
    const route = data.routes?.[0];
    if (!route) return null;

    return {
      distanceM: route.distance,
      durationS: route.duration,
      geometry: route.geometry,
    };
  }
}
```

- [x] **Step 3: Create Module**

Create `store/src/mapbox/mapbox.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { MapboxService } from './mapbox.service';

@Module({
  providers: [MapboxService],
  exports: [MapboxService],
})
export class MapboxModule {}
```

- [x] **Step 4: Write unit test**

Create `store/src/mapbox/mapbox.service.spec.ts`:

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { MapboxService } from './mapbox.service';

describe('MapboxService', () => {
  let service: MapboxService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MapboxService,
        {
          provide: ConfigService,
          useValue: {
            getOrThrow: () => 'test_token',
            get: (key: string, def: string) => def,
          },
        },
      ],
    }).compile();

    service = module.get<MapboxService>(MapboxService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('geocode should return null for empty result', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ features: [] }),
    }) as any;

    const result = await service.geocode('nonexistent address');
    expect(result).toBeNull();
  });

  it('optimizeRoute should return null for < 2 waypoints', async () => {
    const result = await service.optimizeRoute([{ lat: 10, lng: 106 }]);
    expect(result).toBeNull();
  });
});
```

- [x] **Step 5: Run test**

```bash
npm test -- --testPathPattern=mapbox
```

Expected: All tests pass.

- [x] **Step 6: Commit**

```bash
git add src/mapbox/
git commit -m "feat: add Mapbox service with geocoding, optimization, and directions"
```

---

## Task 10: Delivery Orders Module (with auto stock deduction)

**Files:**
- Create: `store/src/delivery-orders/dto/create-delivery-order.dto.ts`
- Create: `store/src/delivery-orders/dto/update-order-status.dto.ts`
- Create: `store/src/delivery-orders/delivery-orders.repository.ts`
- Create: `store/src/delivery-orders/delivery-orders.service.ts`
- Create: `store/src/delivery-orders/delivery-orders.controller.ts`
- Create: `store/src/delivery-orders/delivery-orders.module.ts`
- Modify: `store/src/app.module.ts`

- [x] **Step 1: Create DTOs**

Create `store/src/delivery-orders/dto/create-delivery-order.dto.ts`:

```typescript
import {
  IsString,
  IsInt,
  IsOptional,
  IsArray,
  ValidateNested,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class OrderItemDto {
  @IsInt()
  productId: number;

  @IsInt()
  @Min(1)
  quantity: number;
}

export class CreateDeliveryOrderDto {
  @IsString()
  recipientName: string;

  @IsString()
  recipientPhone: string;

  @IsString()
  address: string;

  @IsInt()
  warehouseId: number;

  @IsOptional()
  @IsInt()
  shipperId?: number;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];
}
```

Create `store/src/delivery-orders/dto/update-order-status.dto.ts`:

```typescript
import { IsEnum } from 'class-validator';
import { DeliveryOrderStatus } from '@prisma/client';

export class UpdateOrderStatusDto {
  @IsEnum(DeliveryOrderStatus)
  status: DeliveryOrderStatus;
}
```

- [x] **Step 2: Create Repository**

Create `store/src/delivery-orders/delivery-orders.repository.ts`:

```typescript
import { Injectable } from '@nestjs/common';
import { DeliveryOrderStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDeliveryOrderDto } from './dto/create-delivery-order.dto';

@Injectable()
export class DeliveryOrdersRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateDeliveryOrderDto, createdById: number, lat?: number, lng?: number) {
    return this.prisma.deliveryOrder.create({
      data: {
        recipientName: dto.recipientName,
        recipientPhone: dto.recipientPhone,
        address: dto.address,
        lat,
        lng,
        warehouseId: dto.warehouseId,
        shipperId: dto.shipperId,
        notes: dto.notes,
        createdById,
        items: {
          create: dto.items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
          })),
        },
      },
      include: { items: { include: { product: true } }, warehouse: true },
    });
  }

  findAll(filters?: { status?: DeliveryOrderStatus; shipperId?: number; warehouseId?: number }) {
    return this.prisma.deliveryOrder.findMany({
      where: {
        status: filters?.status,
        shipperId: filters?.shipperId,
        warehouseId: filters?.warehouseId,
      },
      include: {
        items: { include: { product: true } },
        warehouse: true,
        shipper: { include: { user: { select: { name: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  findById(id: number) {
    return this.prisma.deliveryOrder.findUnique({
      where: { id },
      include: {
        items: { include: { product: true } },
        warehouse: true,
        shipper: { include: { user: { select: { name: true } } } },
      },
    });
  }

  findPendingByShipper(shipperId: number) {
    return this.prisma.deliveryOrder.findMany({
      where: {
        shipperId,
        status: { in: [DeliveryOrderStatus.ASSIGNED, DeliveryOrderStatus.PICKED_UP] },
      },
      include: { items: { include: { product: true } } },
    });
  }

  updateStatus(id: number, status: DeliveryOrderStatus) {
    return this.prisma.deliveryOrder.update({
      where: { id },
      data: { status },
    });
  }

  assignShipper(id: number, shipperId: number) {
    return this.prisma.deliveryOrder.update({
      where: { id },
      data: { shipperId, status: DeliveryOrderStatus.ASSIGNED },
    });
  }
}
```

- [x] **Step 3: Create Service (with auto stock deduction)**

Create `store/src/delivery-orders/delivery-orders.service.ts`:

```typescript
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { DeliveryOrderStatus } from '@prisma/client';
import { DeliveryOrdersRepository } from './delivery-orders.repository';
import { InventoryService } from '../inventory/inventory.service';
import { MapboxService } from '../mapbox/mapbox.service';
import { CreateDeliveryOrderDto } from './dto/create-delivery-order.dto';

@Injectable()
export class DeliveryOrdersService {
  private readonly logger = new Logger(DeliveryOrdersService.name);

  constructor(
    private readonly repo: DeliveryOrdersRepository,
    private readonly inventory: InventoryService,
    private readonly mapbox: MapboxService,
  ) {}

  async create(dto: CreateDeliveryOrderDto, userId: number) {
    // 1. Geocode address → lat/lng
    let lat: number | undefined;
    let lng: number | undefined;
    try {
      const coords = await this.mapbox.geocode(dto.address);
      if (coords) {
        lat = coords.lat;
        lng = coords.lng;
      }
    } catch (error) {
      this.logger.warn(`Geocode failed for "${dto.address}": ${error}`);
      // Non-blocking — order still created without coordinates
    }

    // 2. Deduct stock for each item
    for (const item of dto.items) {
      await this.inventory.exportStock({
        warehouseId: dto.warehouseId,
        productId: item.productId,
        quantity: item.quantity,
        referenceId: `pending-${Date.now()}`,
        userId,
      });
    }

    // 3. Create order
    const order = await this.repo.create(dto, userId, lat, lng);

    this.logger.log(`Order #${order.id} created with ${dto.items.length} items`);
    return order;
  }

  findAll(filters?: { status?: DeliveryOrderStatus; shipperId?: number; warehouseId?: number }) {
    return this.repo.findAll(filters);
  }

  async findById(id: number) {
    const order = await this.repo.findById(id);
    if (!order) throw new NotFoundException('Đơn hàng không tồn tại');
    return order;
  }

  async updateStatus(id: number, status: DeliveryOrderStatus) {
    const order = await this.findById(id);

    const validTransitions: Record<DeliveryOrderStatus, DeliveryOrderStatus[]> = {
      PENDING: [DeliveryOrderStatus.ASSIGNED, DeliveryOrderStatus.CANCELLED],
      ASSIGNED: [DeliveryOrderStatus.PICKED_UP, DeliveryOrderStatus.CANCELLED],
      PICKED_UP: [DeliveryOrderStatus.IN_TRANSIT],
      IN_TRANSIT: [DeliveryOrderStatus.DELIVERED, DeliveryOrderStatus.FAILED],
      DELIVERED: [],
      FAILED: [DeliveryOrderStatus.PENDING],
      CANCELLED: [],
    };

    if (!validTransitions[order.status].includes(status)) {
      throw new BadRequestException(
        `Không thể chuyển trạng thái từ ${order.status} sang ${status}`,
      );
    }

    return this.repo.updateStatus(id, status);
  }

  async assignShipper(orderId: number, shipperId: number) {
    const order = await this.findById(orderId);
    if (order.status !== DeliveryOrderStatus.PENDING) {
      throw new BadRequestException('Chỉ có thể gán shipper cho đơn PENDING');
    }
    return this.repo.assignShipper(orderId, shipperId);
  }

  findPendingByShipper(shipperId: number) {
    return this.repo.findPendingByShipper(shipperId);
  }
}
```

- [x] **Step 4: Create Controller**

Create `store/src/delivery-orders/delivery-orders.controller.ts`:

```typescript
import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { DeliveryOrderStatus, UserRole } from '@prisma/client';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { DeliveryOrdersService } from './delivery-orders.service';
import { CreateDeliveryOrderDto } from './dto/create-delivery-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';

@Controller('delivery-orders')
@UseGuards(AuthGuard, RolesGuard)
export class DeliveryOrdersController {
  constructor(private readonly service: DeliveryOrdersService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.WAREHOUSE_MANAGER)
  create(@Body() dto: CreateDeliveryOrderDto, @Req() req: any) {
    return this.service.create(dto, req.user.sub);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.WAREHOUSE_MANAGER)
  findAll(
    @Query('status') status?: DeliveryOrderStatus,
    @Query('shipperId') shipperId?: string,
    @Query('warehouseId') warehouseId?: string,
  ) {
    return this.service.findAll({
      status,
      shipperId: shipperId ? +shipperId : undefined,
      warehouseId: warehouseId ? +warehouseId : undefined,
    });
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findById(id);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.service.updateStatus(id, dto.status);
  }

  @Patch(':id/assign/:shipperId')
  @Roles(UserRole.ADMIN, UserRole.WAREHOUSE_MANAGER)
  assignShipper(
    @Param('id', ParseIntPipe) id: number,
    @Param('shipperId', ParseIntPipe) shipperId: number,
  ) {
    return this.service.assignShipper(id, shipperId);
  }
}
```

- [x] **Step 5: Create Module & register**

Create `store/src/delivery-orders/delivery-orders.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { DeliveryOrdersController } from './delivery-orders.controller';
import { DeliveryOrdersService } from './delivery-orders.service';
import { DeliveryOrdersRepository } from './delivery-orders.repository';
import { InventoryModule } from '../inventory/inventory.module';
import { MapboxModule } from '../mapbox/mapbox.module';

@Module({
  imports: [InventoryModule, MapboxModule],
  controllers: [DeliveryOrdersController],
  providers: [DeliveryOrdersService, DeliveryOrdersRepository],
  exports: [DeliveryOrdersService, DeliveryOrdersRepository],
})
export class DeliveryOrdersModule {}
```

Add `DeliveryOrdersModule` to `store/src/app.module.ts` imports.

- [x] **Step 6: Verify build & commit**

```bash
npm run build
git add src/delivery-orders/
git commit -m "feat: add delivery orders module with auto stock deduction and geocoding"
```

---

## Task 11: Delivery Batches Module (Đơn Ghép + Route Optimization)

> **This is the core feature.** A batch groups multiple delivery orders assigned to one shipper into a single trip, then calls Mapbox Optimization API to find the optimal visit order.

**Files:**
- Create: `store/src/delivery-batches/dto/create-batch.dto.ts`
- Create: `store/src/delivery-batches/delivery-batches.repository.ts`
- Create: `store/src/delivery-batches/delivery-batches.service.ts`
- Create: `store/src/delivery-batches/delivery-batches.controller.ts`
- Create: `store/src/delivery-batches/delivery-batches.module.ts`
- Modify: `store/src/app.module.ts`

- [x] **Step 1: Create DTO**

Create `store/src/delivery-batches/dto/create-batch.dto.ts`:

```typescript
import { IsInt, IsArray, ArrayMinSize } from 'class-validator';

export class CreateBatchDto {
  @IsInt()
  shipperId: number;

  @IsArray()
  @ArrayMinSize(2)
  @IsInt({ each: true })
  orderIds: number[];
}
```

- [x] **Step 2: Create Repository**

Create `store/src/delivery-batches/delivery-batches.repository.ts`:

```typescript
import { Injectable } from '@nestjs/common';
import { BatchStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DeliveryBatchesRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(shipperId: number, orderIds: number[]) {
    return this.prisma.deliveryBatch.create({
      data: {
        shipperId,
        orders: {
          create: orderIds.map((orderId, index) => ({
            orderId,
            sequenceOrder: index + 1,
          })),
        },
      },
      include: {
        orders: {
          include: {
            order: {
              include: { items: { include: { product: true } }, warehouse: true },
            },
          },
          orderBy: { sequenceOrder: 'asc' },
        },
        shipper: { include: { user: { select: { name: true } } } },
      },
    });
  }

  findById(id: number) {
    return this.prisma.deliveryBatch.findUnique({
      where: { id },
      include: {
        orders: {
          include: {
            order: {
              include: { items: { include: { product: true } }, warehouse: true },
            },
          },
          orderBy: { sequenceOrder: 'asc' },
        },
        shipper: { include: { user: { select: { name: true } } } },
      },
    });
  }

  findAll(shipperId?: number) {
    return this.prisma.deliveryBatch.findMany({
      where: shipperId ? { shipperId } : {},
      include: {
        orders: {
          include: { order: true },
          orderBy: { sequenceOrder: 'asc' },
        },
        shipper: { include: { user: { select: { name: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateOptimizedRoute(
    batchId: number,
    route: any,
    totalDistanceM: number,
    estimatedDurationS: number,
    waypointOrder: { batchOrderId: number; sequenceOrder: number }[],
  ) {
    return this.prisma.$transaction(async (tx) => {
      await tx.deliveryBatch.update({
        where: { id: batchId },
        data: {
          optimizedRoute: route,
          totalDistanceM: totalDistanceM,
          estimatedDurationS: estimatedDurationS,
          status: BatchStatus.OPTIMIZED,
        },
      });

      for (const wp of waypointOrder) {
        await tx.deliveryBatchOrder.update({
          where: { id: wp.batchOrderId },
          data: { sequenceOrder: wp.sequenceOrder },
        });
      }

      return tx.deliveryBatch.findUnique({
        where: { id: batchId },
        include: {
          orders: {
            include: { order: true },
            orderBy: { sequenceOrder: 'asc' },
          },
        },
      });
    });
  }

  updateStatus(id: number, status: BatchStatus) {
    return this.prisma.deliveryBatch.update({
      where: { id },
      data: {
        status,
        ...(status === BatchStatus.IN_PROGRESS ? { startedAt: new Date() } : {}),
        ...(status === BatchStatus.COMPLETED ? { completedAt: new Date() } : {}),
      },
    });
  }
}
```

- [x] **Step 3: Create Service (core đơn ghép logic)**

Create `store/src/delivery-batches/delivery-batches.service.ts`:

```typescript
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { BatchStatus, DeliveryOrderStatus } from '@prisma/client';
import { DeliveryBatchesRepository } from './delivery-batches.repository';
import { DeliveryOrdersRepository } from '../delivery-orders/delivery-orders.repository';
import { MapboxService } from '../mapbox/mapbox.service';
import { CreateBatchDto } from './dto/create-batch.dto';
import { Coordinates } from '../mapbox/mapbox.types';

@Injectable()
export class DeliveryBatchesService {
  private readonly logger = new Logger(DeliveryBatchesService.name);

  constructor(
    private readonly repo: DeliveryBatchesRepository,
    private readonly ordersRepo: DeliveryOrdersRepository,
    private readonly mapbox: MapboxService,
  ) {}

  /**
   * Create a delivery batch (đơn ghép) and optimize the route.
   *
   * Flow:
   * 1. Validate all orders exist, are PENDING/ASSIGNED, and have lat/lng
   * 2. Create the batch
   * 3. Call Mapbox Optimization API to get optimal visit order
   * 4. Update batch with optimized route
   */
  async create(dto: CreateBatchDto) {
    // 1. Validate orders
    const orders = await Promise.all(
      dto.orderIds.map((id) => this.ordersRepo.findById(id)),
    );

    const validStatuses = [DeliveryOrderStatus.PENDING, DeliveryOrderStatus.ASSIGNED];
    for (const order of orders) {
      if (!order) throw new NotFoundException('Đơn hàng không tồn tại');
      if (!validStatuses.includes(order.status)) {
        throw new BadRequestException(
          `Đơn #${order.id} có trạng thái ${order.status}, không thể ghép`,
        );
      }
      if (!order.lat || !order.lng) {
        throw new BadRequestException(
          `Đơn #${order.id} chưa có tọa độ. Cần geocode trước.`,
        );
      }
    }

    // 2. Create batch
    const batch = await this.repo.create(dto.shipperId, dto.orderIds);

    // 3. Assign shipper to each order
    for (const orderId of dto.orderIds) {
      await this.ordersRepo.assignShipper(orderId, dto.shipperId);
    }

    // 4. Optimize route
    const optimizedBatch = await this.optimizeRoute(batch.id);

    return optimizedBatch;
  }

  /**
   * Call Mapbox Optimization API for an existing batch.
   * First waypoint = warehouse (start point), rest = delivery addresses.
   */
  async optimizeRoute(batchId: number) {
    const batch = await this.repo.findById(batchId);
    if (!batch) throw new NotFoundException('Batch không tồn tại');

    // Build waypoints: [warehouse, order1, order2, ...]
    const warehouse = batch.orders[0]?.order.warehouse;
    if (!warehouse?.lat || !warehouse?.lng) {
      throw new BadRequestException('Kho chưa có tọa độ');
    }

    const waypoints: Coordinates[] = [
      { lat: warehouse.lat, lng: warehouse.lng },
    ];

    const batchOrderMap: { batchOrderId: number; originalIndex: number }[] = [];
    for (const bo of batch.orders) {
      if (bo.order.lat && bo.order.lng) {
        batchOrderMap.push({
          batchOrderId: bo.id,
          originalIndex: waypoints.length,
        });
        waypoints.push({ lat: bo.order.lat, lng: bo.order.lng });
      }
    }

    if (waypoints.length < 2) {
      throw new BadRequestException('Không đủ điểm giao có tọa độ để tối ưu');
    }

    // Call Mapbox
    const result = await this.mapbox.optimizeRoute(waypoints, true);
    if (!result) {
      throw new BadRequestException('Mapbox Optimization API lỗi');
    }

    // Map optimized order back to batch orders
    const waypointOrder = batchOrderMap.map((bom) => {
      const optimizedWp = result.waypoints.find(
        (w) => w.waypointIndex === bom.originalIndex,
      );
      return {
        batchOrderId: bom.batchOrderId,
        sequenceOrder: optimizedWp?.tripsIndex ?? bom.originalIndex,
      };
    });

    const updated = await this.repo.updateOptimizedRoute(
      batchId,
      result,
      result.totalDistanceM,
      result.totalDurationS,
      waypointOrder,
    );

    this.logger.log(
      `Batch #${batchId} optimized: ${result.totalDistanceM}m, ${result.totalDurationS}s`,
    );

    return updated;
  }

  findAll(shipperId?: number) {
    return this.repo.findAll(shipperId);
  }

  async findById(id: number) {
    const batch = await this.repo.findById(id);
    if (!batch) throw new NotFoundException('Batch không tồn tại');
    return batch;
  }

  async startBatch(id: number) {
    const batch = await this.findById(id);
    if (batch.status !== BatchStatus.OPTIMIZED) {
      throw new BadRequestException('Batch chưa được tối ưu tuyến');
    }
    return this.repo.updateStatus(id, BatchStatus.IN_PROGRESS);
  }

  async completeBatch(id: number) {
    return this.repo.updateStatus(id, BatchStatus.COMPLETED);
  }
}
```

- [x] **Step 4: Create Controller**

Create `store/src/delivery-batches/delivery-batches.controller.ts`:

```typescript
import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { DeliveryBatchesService } from './delivery-batches.service';
import { CreateBatchDto } from './dto/create-batch.dto';

@Controller('delivery-batches')
@UseGuards(AuthGuard, RolesGuard)
export class DeliveryBatchesController {
  constructor(private readonly service: DeliveryBatchesService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.WAREHOUSE_MANAGER)
  create(@Body() dto: CreateBatchDto) {
    return this.service.create(dto);
  }

  @Get()
  findAll(@Query('shipperId') shipperId?: string) {
    return this.service.findAll(shipperId ? +shipperId : undefined);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findById(id);
  }

  @Patch(':id/optimize')
  @Roles(UserRole.ADMIN, UserRole.WAREHOUSE_MANAGER)
  reOptimize(@Param('id', ParseIntPipe) id: number) {
    return this.service.optimizeRoute(id);
  }

  @Patch(':id/start')
  startBatch(@Param('id', ParseIntPipe) id: number) {
    return this.service.startBatch(id);
  }

  @Patch(':id/complete')
  completeBatch(@Param('id', ParseIntPipe) id: number) {
    return this.service.completeBatch(id);
  }
}
```

- [x] **Step 5: Create Module & register**

Create `store/src/delivery-batches/delivery-batches.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { DeliveryBatchesController } from './delivery-batches.controller';
import { DeliveryBatchesService } from './delivery-batches.service';
import { DeliveryBatchesRepository } from './delivery-batches.repository';
import { DeliveryOrdersModule } from '../delivery-orders/delivery-orders.module';
import { MapboxModule } from '../mapbox/mapbox.module';

@Module({
  imports: [DeliveryOrdersModule, MapboxModule],
  controllers: [DeliveryBatchesController],
  providers: [DeliveryBatchesService, DeliveryBatchesRepository],
  exports: [DeliveryBatchesService],
})
export class DeliveryBatchesModule {}
```

Add `DeliveryBatchesModule` to `store/src/app.module.ts` imports.

- [x] **Step 6: Verify build & commit**

```bash
npm run build
git add src/delivery-batches/
git commit -m "feat: add delivery batches module — đơn ghép with Mapbox route optimization"
```

---

## Task 12: Admin Dashboard APIs

**Files:**
- Create: `store/src/admin/dashboard/dashboard.service.ts`
- Create: `store/src/admin/dashboard/dashboard.controller.ts`
- Create: `store/src/admin/reports/reports.service.ts`
- Create: `store/src/admin/reports/reports.controller.ts`
- Create: `store/src/admin/admin.module.ts`
- Modify: `store/src/app.module.ts`

- [x] **Step 1: Create Dashboard Service**

Create `store/src/admin/dashboard/dashboard.service.ts`:

```typescript
import { Injectable } from '@nestjs/common';
import { DeliveryOrderStatus, BatchStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getSummary() {
    const [
      totalOrders,
      pendingOrders,
      inTransitOrders,
      deliveredOrders,
      totalBatches,
      activeBatches,
      totalProducts,
      totalShippers,
    ] = await Promise.all([
      this.prisma.deliveryOrder.count(),
      this.prisma.deliveryOrder.count({ where: { status: DeliveryOrderStatus.PENDING } }),
      this.prisma.deliveryOrder.count({ where: { status: DeliveryOrderStatus.IN_TRANSIT } }),
      this.prisma.deliveryOrder.count({ where: { status: DeliveryOrderStatus.DELIVERED } }),
      this.prisma.deliveryBatch.count(),
      this.prisma.deliveryBatch.count({ where: { status: BatchStatus.IN_PROGRESS } }),
      this.prisma.product.count({ where: { isActive: true } }),
      this.prisma.shipper.count({ where: { isAvailable: true } }),
    ]);

    return {
      orders: { total: totalOrders, pending: pendingOrders, inTransit: inTransitOrders, delivered: deliveredOrders },
      batches: { total: totalBatches, active: activeBatches },
      products: { total: totalProducts },
      shippers: { available: totalShippers },
    };
  }

  async getTodaySummary() {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const [ordersToday, deliveredToday, batchesToday] = await Promise.all([
      this.prisma.deliveryOrder.count({
        where: { createdAt: { gte: startOfDay } },
      }),
      this.prisma.deliveryOrder.count({
        where: { status: DeliveryOrderStatus.DELIVERED, updatedAt: { gte: startOfDay } },
      }),
      this.prisma.deliveryBatch.count({
        where: { createdAt: { gte: startOfDay } },
      }),
    ]);

    return { ordersToday, deliveredToday, batchesToday };
  }
}
```

- [x] **Step 2: Create Dashboard Controller**

Create `store/src/admin/dashboard/dashboard.controller.ts`:

```typescript
import { Controller, Get, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { AuthGuard } from '../../auth/auth.guard';
import { RolesGuard } from '../../auth/roles.guard';
import { Roles } from '../../auth/roles.decorator';
import { DashboardService } from './dashboard.service';

@Controller('admin/dashboard')
@UseGuards(AuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.WAREHOUSE_MANAGER)
export class DashboardController {
  constructor(private readonly service: DashboardService) {}

  @Get('summary')
  getSummary() {
    return this.service.getSummary();
  }

  @Get('today')
  getTodaySummary() {
    return this.service.getTodaySummary();
  }
}
```

- [x] **Step 3: Create Reports Service (inventory reconciliation)**

Create `store/src/admin/reports/reports.service.ts`:

```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Báo cáo bù trừ kho: so sánh số lượng nhập vs xuất cho mỗi sản phẩm.
   * Trả về: tổng nhập, tổng xuất, tổng điều chỉnh, tồn hiện tại, chênh lệch.
   */
  async getInventoryReconciliation(warehouseId: number) {
    const stocks = await this.prisma.warehouseStock.findMany({
      where: { warehouseId },
      include: { product: true },
    });

    const results = await Promise.all(
      stocks.map(async (stock) => {
        const transactions = await this.prisma.inventoryTransaction.groupBy({
          by: ['type'],
          where: { warehouseId, productId: stock.productId },
          _sum: { quantity: true },
        });

        const totalImport = transactions.find((t) => t.type === 'IMPORT')?._sum.quantity ?? 0;
        const totalExport = Math.abs(
          transactions.find((t) => t.type === 'EXPORT')?._sum.quantity ?? 0,
        );
        const totalAdjustment = transactions.find((t) => t.type === 'ADJUSTMENT')?._sum.quantity ?? 0;
        const totalReturn = transactions.find((t) => t.type === 'RETURN')?._sum.quantity ?? 0;

        const expectedBalance = totalImport - totalExport + totalAdjustment + totalReturn;
        const discrepancy = stock.quantity - expectedBalance;

        return {
          productId: stock.productId,
          productName: stock.product.name,
          sku: stock.product.sku,
          currentStock: stock.quantity,
          totalImport,
          totalExport,
          totalAdjustment,
          totalReturn,
          expectedBalance,
          discrepancy,
        };
      }),
    );

    return results;
  }

  /** Báo cáo hiệu suất shipper */
  async getShipperPerformance(startDate?: Date, endDate?: Date) {
    const where = {
      ...(startDate || endDate
        ? { createdAt: { ...(startDate ? { gte: startDate } : {}), ...(endDate ? { lte: endDate } : {}) } }
        : {}),
    };

    const shippers = await this.prisma.shipper.findMany({
      include: {
        user: { select: { name: true } },
        deliveryBatches: {
          where,
          select: {
            id: true,
            status: true,
            totalDistanceM: true,
            estimatedDurationS: true,
            orders: { select: { id: true } },
          },
        },
      },
    });

    return shippers.map((s) => ({
      shipperId: s.id,
      name: s.user.name,
      totalBatches: s.deliveryBatches.length,
      totalOrders: s.deliveryBatches.reduce((sum, b) => sum + b.orders.length, 0),
      completedBatches: s.deliveryBatches.filter((b) => b.status === 'COMPLETED').length,
      totalDistanceKm: +(
        s.deliveryBatches.reduce((sum, b) => sum + (b.totalDistanceM ?? 0), 0) / 1000
      ).toFixed(1),
    }));
  }
}
```

- [x] **Step 4: Create Reports Controller**

Create `store/src/admin/reports/reports.controller.ts`:

```typescript
import { Controller, Get, Param, ParseIntPipe, Query, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { AuthGuard } from '../../auth/auth.guard';
import { RolesGuard } from '../../auth/roles.guard';
import { Roles } from '../../auth/roles.decorator';
import { ReportsService } from './reports.service';

@Controller('admin/reports')
@UseGuards(AuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.WAREHOUSE_MANAGER)
export class ReportsController {
  constructor(private readonly service: ReportsService) {}

  @Get('inventory/:warehouseId')
  getInventoryReconciliation(@Param('warehouseId', ParseIntPipe) id: number) {
    return this.service.getInventoryReconciliation(id);
  }

  @Get('shippers')
  getShipperPerformance(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.service.getShipperPerformance(
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }
}
```

- [x] **Step 5: Create Admin Module & register**

Create `store/src/admin/admin.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard/dashboard.controller';
import { DashboardService } from './dashboard/dashboard.service';
import { ReportsController } from './reports/reports.controller';
import { ReportsService } from './reports/reports.service';

@Module({
  controllers: [DashboardController, ReportsController],
  providers: [DashboardService, ReportsService],
})
export class AdminModule {}
```

Add `AdminModule` to `store/src/app.module.ts` imports.

- [x] **Step 6: Final AppModule**

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { ProductsModule } from './products/products.module';
import { WarehousesModule } from './warehouses/warehouses.module';
import { InventoryModule } from './inventory/inventory.module';
import { ShippersModule } from './shippers/shippers.module';
import { MapboxModule } from './mapbox/mapbox.module';
import { DeliveryOrdersModule } from './delivery-orders/delivery-orders.module';
import { DeliveryBatchesModule } from './delivery-batches/delivery-batches.module';
import { AdminModule } from './admin/admin.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    ProductsModule,
    WarehousesModule,
    InventoryModule,
    ShippersModule,
    MapboxModule,
    DeliveryOrdersModule,
    DeliveryBatchesModule,
    AdminModule,
  ],
})
export class AppModule {}
```

- [x] **Step 7: Full build + verify**

```bash
npm run build
```

Expected: Build succeeds with no errors.

- [x] **Step 8: Commit**

```bash
git add src/admin/ src/app.module.ts
git commit -m "feat: add admin dashboard and reports module with inventory reconciliation"
```

---

## Task 13: Seed Data for Development

**Files:**
- Create: `store/prisma/seed.ts`
- Modify: `store/package.json` (add prisma seed config)

- [x] **Step 1: Create seed file**

Create `store/prisma/seed.ts`:

```typescript
import { PrismaClient, UserRole, TransactionType } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // 1. Create admin user
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@store.vn' },
    update: {},
    create: {
      email: 'admin@store.vn',
      password: adminPassword,
      name: 'Admin',
      phone: '0901234567',
      role: UserRole.ADMIN,
    },
  });

  // 2. Create warehouse manager
  const managerPassword = await bcrypt.hash('manager123', 10);
  await prisma.user.upsert({
    where: { email: 'manager@store.vn' },
    update: {},
    create: {
      email: 'manager@store.vn',
      password: managerPassword,
      name: 'Quản lý kho',
      phone: '0909876543',
      role: UserRole.WAREHOUSE_MANAGER,
    },
  });

  // 3. Create shipper users
  const shipperPassword = await bcrypt.hash('shipper123', 10);
  const shipperUser1 = await prisma.user.upsert({
    where: { email: 'shipper1@store.vn' },
    update: {},
    create: {
      email: 'shipper1@store.vn',
      password: shipperPassword,
      name: 'Nguyễn Văn Shipper',
      phone: '0911111111',
      role: UserRole.SHIPPER,
    },
  });

  const shipperUser2 = await prisma.user.upsert({
    where: { email: 'shipper2@store.vn' },
    update: {},
    create: {
      email: 'shipper2@store.vn',
      password: shipperPassword,
      name: 'Trần Thị Giao',
      phone: '0922222222',
      role: UserRole.SHIPPER,
    },
  });

  // 4. Create shippers
  await prisma.shipper.upsert({
    where: { userId: shipperUser1.id },
    update: {},
    create: { userId: shipperUser1.id, phone: '0911111111', vehicleType: 'xe máy' },
  });

  await prisma.shipper.upsert({
    where: { userId: shipperUser2.id },
    update: {},
    create: { userId: shipperUser2.id, phone: '0922222222', vehicleType: 'xe tải nhỏ' },
  });

  // 5. Create warehouse
  const warehouse = await prisma.warehouse.upsert({
    where: { id: 1 },
    update: {},
    create: {
      name: 'Kho Quận 1',
      address: '123 Nguyễn Huệ, Quận 1, TP.HCM',
      lat: 10.7731,
      lng: 106.7030,
    },
  });

  // 6. Create products
  const products = [
    { name: 'Nước suối 500ml', sku: 'NS-500', unit: 'thùng', price: 85000 },
    { name: 'Mì gói Hảo Hảo', sku: 'MG-HH', unit: 'thùng', price: 120000 },
    { name: 'Dầu ăn 1L', sku: 'DA-1L', unit: 'chai', price: 45000 },
    { name: 'Gạo ST25 5kg', sku: 'G-ST25', unit: 'bao', price: 150000 },
    { name: 'Sữa tươi TH 1L', sku: 'STH-1L', unit: 'hộp', price: 32000 },
  ];

  for (const p of products) {
    await prisma.product.upsert({
      where: { sku: p.sku },
      update: {},
      create: p,
    });
  }

  // 7. Seed initial stock via transactions (proper way)
  const allProducts = await prisma.product.findMany();
  for (const product of allProducts) {
    const qty = 100;
    await prisma.warehouseStock.upsert({
      where: {
        warehouseId_productId: { warehouseId: warehouse.id, productId: product.id },
      },
      update: { quantity: qty },
      create: { warehouseId: warehouse.id, productId: product.id, quantity: qty },
    });

    await prisma.inventoryTransaction.create({
      data: {
        warehouseId: warehouse.id,
        productId: product.id,
        type: TransactionType.IMPORT,
        quantity: qty,
        balanceBefore: 0,
        balanceAfter: qty,
        reason: 'Nhập kho ban đầu (seed)',
        createdById: admin.id,
      },
    });
  }

  console.log('✅ Seed completed');
  console.log('   Admin: admin@store.vn / admin123');
  console.log('   Manager: manager@store.vn / manager123');
  console.log('   Shipper 1: shipper1@store.vn / shipper123');
  console.log('   Shipper 2: shipper2@store.vn / shipper123');
  console.log(`   Warehouse: ${warehouse.name}`);
  console.log(`   Products: ${allProducts.length} items, 100 each`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
```

- [x] **Step 2: Add seed config to `package.json`**

Add to `store/package.json` at root level:

```json
{
  "prisma": {
    "seed": "ts-node prisma/seed.ts"
  }
}
```

- [x] **Step 3: Run seed**

```bash
cd /home/baudui/Downloads/project/store
npx prisma db seed
```

Expected: Seed completed message with user credentials.

- [x] **Step 4: Commit**

```bash
git add prisma/seed.ts package.json
git commit -m "feat: add seed data for dev environment"
```

---

## Task 14: Final Integration Test

- [x] **Step 1: Start dev server**

```bash
cd /home/baudui/Downloads/project/store
npm run start:dev
```

Expected: Server starts on port 3000.

- [x] **Step 2: Test auth**

```bash
curl -s -X POST http://localhost:3000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@store.vn","password":"admin123"}' | jq .
```

Expected: Returns `{ "accessToken": "...", "refreshToken": "..." }`

- [x] **Step 3: Test inventory (use token from step 2)**

```bash
TOKEN="<paste accessToken here>"

# View warehouse stock
curl -s http://localhost:3000/api/inventory/warehouse/1 \
  -H "Authorization: Bearer $TOKEN" | jq .

# Import stock
curl -s -X POST http://localhost:3000/api/inventory/import \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"warehouseId":1,"productId":1,"quantity":50,"reason":"Nhập thêm từ tổng kho"}' | jq .

# View transaction log
curl -s 'http://localhost:3000/api/inventory/transactions?warehouseId=1' \
  -H "Authorization: Bearer $TOKEN" | jq .
```

- [x] **Step 4: Test delivery order creation**

```bash
curl -s -X POST http://localhost:3000/api/delivery-orders \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{
    "recipientName": "Nguyễn Văn A",
    "recipientPhone": "0901111111",
    "address": "227 Nguyễn Văn Cừ, Quận 5, TP.HCM",
    "warehouseId": 1,
    "items": [{"productId": 1, "quantity": 5}]
  }' | jq .
```

Expected: Order created with geocoded lat/lng (if Mapbox token is valid).

- [x] **Step 5: Test batch creation (đơn ghép)**

Create 2-3 more orders with different addresses, then:

```bash
curl -s -X POST http://localhost:3000/api/delivery-batches \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"shipperId": 1, "orderIds": [1, 2, 3]}' | jq .
```

Expected: Batch created with `optimizedRoute` containing optimal delivery sequence, total distance, and duration.

- [x] **Step 6: Test admin reports**

```bash
# Dashboard summary
curl -s http://localhost:3000/api/admin/dashboard/summary \
  -H "Authorization: Bearer $TOKEN" | jq .

# Inventory reconciliation
curl -s http://localhost:3000/api/admin/reports/inventory/1 \
  -H "Authorization: Bearer $TOKEN" | jq .
```

- [x] **Step 7: Final commit**

```bash
git add -A
git commit -m "chore: integration test verification complete"
```

---

## API Summary

| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | Public | Đăng ký |
| POST | `/api/auth/login` | Public | Đăng nhập |
| GET/POST/PATCH/DELETE | `/api/products` | Admin/Manager | CRUD sản phẩm |
| GET/POST/PATCH/DELETE | `/api/warehouses` | Admin/Manager | CRUD kho |
| POST | `/api/inventory/import` | Admin/Manager | Nhập kho |
| POST | `/api/inventory/adjust` | Admin/Manager | Điều chỉnh tồn kho |
| GET | `/api/inventory/warehouse/:id` | Admin/Manager | Xem tồn kho |
| GET | `/api/inventory/transactions` | Admin/Manager | Lịch sử giao dịch |
| GET/POST | `/api/shippers` | Admin/Manager | CRUD shipper |
| POST | `/api/delivery-orders` | Admin/Manager | Tạo đơn giao (auto trừ kho) |
| PATCH | `/api/delivery-orders/:id/status` | All | Cập nhật trạng thái |
| POST | `/api/delivery-batches` | Admin/Manager | Tạo đơn ghép + tối ưu tuyến |
| PATCH | `/api/delivery-batches/:id/optimize` | Admin/Manager | Tối ưu lại tuyến |
| PATCH | `/api/delivery-batches/:id/start` | All | Bắt đầu giao |
| GET | `/api/admin/dashboard/summary` | Admin/Manager | Tổng quan |
| GET | `/api/admin/reports/inventory/:id` | Admin/Manager | Bù trừ kho |
| GET | `/api/admin/reports/shippers` | Admin/Manager | Hiệu suất shipper |

---

## Phase 2 Roadmap (Future — not in this plan)

Các tính năng nâng cao, triển khai sau khi MVP chạy ổn:

1. **OCR Nhập kho** — Chụp ảnh phiếu nhập → Vision API extract → human confirm → import. Cần: `POST /api/inventory/ocr-import` + frontend upload UI.
2. **Route Learning** — Lưu GPS trace thực tế của shipper, so sánh với tuyến Mapbox, tự động phát hiện "đường tắt". Cần: `learned_routes` table + cron job phân tích.
3. **Multi-vehicle VRP** — Dùng Google OR-Tools (Python microservice) thay Mapbox khi cần: ràng buộc trọng lượng xe, time windows, nhiều shipper cùng lúc.
4. **Real-time tracking** — WebSocket cho shipper app, hiển thị vị trí real-time trên admin map.
5. **Forecasting** — Dự báo nhu cầu nhập kho dùng Prophet/ARIMA dựa trên lịch sử đơn hàng.
