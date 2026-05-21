# Refactor Response DTOs for Cart and Orders Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move response types from service files to dedicated DTO files for the Cart and Orders modules.

**Architecture:** Extraction of internal types into exported classes/interfaces in the `dto/` folder to improve modularity and type safety across controllers and services.

**Tech Stack:** NestJS, TypeScript.

---

### Task 1: Refactor Cart Response DTO

**Files:**
- Create: `src/cart/dto/cart-response.dto.ts`
- Modify: `src/cart/cart.service.ts`
- Modify: `src/cart/cart.controller.ts`

- [ ] **Step 1: Create CartResponse DTO**

Create `src/cart/dto/cart-response.dto.ts`:
```typescript
export class CartItemResponseDto {
  id: number;
  productId: number;
  name: string;
  slug: string;
  price: string;
  quantity: number;
  subtotal: string;
}

export class CartResponseDto {
  id: number;
  items: CartItemResponseDto[];
  totalItems: number;
  subtotal: string;
}
```

- [ ] **Step 2: Update CartService**

Remove `CartResponse` type and import `CartResponseDto` from `./dto/cart-response.dto`. Update return types.

- [ ] **Step 3: Update CartController**

Update types in `CartController` if they were explicitly using `CartResponse` (though often inferred, it's good to be explicit or at least check imports).

- [ ] **Step 4: Verify with build**

Run: `npm run build`
Expected: PASS

- [ ] **Step 5: Commit**

Run: `rtk git add . && rtk git commit -m "refactor(cart): move CartResponse to dedicated DTO"`

---

### Task 2: Refactor Order Response DTO

**Files:**
- Create: `src/orders/dto/order-response.dto.ts`
- Modify: `src/orders/orders.service.ts`
- Modify: `src/orders/orders.controller.ts`

- [ ] **Step 1: Create OrderResponse DTO**

Create `src/orders/dto/order-response.dto.ts`:
```typescript
import { OrderStatus } from '@prisma/client';

export class OrderItemResponseDto {
  id: number;
  productId: number;
  productName: string;
  productPrice: string;
  quantity: number;
  subtotal: string;
}

export class OrderResponseDto {
  id: number;
  status: OrderStatus;
  total: string;
  address: string;
  createdAt: Date;
  updatedAt: Date;
  items: OrderItemResponseDto[];
}
```

- [ ] **Step 2: Update OrdersService**

Remove `OrderResponse` type and import `OrderResponseDto` from `./dto/order-response.dto`. Update return types.

- [ ] **Step 3: Update OrdersController**

Update types in `OrdersController` to use `OrderResponseDto`.

- [ ] **Step 4: Verify with build**

Run: `npm run build`
Expected: PASS

- [ ] **Step 5: Commit**

Run: `rtk git add . && rtk git commit -m "refactor(orders): move OrderResponse to dedicated DTO"`
