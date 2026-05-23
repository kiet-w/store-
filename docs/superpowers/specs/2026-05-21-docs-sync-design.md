# Documentation Sync & UI/UX Enhancement Design

**Goal:** Synchronize `admin`, `auth`, and `cart` MD files with their HTML counterparts, ensuring 100% content parity while expanding the layout to 100% width and enhancing UI components.

## 1. Layout & Theme
- **Global Width:** Set `.content { max-width: 100% !important; padding: 40px 60px; }`.
- **Sidebar:** Maintain existing VSCode Dark sidebar but ensure it remains fixed.
- **Typography:** Retain the clean sans-serif system font but increase base line-height for readability on wide screens.

## 2. Component Refinement

### 2.1. Summary Table (Interactive Map)
- Replace standard tables with an "Architectural Index".
- Each row contains:
    - **Component Name** (Link to section)
    - **Visual Flow:** A mini CSS-based diagram (e.g., `[Guard] -> [Ctrl] -> [Svc]`) using `.lc-node` styles.
    - **Responsibility:** Concise description.

### 2.2. Decorator Cards (`.dec-card`)
- Strict parity: Every decorator mentioned in MD must have a card.
- Layout: `Name (Monospace/Accent)` | `Purpose & Logic`.

### 2.3. Endpoint Cards (`.crud-card`)
- Layout: 3-column grid inside `.crud-body`.
    - **Input:** DTOs, Params, Queries.
    - **Logic:** Business rules, validations, database interactions.
    - **Output:** Response DTOs, side effects (cache invalidation).

### 2.4. Lifecycle Containers (`.lifecycle-container`)
- Interactive nodes that update a "Detail Panel".
- Used for major flows like "Login Sequence" or "Update Product Flow".

## 3. Content Parity Rules
- Every heading in MD -> Heading in HTML.
- Every bullet point/list -> HTML lists.
- Every Mermaid diagram -> Translated to `.lifecycle-container` or high-quality CSS diagrams.

## 4. Success Criteria
- 100% text match between MD and HTML.
- Layout fills the screen width.
- All 3 HTML files are fully responsive.
