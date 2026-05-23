# Catalog Documentation Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign `docs/html/catalog.html` to include detailed method-level analysis, technical field cards, and Mermaid diagrams.

**Architecture:** Single-file HTML with VSCode Dark Theme. Uses Mermaid.js for diagrams and interactive JS for sidebar/lifecycle navigation.

**Tech Stack:** HTML5, CSS3 (Vanilla), JavaScript (Vanilla), Mermaid.js (via CDN).

---

### Task 1: Scaffolding and CSS/JS Setup

**Files:**
- Modify: `docs/html/catalog.html`

- [ ] **Step 1: Update HTML Head with Mermaid.js and VSCode Styles**

```html
<script src="https://cdn.jsdelivr.net/npm/mermaid/dist/mermaid.min.js"></script>
<script>
  mermaid.initialize({
    theme: 'dark',
    startOnLoad: true,
    securityLevel: 'loose',
    flowchart: { useMaxWidth: true, htmlLabels: true, curve: 'basis' }
  });
</script>
<style>
  /* Add technical card styles and ensure VSCode theme consistency */
  .tech-card {
    background: var(--bg-surface);
    border: 1px solid var(--border);
    border-radius: 8px;
    margin: 20px 0;
    overflow: hidden;
  }
  .tech-card-header {
    background: var(--bg-surface2);
    padding: 10px 16px;
    border-bottom: 1px solid var(--border);
    font-weight: 600;
    color: var(--yellow);
    display: flex;
    justify-content: space-between;
  }
  .tech-card-body {
    padding: 16px;
  }
  .tech-field {
    margin-bottom: 12px;
    display: flex;
    gap: 12px;
  }
  .tech-label {
    min-width: 140px;
    color: var(--text-muted);
    font-size: 11px;
    text-transform: uppercase;
    font-weight: 700;
  }
  .tech-value {
    flex: 1;
    font-family: 'Cascadia Code', monospace;
    font-size: 13px;
  }
  .mermaid-container {
    background: #1e1e1e;
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 20px;
    margin: 20px 0;
  }
</style>
```

---

### Task 2: Controller Methods Documentation

**Files:**
- Modify: `docs/html/catalog.html`

- [ ] **Step 1: Document `getCategories()`**
- [ ] **Step 2: Document `getProducts()`**
- [ ] **Step 3: Document `getProductBySlug()`**

Include Mermaid diagram and Tech Card for each.

---

### Task 3: Public Service Methods Documentation

**Files:**
- Modify: `docs/html/catalog.html`

- [ ] **Step 1: Document `findCategories()`**
- [ ] **Step 2: Document `findProducts()`**
- [ ] **Step 3: Document `findProductBySlug()`**

Include Mermaid diagram and Tech Card for each.

---

### Task 4: Private Service Helpers Documentation

**Files:**
- Modify: `docs/html/catalog.html`

- [ ] **Step 1: Document `buildProductWhere()`**
- [ ] **Step 2: Document `getProductOrderBy()`**
- [ ] **Step 3: Document `getProductsCacheKey()`**
- [ ] **Step 4: Document `serializeProduct()`**

Include Tech Card and short Mermaid for each.

---

### Task 5: Final Polish and Verification

**Files:**
- Modify: `docs/html/catalog.html`

- [ ] **Step 1: Ensure full file write (no placeholders)**
- [ ] **Step 2: Verify all methods from source are present**
- [ ] **Step 3: Test JS for TOC and Lifecycle**
