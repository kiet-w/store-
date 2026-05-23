# Inject Mermaid Diagrams into HTML Documentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Inject Mermaid diagrams from source Markdown files into their corresponding HTML counterparts and initialize Mermaid.js.

**Architecture:** 
1. Read Mermaid blocks from `docs/explanations/*.md`.
2. Inject Mermaid.js initializer script at the end of `<body>` in `docs/html/*.html`.
3. Insert diagram sections (`h2` + `pre.mermaid`) before the last `h2` or specific sections ("Phụ Thuộc Khéo Léo" / "Các Kỹ Thuật Nổi Bật").

**Tech Stack:** HTML, Mermaid.js (CDN), JavaScript.

---

### Task 1: Update docs/html/user.html

**Files:**
- Modify: `docs/html/user.html`

- [ ] **Step 1: Inject Mermaid.js initializer script**

```html
<script type="module">
  import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.esm.min.mjs';
  mermaid.initialize({ startOnLoad: true, theme: 'dark' });
</script>
```

- [ ] **Step 2: Add Sơ đồ Luồng Dữ Liệu (Hệ Thống) section**

Find the `h2` with `id="4-phu-thuoc-kheo-leo-dependencies-va-tuong-tac-voi-module-auth"` and insert the following BEFORE it:

```html
    <h2 id="system-data-flow">Sơ đồ Luồng Dữ Liệu (Hệ Thống)</h2>
    <pre class="mermaid">
flowchart TD
    %% Định nghĩa các Actor & Layer
    Client([HTTP Client])
    Controller[UserController]
    Service[UserService]
    AuthService[AuthService]
    Prisma[(Prisma DB)]
    Redis[(Redis Cache: all_users)]
    NestCore((NestJS Core\nJSON.stringify))

    %% Luồng đọc dữ liệu cơ bản (Get/Find)
    Client -- "1. HTTP GET /users" --> Controller
    Controller -- "2. Gọi getAllUsers() hoặc findById()" --> Service
    Service -- "3. Prisma Query (raw)" --> Prisma
    Prisma -- "4. Trả Raw Prisma Object (VD: chứa password)" --> Service
    Service -- "5. Return Raw Object" --> Controller
    Controller -- "6. Return Raw Object" --> NestCore
    NestCore -- "7. Tự động chuyển JSON" --> Client

    %% Tương tác Auth Module
    AuthService -- "A. Gọi findByEmail(email) (xác thực)" --> Service
    Service -. "B. Cung cấp Raw User (gồm password hash)" .-> AuthService

    %% Tương tác thay đổi trạng thái (Mutations)
    Client -- "I. HTTP POST/PATCH/DELETE /users" --> Controller
    Controller -- "II. create() / update() / delete()" --> Service
    Service -- "III. Ghi thay đổi" --> Prisma
    Service -- "IV. Invalidate Cache" --> Redis
    
    classDef rawData fill:#f9d0c4,stroke:#333,stroke-width:2px;
    class Prisma,Service,Controller rawData;
    </pre>
```

- [ ] **Step 3: Validate changes**
Read `docs/html/user.html` to ensure correct injection.

### Task 2: Update docs/html/src_explanation.html

**Files:**
- Modify: `docs/html/src_explanation.html`

- [ ] **Step 1: Inject Mermaid.js initializer script**

```html
<script type="module">
  import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.esm.min.mjs';
  mermaid.initialize({ startOnLoad: true, theme: 'dark' });
</script>
```

- [ ] **Step 2: Add Sơ đồ Hệ Thống Tổng Quan section**

Find the `h2` with `id="7-cac-ky-thuat-noi-bat-code-highlights"` and insert the following BEFORE it:

```html
    <h2 id="system-flowchart">Sơ đồ Hệ Thống Tổng Quan</h2>
    <pre class="mermaid">
flowchart TD
    %% Các thành phần của Request Lifecycle
    Client([Client / Trình duyệt])
    Guard{Guards\n(Auth/Roles)}
    Controller[Controllers]
    
    %% Nhóm các Services để thể hiện Cross-Module
    subgraph ServiceLayer [Service Layer & Tác động qua lại (Cross-Module Impacts)]
        direction TB
        AuthSvc[Auth Service]
        UserSvc[User Service]
        AdminSvc[Admin Service]
        CatalogSvc[Catalog Service]
        CartSvc[Cart Service]
        OrderSvc[Orders Service]
        
        AuthSvc -- "Tìm/Tạo User" --> UserSvc
        AdminSvc -- "Cập nhật dữ liệu & Xóa Cache" --> CatalogSvc
        OrderSvc -- "Đọc & Xóa Giỏ hàng" --> CartSvc
        CartSvc -. "Thuộc về" .-> UserSvc
    end
    
    PrismaDB[(Prisma/Database)]
    RedisCache[(Redis Cache)]
    Interceptor[Interceptors / Filters]
    
    %% Vòng đời Request (Request Lifecycle)
    Client -->|1. HTTP Request| Guard
    Guard -->|2. Pass| Controller
    Controller -->|3. Gọi hàm xử lý| ServiceLayer
    
    ServiceLayer -->|4. Đọc/Ghi/Transaction| PrismaDB
    ServiceLayer <-->|5. Get/Set/Invalidate| RedisCache
    
    PrismaDB -.-> ServiceLayer
    
    ServiceLayer -->|6. Trả kết quả| Interceptor
    Interceptor -->|7. Format/HTTP Response| Client
    
    %% Luồng lỗi
    Guard -.->|Lỗi 401/403| Interceptor
    </pre>
```

- [ ] **Step 3: Validate changes**
Read `docs/html/src_explanation.html` to ensure correct injection.
