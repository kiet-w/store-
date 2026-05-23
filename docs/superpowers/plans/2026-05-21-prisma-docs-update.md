# Prisma Documentation Update Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Update `docs/html/prisma.html` to include detailed service method breakdowns and Mermaid diagrams.

**Architecture:** Enhancing static HTML documentation with Mermaid.js for visuals and structured technical tables/sections for method details.

**Tech Stack:** HTML, CSS (VSCode Dark Theme), Mermaid.js, JavaScript.

---

### Task 1: Update HTML Structure and Headings

**Files:**
- Modify: `docs/html/prisma.html`

- [ ] **Step 1: Add Mermaid.js script to the head**
Include the Mermaid script in the `<head>` section.

```html
<script src="https://cdn.jsdelivr.net/npm/mermaid/dist/mermaid.min.js"></script>
<script>mermaid.initialize({ startOnLoad: true, theme: 'dark' });</script>
```

- [ ] **Step 2: Update the Main Heading and Introduction**
Ensure the heading matches the source code and explanation.

- [ ] **Step 3: Commit structural changes**
```bash
rtk proxy git add docs/html/prisma.html
rtk proxy git commit -m "docs: add mermaid.js and update prisma html structure"
```

### Task 2: Implement Mermaid Diagrams

**Files:**
- Modify: `docs/html/prisma.html`

- [ ] **Step 1: Add Constructor Logic Diagram**
Insert the Mermaid diagram for the constructor before the method description.

```html
<div class="mermaid">
graph TD
    A[Start constructor] --> B{Get DATABASE_URL}
    B -- Not Found --> C[Throw Error]
    B -- Found --> D[Create pg Pool]
    D --> E[Create PrismaPg Adapter]
    E --> F[Call super adapter]
    F --> G[End]
</div>
```

- [ ] **Step 2: Add Connection Lifecycle Diagram**
Insert the Mermaid diagram for `onModuleInit`.

```html
<div class="mermaid">
graph LR
    A[NestJS Init] --> B[onModuleInit]
    B --> C[this.$connect]
    C --> D{Success?}
    D -- Yes --> E[Server Ready]
    D -- No --> F[Server Crash/Halt]
</div>
```

- [ ] **Step 3: Commit diagrams**
```bash
rtk proxy git add docs/html/prisma.html
rtk proxy git commit -m "docs: add mermaid diagrams to prisma docs"
```

### Task 3: Detailed Method Breakdown (Template)

**Files:**
- Modify: `docs/html/prisma.html`

- [ ] **Step 1: Document `constructor`**
Add the detailed table/list for the constructor.

| Detail | Description |
| :--- | :--- |
| **Service (Public)** | `constructor` |
| **Input (IN)** | `ConfigService` (environment variables) |
| **Output (OUT)** | `PrismaService` instance |
| **Internal Calls** | `configService.get()`, `new Pool()`, `new PrismaPg()`, `super()` |
| **Side Effects** | Throws exception if `DATABASE_URL` is missing |

- [ ] **Step 2: Document `onModuleInit`**
Add the detailed table/list for `onModuleInit`.

| Detail | Description |
| :--- | :--- |
| **Service (Public)** | `onModuleInit()` |
| **Input (IN)** | None |
| **Output (OUT)** | `Promise<void>` |
| **Internal Calls** | `this.$connect()` |
| **Side Effects** | Establishes physical DB connection |

- [ ] **Step 3: Commit method details**
```bash
rtk proxy git add docs/html/prisma.html
rtk proxy git commit -m "docs: add detailed method breakdown for prisma service"
```

### Task 4: Final Polish and Verification

**Files:**
- Modify: `docs/html/prisma.html`

- [ ] **Step 1: Verify all Vietnamese text matches `prisma.md`**
- [ ] **Step 2: Ensure all code snippets use correct VSCode syntax classes**
- [ ] **Step 3: Test Mermaid rendering (visual check if possible)**
- [ ] **Step 4: Commit final polish**
```bash
rtk proxy git add docs/html/prisma.html
rtk proxy git commit -m "docs: final polish for prisma html documentation"
```
