# Update HTML Diagrams Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Inject Mermaid.js and system data flow diagrams into the Admin, Auth, and Cart HTML dashboards based on their source Markdown files.

**Architecture:** Manual injection of the Mermaid.js library and diagram sections into existing HTML files using precise string replacement to maintain layout integrity.

**Tech Stack:** HTML5, Mermaid.js (via CDN).

---

### Task 1: Update Admin Dashboard

**Files:**
- Modify: `docs/html/admin.html`
- Source: `docs/explanations/admin.md`

- [ ] **Step 1: Inject Mermaid Diagram Section**
Insert before `<h2 id="4-libs">4. Vai trò của Third-Party & Thư viện</h2>`.

```html
      <h2 id="system-data-flow">Sơ đồ Luồng Dữ Liệu (Hệ Thống)</h2>
      <pre class="mermaid">
flowchart TD
    %% Định nghĩa Client và Request
    Client[Admin Client (Trình duyệt/App)] -- "1. HTTP Request\n(VD: PATCH /admin/products/1)" --> Controller[AdminController]
    
    subgraph NestJS Backend
        %% Luồng đi xuống
        Controller -- "2. Truyền DTO vào Method" --> Service[AdminService]
        Service -- "3. Thực thi Query thay đổi dữ liệu" --> Prisma[(Prisma Database)]
        
        %% Luồng trả về
        Prisma -- "4. Trả về dữ liệu thô (Raw Entity)" --> Service
        
        %% Xử lý tại Service
        Service -- "5. Mapping dữ liệu thành Response DTO\n(Chuyển Decimal sang String, format lại...)" --> Service
        
        %% Tương tác với Redis (Side Effect)
        Service -- "6. Gọi hàm Invalidate Cache\n(Xóa cache của sản phẩm)" --> Redis[(Redis Cache)]
        
        %% Trả về Controller
        Service -- "7. Trả dữ liệu đã xử lý qua lệnh return" --> Controller
        
        %% Đóng gói tại Controller
        Controller -- "8. Gói dữ liệu qua Utils\n(success, paginated)" --> Formatter[Response Formatter\n(api-response.util.ts)]
        Formatter -- "9. Trả về JSON định dạng chuẩn" --> Controller
    end

    %% Tác động chéo đến Module khác
    subgraph Cross-Module Impacts
        Redis -. "10. Cache trống (Key bị xóa)" .-> CatalogService[CatalogService (Module End-user)]
        CatalogService -. "11. Bắt buộc lấy data thật từ DB\nthay vì dùng Cache cũ" .-> EndUser[Khách hàng (End-user)]
    end

    %% Gửi Response về Client
    Controller -- "12. NestJS Core tạo HTTP Response\n({ statusCode: 200, data: ... })" --> Client
    
    %% Style adjustments
    classDef database fill:#f9f,stroke:#333,stroke-width:2px;
    classDef cache fill:#ffb,stroke:#333,stroke-width:2px;
    classDef client fill:#bbf,stroke:#333,stroke-width:2px;
    
    class Prisma database;
    class Redis cache;
    class Client,EndUser client;
      </pre>
```

- [ ] **Step 2: Inject Mermaid.js Script**
Insert before `</body>`.

```html
  <script type="module">
    import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.esm.min.mjs';
    mermaid.initialize({ startOnLoad: true, theme: 'dark' });
  </script>
```

- [ ] **Step 3: Verify changes**
Check that the diagram and script are present in `docs/html/admin.html`.

### Task 2: Update Auth Dashboard

**Files:**
- Modify: `docs/html/auth.html`
- Source: `docs/explanations/auth.md`

- [ ] **Step 1: Inject Mermaid Diagram Section**
Insert before `<h2 id="4-lib">4. Vai Trò Cốt Lõi Của Các Thư Viện</h2>`.

```html
      <h2 id="system-data-flow">Sơ đồ Luồng Dữ Liệu (Hệ Thống)</h2>
      <pre class="mermaid">
sequenceDiagram
    participant Client
    participant AuthController
    participant Interceptor as ClassSerializerInterceptor
    participant AuthService
    participant UserService
    participant Database

    Client->>AuthController: POST /auth/login {email, password}
    
    activate AuthController
    AuthController->>AuthService: login(data, response)
    
    activate AuthService
    AuthService->>UserService: findByEmail(email)
    activate UserService
    UserService->>Database: Trích xuất User (kèm password/refreshToken)
    Database-->>UserService: Trả về User Entity
    UserService-->>AuthService: Trả về User Entity
    deactivate UserService

    AuthService->>AuthService: So sánh bcrypt(password, hash)
    AuthService->>AuthService: generateTokens() -> [accessToken, refreshToken]
    AuthService->>UserService: updateRefreshToken(userId, hashedRefresh)
    
    Note over AuthService,UserService: Tương tác chéo (Cross-module)<br/>AuthModule gọi UserModule
    
    AuthService->>AuthService: setCookies(response, tokens)
    Note right of AuthService: Thiết lập HttpOnly Cookie trực tiếp<br/>vào đối tượng Express Response
    AuthService-->>AuthController: return AuthResponseDto (chứa User Entity)
    deactivate AuthService
    
    AuthController-->>Interceptor: Trả về AuthResponseDto (pass qua Interceptor)
    deactivate AuthController
    
    activate Interceptor
    Note over Interceptor: Kích hoạt class-transformer
    Interceptor->>Interceptor: Quét @Exclude() trên UserResponseDto
    Interceptor->>Interceptor: XÓA trường password
    Interceptor->>Interceptor: XÓA trường refreshToken
    Interceptor-->>Client: Trả về JSON cuối cùng (Đã làm sạch) + Headers (Set-Cookie)
    deactivate Interceptor
    
    Note left of Client: Trình duyệt nhận JSON Body và<br/>tự động lưu HttpOnly Cookies
      </pre>
```

- [ ] **Step 2: Inject Mermaid.js Script**
Insert before `</body>`.

```html
  <script type="module">
    import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.esm.min.mjs';
    mermaid.initialize({ startOnLoad: true, theme: 'dark' });
  </script>
```

- [ ] **Step 3: Verify changes**
Check that the diagram and script are present in `docs/html/auth.html`.

### Task 3: Update Cart Dashboard

**Files:**
- Modify: `docs/html/cart.html`
- Source: `docs/explanations/cart.md`

- [ ] **Step 1: Inject Mermaid Diagram Section**
Insert before `<h2 id="4-lib">4. Tích Hợp Thư Viện Bên Thứ Ba</h2>`.

```html
      <h2 id="system-data-flow">Sơ đồ Luồng Dữ Liệu (Hệ Thống)</h2>
      <pre class="mermaid">
sequenceDiagram
    participant C as Client
    participant Ctrl as CartController
    participant Serv as CartService
    participant Redis as Redis Cache
    participant DB as Postgres (Prisma)

    C->>Ctrl: PATCH /cart/items/:id { quantity: 2 }
    Ctrl->>Serv: updateItem(userId, itemId, dto)
    
    rect rgb(30, 30, 50)
        Note right of Serv: 1. Validate & Logic (Cross-Module Impact)
        Serv->>DB: findOwnedCartItem(userId, itemId)
        DB-->>Serv: CartItem (Có Prisma.Decimal)
        Serv->>DB: validateProductAvailability(productId, quantity)
        Note over DB: Kiểm tra Product stock > quantity<br/>(Liên kết gián tiếp Catalog Module)
        DB-->>Serv: Product Info
    end

    rect rgb(30, 50, 30)
        Note right of Serv: 2. Cập nhật & Invalidate Cache
        Serv->>DB: Prisma.cartItem.update(...)
        DB-->>Serv: Updated Item
        Serv->>Redis: del(`cart:${userId}`) 
        Note over Redis: Cache Invalidation!<br/>Xóa cache giỏ hàng hiện tại
    end

    rect rgb(50, 30, 30)
        Note right of Serv: 3. Lấy Dữ Liệu Mới & Serialize
        Serv->>DB: getCartWithItems(userId)
        DB-->>Serv: Raw Data (Prisma.Decimal)
        Note over Serv: serializeCart(cart)<br/>Tính toán giá trị với Decimal
        Note over Serv: Decimal.toString() -> String<br/>Trả ra CartResponseDto
    end

    Serv->>Redis: set(`cart:${userId}`, CartResponseDto)
    Note over Redis: Lưu trữ Cache mới nhất

    Serv-->>Ctrl: CartResponseDto (Giá = String)
    Note over Ctrl: bọc bằng hàm `success(data)`
    Ctrl-->>C: HTTP 200 JSON Response { statusCode, message, data }
      </pre>
```

- [ ] **Step 2: Inject Mermaid.js Script**
Insert before `</body>`.

```html
  <script type="module">
    import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.esm.min.mjs';
    mermaid.initialize({ startOnLoad: true, theme: 'dark' });
  </script>
```

- [ ] **Step 3: Verify changes**
Check that the diagram and script are present in `docs/html/cart.html`.
