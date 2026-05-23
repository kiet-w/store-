# SVG Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign interactive SVG diagrams in `cart.html` and `catalog.html` to improve visual clarity and technical accuracy.

**Architecture:** Row-based top-down layout with centered nodes and interactive tooltips. Each component is a themed rectangle with standardized CSS classes.

**Tech Stack:** SVG, CSS, Vanilla JavaScript.

---

### Task 1: Redesign Cart Module SVG

**Files:**
- Modify: `docs/html/cart.html`

- [ ] **Step 1: Replace SVG in `cart.html`**
  - Use `viewBox="0 0 680 820"`.
  - Implement 8 tiers of nodes.
  - Add "NESTJS BACKEND" region.
  - Include `showTooltip` script and tooltip UI elements.

- [ ] **Step 2: Verify interactivity**
  - Check that clicking "AuthGuard" displays info about JWT and `req.user`.
  - Check that clicking "Serialization" explains the Decimal to String conversion.

### Task 2: Redesign Catalog Module SVG

**Files:**
- Modify: `docs/html/catalog.html`

- [ ] **Step 1: Replace SVG in `catalog.html`**
  - Use `viewBox="0 0 680 900"`.
  - Implement 9 tiers of nodes.
  - Add "NESTJS BACKEND" region.
  - Include Admin Module side node (c-pink).
  - Include `showTooltip` script and tooltip UI elements.

- [ ] **Step 3: Verify interactivity**
  - Check that clicking "ValidationPipe" explains `class-transformer` usage.
  - Check that clicking "Admin Module" explains cache invalidation.

### Task 3: Final Visual Polish

- [ ] **Step 1: Ensure centering and responsiveness**
  - Verify both SVGs use `display: block; margin: 2em auto; max-width: 100%;`.
  - Ensure background colors and strokes match the theme.
