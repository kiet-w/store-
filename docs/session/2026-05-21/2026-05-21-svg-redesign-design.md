# Spec: Redesign Interactive SVG Diagrams for Cart & Catalog

**Date:** 2026-05-21
**Topic:** SVG Redesign for NestJS Learning Dashboard
**Goal:** Replace existing SVG diagrams in `cart.html` and `catalog.html` with modern, top-down interactive versions that strictly follow the project's Technical Guide.

## 1. Technical Requirements

### 1.1 Layout & Styling
- **Canvas:** `viewBox="0 0 680 [HEIGHT]"`
- **Centering:** `style="display: block; margin: 2em auto; max-width: 100%; height: auto;"`
- **Color Palette (Classes):**
    - `.c-blue`: Client/HTTP (stroke:#569cd6; fill:#1a3a52)
    - `.c-red`: Guard/Pipe (stroke:#f44747; fill:#3a1a1a)
    - `.c-amber`: Controller/Cache (stroke:#dcdcaa; fill:#2d2516)
    - `.c-purple`: Service (stroke:#c586c0; fill:#2d1e35)
    - `.c-teal`: Database/Prisma (stroke:#4ec9b0; fill:#1a3a28)
    - `.c-pink`: Cross-Module Impacts (stroke:#c586c0; fill:#351e2d)
    - `.c-gray`: Utils (stroke:#858585; fill:#2d2d30)
- **Node Structure:**
    - `rect rx="8"`
    - Text 1 (`class="th"`): 14px bold, white (Step # + Component)
    - Text 2 (`class="ts"`): 12px, gray (Short action, max 5 words)
- **Connectors:**
    - Solid arrows: Request flow
    - Dashed arrows: Return flow
- **Regions:** "NESTJS BACKEND" dashed border wrapping internal components.

### 1.2 Interactivity
- `onclick` handler on nodes: `showTooltip(event, title, why, in, out)`
- Tooltip UI:
    - `<rect id="tooltip-box-bg">` at the bottom.
    - `<foreignObject id="tooltip-box">` containing styled HTML for technical details.

## 2. Content Specification

### 2.1 Cart Module Diagram
- **Step 1:** Client (Blue) - PATCH /cart/items/:id
- **Step 2:** AuthGuard (Red) - Verify JWT & Attach User
- **Step 3:** Controller (Amber) - Receive params & DTO
- **Step 4:** CartService (Purple) - Logic Orchestration
- **Step 5:** Prisma DB (Teal) - Update Record
- **Step 6:** Redis Invalidation (Amber) - Delete old cache
- **Step 7:** Serialization (Gray) - Decimal to String
- **Step 8:** Response (Blue, Dashed) - HTTP 200 OK

### 2.2 Catalog Module Diagram
- **Step 1:** Client (Blue) - GET /products?query
- **Step 2:** ValidationPipe (Red) - Transform Query to DTO
- **Step 3:** Controller (Amber) - Delegate to Service
- **Step 4:** CatalogService (Purple) - Cache Key & Parallel Query
- **Step 5:** Redis Cache (Amber) - Hit/Miss check
- **Step 6:** Prisma DB (Teal) - DB query (if Miss)
- **Step 7:** Serialize (Gray) - Decimal to String
- **Step 8:** Paginated Utility (Gray) - Wrap {data, meta}
- **Step 9:** Response (Blue, Dashed) - HTTP 200 OK
- **Special:** Admin Module (Pink) node showing cache invalidation trigger.

## 3. Verification Plan
- [ ] SVG renders centered in the HTML.
- [ ] Clicking every node updates the tooltip with correct info.
- [ ] "NESTJS BACKEND" region covers all non-client nodes.
- [ ] Dashed arrows used correctly for return paths.
