# Design Spec: Catalog Documentation Redesign (catalog.html)

- **Date:** 2026-05-21
- **Topic:** Redesigning `docs/html/catalog.html` with detailed method-level analysis and visual diagrams.
- **Goal:** Provide a comprehensive, high-fidelity technical documentation for the Catalog module based on source code and existing explanations.

## 1. Architecture & Components

The documentation will be a single-file HTML dashboard with the following structural components:

### 1.1 Sidebar (TOC)
- Automatically generated Table of Contents based on `h2` and `h3` tags.
- Sticky positioning for easy navigation.
- VSCode-style highlighting for active sections.

### 1.2 Header Section
- Title: "Giải Thích Chi Tiết Chuyên Sâu - Module Catalog (src/catalog)"
- Summary of the module's purpose and performance focus (Read-heavy, Caching).

### 1.3 System Overview Section
- Integrated SVG flowchart showing the end-to-end data flow (Client -> Controller -> Service -> DB/Cache).
- Interactive "Request Lifecycle" visualization.

### 1.4 Detailed Method Breakdown Sections
For each method in `CatalogController` and `CatalogService`, a dedicated section containing:
1. **Mermaid Diagram:** Visualizing the internal logic flow of the method.
2. **Technical Card:** A structured field-based breakdown of the method's interface and behavior.

## 2. Technical Field Templates

### 2.1 Controller Method Template
| Field | Content |
|-------|---------|
| **Method+Path** | HTTP Method + URL Path |
| **Function name** | The name of the controller method |
| **Decorators** | NestJS decorators applied (e.g., `@Get`, `@Query`, `@Param`) |
| **Input (IN)** | Parameters received (DTOs, params) |
| **Output (OUT)** | Return type/structure (wrapped in `success` or `paginated`) |
| **Calls** | Service methods invoked |

### 2.2 Public Service Method Template
| Field | Content |
|-------|---------|
| **Name** | The name of the service method |
| **Input (IN)** | Function arguments and types |
| **Output (OUT)** | Return type and structure |
| **Internal Calls** | Private helpers or external services called |
| **Side Effects** | Cache setting, database writes (if any) |
| **Description** | Detailed explanation of what the method does |

### 2.3 Private Service Method Template
| Field | Content |
|-------|---------|
| **Name** | The name of the private helper |
| **Input (IN)** | Function arguments |
| **Output (OUT)** | Return type |
| **Called By** | Which public methods use this helper |
| **Description** | Role of the helper in the service logic |

## 3. Visual Strategy (Mermaid Diagrams)

- **`getCategories`**: Client -> Controller -> Service -> `redis.getOrSet` -> DB (Category) -> Result.
- **`getProducts`**: Client -> Controller -> Service -> CacheKey Gen -> `redis.getOrSet` -> `Promise.all` (findMany + count) -> Serialization -> Result.
- **`getProductBySlug`**: Client -> Controller -> Service -> `redis.getOrSet` -> DB (Product) -> 404 Check -> Serialization -> Result.
- **`buildProductWhere`**: Input DTO -> Status Filter -> Search Logic -> Price Range Logic -> Prisma Filter Output.
- **`serializeProduct`**: Raw Prisma Object -> Field Selection -> Price toString() -> Clean DTO.

## 4. UI/UX & Styling

- **Theme:** VSCode Dark Theme (Monokai-ish color palette).
- **Typography:** Cascadia Code/Consolas for code, system fonts for text.
- **Interactive Elements:**
    - Tooltips in SVG diagrams.
    - Clickable lifecycle nodes.
    - Copy-to-clipboard for code snippets (optional, target for future).

## 5. Verification Plan

- **Structural Check:** Ensure all 3 controller methods and all 6 service methods (3 public, 4 private) are documented.
- **Technical Accuracy:** Cross-reference DTO fields and Prisma calls with `src/catalog/*.ts`.
- **Visual Check:** Render the HTML in a browser to verify CSS/SVG/Mermaid integrity.
