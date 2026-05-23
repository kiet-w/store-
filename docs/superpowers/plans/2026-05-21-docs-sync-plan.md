# Documentation Sync Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Synchronize `admin.md`, `auth.md`, and `cart.md` into their HTML versions with 100% parity, 100% width, and enhanced components.

**Architecture:** Systematic transformation of Markdown content into themed HTML components (`dec-card`, `crud-card`, `lifecycle-container`) while expanding layout width.

**Tech Stack:** HTML5, CSS (Dark Theme), Vanilla JS.

---

### Task 1: Update Admin Module Documentation
**Files:**
- Modify: `docs/html/admin.html`
- Reference: `docs/explanations/admin.md`

- [ ] **Step 1: Expand CSS Layout**
    - Change `.content { max-width: 1000px; }` to `.content { max-width: 100% !important; padding: 40px 60px; }`.
- [ ] **Step 2: Sync Content Parity**
    - Ensure all sections from `admin.md` exist.
    - Add missing details about `softDeleteProduct`, `findOrders`, and `updateOrderStatus`.
- [ ] **Step 3: Enhance Components**
    - Update Summary Table with mini-flows.
    - Wrap new endpoints in `.crud-card`.
    - Verify all decorators use `.dec-card`.
- [ ] **Step 4: Update Lifecycle Diagram**
    - Ensure the sequence diagram from MD is reflected in the `.lifecycle-container`.

### Task 2: Update Auth Module Documentation
**Files:**
- Modify: `docs/html/auth.html`
- Reference: `docs/explanations/auth.md`

- [ ] **Step 1: Expand CSS Layout**
    - Apply `max-width: 100% !important;`.
- [ ] **Step 2: Sync Content Parity**
    - Add missing sections: `handleRefresh`, `handleLogout`, `validateAccessToken`.
    - Add "Vai Trò Của Các Thư Viện Bên Thứ Ba" section.
- [ ] **Step 3: Enhance Components**
    - Update Summary Table.
    - Wrap helper methods (`setCookies`, `generateTokens`) in `.dec-card` or similar styled blocks.
- [ ] **Step 4: Implement Sequence Diagram**
    - Convert Mermaid diagram to `.lifecycle-container`.

### Task 3: Update Cart Module Documentation
**Files:**
- Modify: `docs/html/cart.html`
- Reference: `docs/explanations/cart.md`

- [ ] **Step 1: Expand CSS Layout**
    - Apply `max-width: 100% !important;`.
- [ ] **Step 2: Sync Content Parity**
    - Ensure all public and private methods from MD are described.
    - Add "Lược Đồ Chuyển Đổi (Prisma.Decimal -> String)" and "Đích Đến Cuối Cùng Của Dữ Liệu" sections.
- [ ] **Step 3: Enhance Components**
    - Update Summary Table.
    - Use `.crud-card` for item operations (add, update, remove).
- [ ] **Step 4: Implement Lifecycle Flow**
    - Convert "Luồng Truyền Tải Dữ Liệu và Tác Động Chéo" to `.lifecycle-container`.

### Task 4: Final Validation
- [ ] **Step 1: Verify Parity**
    - Compare each MD with its HTML to ensure no text is missing.
- [ ] **Step 2: Test Responsiveness**
    - Check layout on different viewport widths.
- [ ] **Step 3: Verify Links**
    - Ensure all TOC links and summary table links work correctly.
