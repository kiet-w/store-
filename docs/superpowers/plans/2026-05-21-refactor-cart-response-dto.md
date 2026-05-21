# Refactor Cart Response DTO Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move `CartResponse` type from `src/cart/cart.service.ts` to a dedicated DTO file `src/cart/dto/cart-response.dto.ts` and update the codebase to use it.

**Architecture:** Use NestJS DTO pattern by creating classes for response objects.

**Tech Stack:** NestJS, TypeScript

---

### Task 1: Create Cart Response DTO

**Files:**
- Create: `src/cart/dto/cart-response.dto.ts`

- [ ] **Step 1: Create the DTO file**

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

- [ ] **Step 2: Commit**

```bash
rtk git add src/cart/dto/cart-response.dto.ts
rtk git commit -m "feat(cart): create CartResponseDto"
```

### Task 2: Refactor Cart Service

**Files:**
- Modify: `src/cart/cart.service.ts`

- [ ] **Step 1: Replace local type with imported DTO**

Update `src/cart/cart.service.ts`:
- Remove `type CartResponse = { ... }`
- Add `import { CartResponseDto } from './dto/cart-response.dto';`
- Replace all `CartResponse` with `CartResponseDto`.

- [ ] **Step 2: Commit**

```bash
rtk git add src/cart/cart.service.ts
rtk git commit -m "refactor(cart): use CartResponseDto in CartService"
```

### Task 3: Verification

- [ ] **Step 1: Run build**

Run: `npm run build`
Expected: SUCCESS

- [ ] **Step 2: Commit**

```bash
rtk git add .
rtk git commit -m "refactor(cart): move CartResponse to dedicated DTO"
```
