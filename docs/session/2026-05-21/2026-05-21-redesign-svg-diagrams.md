# SVG Diagrams Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign interactive SVG diagrams in three HTML files to match their source Markdown documentation and follow a unified style guide.

**Architecture:** Top-down tiered SVG structure with interactive tooltips and consistent color coding based on technical layers (Guard, Controller, Service, DB).

**Tech Stack:** SVG, HTML, JavaScript.

---

### Task 1: Redesign SVG for `docs/html/orders.html`

**Files:**
- Modify: `docs/html/orders.html`

- [ ] **Step 1: Replace SVG code in `docs/html/orders.html`**

```html
<h2 id="system-data-flow">Sơ đồ Luồng Dữ Liệu (Hệ Thống)</h2>
<svg viewBox="0 0 680 820" xmlns="http://www.w3.org/2000/svg" style="display: block; margin: 2em auto; max-width: 100%; height: auto;">
  <style>
    .th { font: bold 14px sans-serif; fill: #fff; }
    .ts { font: 12px sans-serif; fill: #858585; }
    .c-blue { stroke: #569cd6; fill: #1a3a52; stroke-width: 2; cursor: pointer; }
    .c-red { stroke: #f44747; fill: #3a1a1a; stroke-width: 2; cursor: pointer; }
    .c-amber { stroke: #dcdcaa; fill: #2d2516; stroke-width: 2; cursor: pointer; }
    .c-purple { stroke: #c586c0; fill: #2d1e35; stroke-width: 2; cursor: pointer; }
    .c-teal { stroke: #4ec9b0; fill: #1a3a28; stroke-width: 2; cursor: pointer; }
    .c-pink { stroke: #c586c0; fill: #351e2d; stroke-width: 2; cursor: pointer; }
    .c-gray { stroke: #858585; fill: #2d2d30; stroke-width: 2; cursor: pointer; }
    .arr { stroke: #858585; stroke-width: 2; fill: none; marker-end: url(#arr); }
    .arr-d { stroke: #858585; stroke-width: 2; fill: none; stroke-dasharray: 4 4; marker-end: url(#arr); }
    .region { fill: none; stroke: #404040; stroke-dasharray: 8 4; stroke-width: 1; }
    .region-p { fill: none; stroke: #c586c0; stroke-dasharray: 8 4; stroke-width: 1; }
    rect:hover { filter: brightness(1.2); }
  </style>
  <defs>
    <marker id="arr" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
      <polygon points="0 0, 10 3.5, 0 7" fill="#858585" />
    </marker>
  </defs>

  <!-- Regions -->
  <rect x="10" y="100" width="660" height="420" rx="12" class="region" />
  <text x="20" y="120" class="ts" style="font-weight: bold;">NESTJS BACKEND</text>

  <rect x="230" y="440" width="430" height="70" rx="12" class="region-p" />
  <text x="240" y="460" class="ts" style="font-weight: bold; fill: #c586c0;">CROSS-MODULE IMPACT (CartModule)</text>

  <!-- Tier 1: Client -->
  <g onclick="showTooltip(event, 'Client', 'Người dùng gửi yêu cầu thanh toán', 'POST /orders/checkout', 'Success/Error')">
    <rect x="240" y="20" width="200" height="60" rx="8" class="c-blue" />
    <text x="340" y="45" text-anchor="middle" class="th">Client</text>
    <text x="340" y="65" text-anchor="middle" class="ts">Frontend / API Consumer</text>
  </g>

  <!-- Tier 2: Guards -->
  <g onclick="showTooltip(event, 'AuthGuard', 'Xác thực JWT và gán User vào Request', 'JWT Token', 'JwtPayloadDto')">
    <rect x="240" y="130" width="200" height="60" rx="8" class="c-red" />
    <text x="340" y="155" text-anchor="middle" class="th">AuthGuard</text>
    <text x="340" y="175" text-anchor="middle" class="ts">Security Layer</text>
  </g>

  <!-- Tier 3: Controller -->
  <g onclick="showTooltip(event, 'OrdersController', 'Tiếp nhận request và gọi Service', 'CheckoutDto', 'OrderResponseDto')">
    <rect x="240" y="230" width="200" height="60" rx="8" class="c-amber" />
    <text x="340" y="255" text-anchor="middle" class="th">OrdersController</text>
    <text x="340" y="275" text-anchor="middle" class="ts">API Endpoint</text>
  </g>

  <!-- Tier 4: Service -->
  <g onclick="showTooltip(event, 'OrdersService', 'Logic thanh toán và điều phối transaction', 'userId, CheckoutDto', 'Serialized Order')">
    <rect x="240" y="330" width="200" height="60" rx="8" class="c-purple" />
    <text x="340" y="355" text-anchor="middle" class="th">OrdersService</text>
    <text x="340" y="375" text-anchor="middle" class="ts">Business Logic</text>
  </g>

  <!-- Tier 5: Transaction & DB -->
  <g onclick="showTooltip(event, 'Prisma $transaction', 'Đảm bảo tính ACID cho toàn bộ quy trình', 'Multi-step Logic', 'Atomic Result')">
    <rect x="40" y="430" width="180" height="80" rx="8" class="c-teal" />
    <text x="130" y="465" text-anchor="middle" class="th">$transaction</text>
    <text x="130" y="485" text-anchor="middle" class="ts">ACID Operations</text>
  </g>

  <g onclick="showTooltip(event, 'Deduct Stock', 'Trừ số lượng sản phẩm trong kho (gte check)', 'productId, quantity', 'Stock Updated')">
    <rect x="240" y="445" width="130" height="50" rx="8" class="c-teal" />
    <text x="305" y="470" text-anchor="middle" class="th" style="font-size: 12px;">Deduct Stock</text>
    <text x="305" y="485" text-anchor="middle" class="ts" style="font-size: 10px;">updateMany</text>
  </g>

  <g onclick="showTooltip(event, 'Create Order', 'Tạo Order và OrderItems (Snapshot)', 'Order Data', 'Order Record')">
    <rect x="380" y="445" width="130" height="50" rx="8" class="c-teal" />
    <text x="445" y="470" text-anchor="middle" class="th" style="font-size: 12px;">Create Order</text>
    <text x="445" y="485" text-anchor="middle" class="ts" style="font-size: 10px;">Prisma Create</text>
  </g>

  <g onclick="showTooltip(event, 'Complete Cart', 'Cập nhật trạng thái giỏ hàng sang COMPLETED', 'cartId', 'Status Updated')">
    <rect x="520" y="445" width="130" height="50" rx="8" class="c-pink" />
    <text x="585" y="470" text-anchor="middle" class="th" style="font-size: 12px;">Complete Cart</text>
    <text x="585" y="485" text-anchor="middle" class="ts" style="font-size: 10px;">Side Effect</text>
  </g>

  <!-- Tier 6: Formatting -->
  <g onclick="showTooltip(event, 'Serializer', 'Ép kiểu Decimal sang string', 'Raw Prisma Model', 'OrderResponseDto')">
    <rect x="240" y="550" width="200" height="60" rx="8" class="c-gray" />
    <text x="340" y="575" text-anchor="middle" class="th">Serializer</text>
    <text x="340" y="595" text-anchor="middle" class="ts">serializeOrder()</text>
  </g>

  <g onclick="showTooltip(event, 'Success Wrapper', 'Bọc kết quả vào chuẩn API Response', 'OrderResponseDto', 'JSON { success: true, data }')">
    <rect x="240" y="640" width="200" height="60" rx="8" class="c-gray" />
    <text x="340" y="665" text-anchor="middle" class="th">Success Wrapper</text>
    <text x="340" y="685" text-anchor="middle" class="ts">success() util</text>
  </g>

  <!-- Arrows -->
  <path d="M 340 80 L 340 120" class="arr" />
  <text x="345" y="105" class="ts">HTTP POST</text>
  
  <path d="M 340 190 L 340 220" class="arr" />
  <text x="345" y="210" class="ts">Authorized</text>

  <path d="M 340 290 L 340 320" class="arr" />
  <text x="345" y="310" class="ts">checkout()</text>

  <path d="M 240 360 Q 130 360 130 420" class="arr" />
  <text x="140" y="380" class="ts">Start Transaction</text>

  <path d="M 130 510 Q 130 580 230 580" class="arr-d" />
  <text x="140" y="560" class="ts">Commit & Return</text>

  <path d="M 340 610 L 340 630" class="arr" />
  <path d="M 340 700 Q 340 780 440 780 L 600 780 Q 660 780 660 400 L 660 100 Q 660 50 450 50" class="arr-d" />
  <text x="500" y="770" class="ts">JSON Response</text>

  <!-- Tooltip UI -->
  <rect x="20" y="730" width="640" height="80" rx="8" fill="#252526" stroke="#404040" />
  <foreignObject x="40" y="735" width="600" height="70">
    <div id="tooltip-content" xmlns="http://www.w3.org/1999/xhtml" style="color:#d4d4d4; font-family:sans-serif; font-size:12px;">
      <div id="tt-title" style="color:#fff; font-weight:bold; margin-bottom:4px;">Click a node to see data flow details</div>
      <div id="tt-why" style="margin-bottom:4px; font-style: italic; color: #ce9178;">Sơ đồ luồng thanh toán (Checkout Process)</div>
      <div style="display:flex; gap:20px;">
        <span id="tt-in" style="color:#4ec9b0;">IN: -</span>
        <span id="tt-out" style="color:#569cd6;">OUT: -</span>
      </div>
    </div>
  </foreignObject>

  <script>
    function showTooltip(evt, title, why, input, output) {
      document.getElementById('tt-title').textContent = title;
      document.getElementById('tt-why').textContent = why;
      document.getElementById('tt-in').textContent = 'IN: ' + input;
      document.getElementById('tt-out').textContent = 'OUT: ' + output;
    }
  </script>
</svg>
```

- [ ] **Step 2: Verify `showTooltip` function exists and works**

Check `docs/html/orders.html` for script section and ensure it doesn't conflict.

- [ ] **Step 3: Commit changes**

```bash
rtk proxy git add docs/html/orders.html
rtk proxy git commit -m "docs: redesign Orders flow SVG diagram"
```

---

### Task 2: Redesign SVG for `docs/html/user.html`

**Files:**
- Modify: `docs/html/user.html`

- [ ] **Step 1: Replace SVG code in `docs/html/user.html`**

```html
<h2 id="system-data-flow">Sơ đồ Luồng Dữ Liệu (Hệ Thống)</h2>
<svg viewBox="0 0 680 720" xmlns="http://www.w3.org/2000/svg" style="display: block; margin: 2em auto; max-width: 100%; height: auto;">
  <style>
    .th { font: bold 14px sans-serif; fill: #fff; }
    .ts { font: 12px sans-serif; fill: #858585; }
    .c-blue { stroke: #569cd6; fill: #1a3a52; stroke-width: 2; cursor: pointer; }
    .c-red { stroke: #f44747; fill: #3a1a1a; stroke-width: 2; cursor: pointer; }
    .c-amber { stroke: #dcdcaa; fill: #2d2516; stroke-width: 2; cursor: pointer; }
    .c-purple { stroke: #c586c0; fill: #2d1e35; stroke-width: 2; cursor: pointer; }
    .c-teal { stroke: #4ec9b0; fill: #1a3a28; stroke-width: 2; cursor: pointer; }
    .c-gray { stroke: #858585; fill: #2d2d30; stroke-width: 2; cursor: pointer; }
    .arr { stroke: #858585; stroke-width: 2; fill: none; marker-end: url(#arr); }
    .arr-d { stroke: #858585; stroke-width: 2; fill: none; stroke-dasharray: 4 4; marker-end: url(#arr); }
    .region { fill: none; stroke: #404040; stroke-dasharray: 8 4; stroke-width: 1; }
    rect:hover { filter: brightness(1.2); }
  </style>
  <defs>
    <marker id="arr" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
      <polygon points="0 0, 10 3.5, 0 7" fill="#858585" />
    </marker>
  </defs>

  <!-- Region -->
  <rect x="10" y="100" width="660" height="420" rx="12" class="region" />
  <text x="20" y="120" class="ts" style="font-weight: bold;">NESTJS BACKEND</text>

  <!-- Tier 1: Client -->
  <g onclick="showTooltip(event, 'Client', 'Yêu cầu truy cập tài nguyên', 'GET /users/5', 'JSON Data')">
    <rect x="240" y="20" width="200" height="60" rx="8" class="c-blue" />
    <text x="340" y="45" text-anchor="middle" class="th">Client</text>
    <text x="340" y="65" text-anchor="middle" class="ts">Frontend / API Consumer</text>
  </g>

  <!-- Tier 2: Pipe -->
  <g onclick="showTooltip(event, 'ParseIntPipe', 'Ép kiểu string sang number và validate', 'string \"5\"', 'number 5')">
    <rect x="240" y="130" width="200" height="60" rx="8" class="c-red" />
    <text x="340" y="155" text-anchor="middle" class="th">ParseIntPipe</text>
    <text x="340" y="175" text-anchor="middle" class="ts">Validation & Transformation</text>
  </g>

  <!-- Tier 3: Controller -->
  <g onclick="showTooltip(event, 'UserController', 'Tiếp nhận ID và gọi Service', 'number id', 'Raw User Object')">
    <rect x="240" y="230" width="200" height="60" rx="8" class="c-amber" />
    <text x="340" y="255" text-anchor="middle" class="th">UserController</text>
    <text x="340" y="275" text-anchor="middle" class="ts">Routing Layer</text>
  </g>

  <!-- Tier 4: Service -->
  <g onclick="showTooltip(event, 'UserService', 'Logic nghiệp vụ (Cache -> DB)', 'id', 'User Model')">
    <rect x="240" y="330" width="200" height="60" rx="8" class="c-purple" />
    <text x="340" y="355" text-anchor="middle" class="th">UserService</text>
    <text x="340" y="375" text-anchor="middle" class="ts">Business Logic</text>
  </g>

  <!-- Tier 5: Cache & DB -->
  <g onclick="showTooltip(event, 'Redis Cache', 'Kiểm tra dữ liệu đã lưu tạm', 'Cache Key', 'Value / Miss')">
    <rect x="130" y="430" width="180" height="60" rx="8" class="c-amber" />
    <text x="220" y="455" text-anchor="middle" class="th">Redis (getOrSet)</text>
    <text x="220" y="475" text-anchor="middle" class="ts">Optimization Layer</text>
  </g>

  <g onclick="showTooltip(event, 'Prisma DB', 'Truy vấn trực tiếp từ Database', 'findUnique', 'Raw Prisma Model')">
    <rect x="370" y="430" width="180" height="60" rx="8" class="c-teal" />
    <text x="460" y="455" text-anchor="middle" class="th">Prisma / SQL</text>
    <text x="460" y="475" text-anchor="middle" class="ts">Persistence Layer</text>
  </g>

  <!-- Tier 6: Formatting -->
  <g onclick="showTooltip(event, 'NestCore JSON', 'Tự động gọi JSON.stringify()', 'Raw Object', 'JSON String')">
    <rect x="240" y="540" width="200" height="60" rx="8" class="c-gray" />
    <text x="340" y="565" text-anchor="middle" class="th">NestCore / Serializer</text>
    <text x="340" y="585" text-anchor="middle" class="ts">Implicit Serialization</text>
  </g>

  <!-- Arrows -->
  <path d="M 340 80 L 340 120" class="arr" />
  <path d="M 340 190 L 340 220" class="arr" />
  <path d="M 340 290 L 340 320" class="arr" />
  
  <path d="M 280 390 L 220 420" class="arr" />
  <path d="M 400 390 L 460 420" class="arr" />
  
  <path d="M 220 490 L 280 530" class="arr-d" />
  <path d="M 460 490 L 400 530" class="arr-d" />

  <path d="M 340 600 Q 340 680 440 680 L 600 680 Q 660 680 660 340 L 660 100 Q 660 50 450 50" class="arr-d" />
  <text x="500" y="670" class="ts">JSON Response</text>

  <!-- Tooltip UI -->
  <rect x="20" y="630" width="640" height="80" rx="8" fill="#252526" stroke="#404040" />
  <foreignObject x="40" y="635" width="600" height="70">
    <div id="tooltip-content" xmlns="http://www.w3.org/1999/xhtml" style="color:#d4d4d4; font-family:sans-serif; font-size:12px;">
      <div id="tt-title" style="color:#fff; font-weight:bold; margin-bottom:4px;">Click a node to see data flow details</div>
      <div id="tt-why" style="margin-bottom:4px; font-style: italic; color: #ce9178;">Luồng truy xuất dữ liệu người dùng (User Retrieval)</div>
      <div style="display:flex; gap:20px;">
        <span id="tt-in" style="color:#4ec9b0;">IN: -</span>
        <span id="tt-out" style="color:#569cd6;">OUT: -</span>
      </div>
    </div>
  </foreignObject>

  <script>
    function showTooltip(evt, title, why, input, output) {
      document.getElementById('tt-title').textContent = title;
      document.getElementById('tt-why').textContent = why;
      document.getElementById('tt-in').textContent = 'IN: ' + input;
      document.getElementById('tt-out').textContent = 'OUT: ' + output;
    }
  </script>
</svg>
```

- [ ] **Step 2: Verify `showTooltip` function**

- [ ] **Step 3: Commit changes**

```bash
rtk proxy git add docs/html/user.html
rtk proxy git commit -m "docs: redesign User flow SVG diagram"
```

---

### Task 3: Redesign SVG for `docs/html/src_explanation.html`

**Files:**
- Modify: `docs/html/src_explanation.html`

- [ ] **Step 1: Replace SVG code in `docs/html/src_explanation.html`**

```html
<h2 id="system-flowchart">Sơ đồ Hệ Thống Tổng Quan</h2>
<svg viewBox="0 0 680 720" xmlns="http://www.w3.org/2000/svg" style="display: block; margin: 2em auto; max-width: 100%; height: auto;">
  <style>
    .th { font: bold 14px sans-serif; fill: #fff; }
    .ts { font: 12px sans-serif; fill: #858585; }
    .c-blue { stroke: #569cd6; fill: #1a3a52; stroke-width: 2; cursor: pointer; }
    .c-red { stroke: #f44747; fill: #3a1a1a; stroke-width: 2; cursor: pointer; }
    .c-amber { stroke: #dcdcaa; fill: #2d2516; stroke-width: 2; cursor: pointer; }
    .c-purple { stroke: #c586c0; fill: #2d1e35; stroke-width: 2; cursor: pointer; }
    .c-teal { stroke: #4ec9b0; fill: #1a3a28; stroke-width: 2; cursor: pointer; }
    .c-gray { stroke: #858585; fill: #2d2d30; stroke-width: 2; cursor: pointer; }
    .arr { stroke: #404040; stroke-width: 2; fill: none; marker-end: url(#arr); }
    .region { fill: none; stroke: #c586c0; stroke-dasharray: 8 4; stroke-width: 1; }
    rect:hover { filter: brightness(1.2); }
  </style>
  <defs>
    <marker id="arr" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
      <polygon points="0 0, 10 3.5, 0 7" fill="#404040" />
    </marker>
  </defs>

  <!-- Tier 1: External -->
  <g onclick="showTooltip(event, 'Client', 'Trình duyệt hoặc Mobile App', 'HTTP Request', 'HTTP Response')">
    <rect x="240" y="20" width="200" height="60" rx="8" class="c-blue" />
    <text x="340" y="45" text-anchor="middle" class="th">Client</text>
    <text x="340" y="65" text-anchor="middle" class="ts">Browser / Mobile</text>
  </g>

  <!-- Tier 2: Security -->
  <g onclick="showTooltip(event, 'Guards', 'AuthGuard & RolesGuard', 'JWT / Roles', 'Pass / Deny')">
    <rect x="240" y="110" width="200" height="60" rx="8" class="c-red" />
    <text x="340" y="135" text-anchor="middle" class="th">Guards</text>
    <text x="340" y="155" text-anchor="middle" class="ts">Security Layer</text>
  </g>

  <!-- Tier 3: Entry -->
  <g onclick="showTooltip(event, 'Controllers', 'Tiếp nhận và validate request', 'DTOs', 'Service calls')">
    <rect x="240" y="200" width="200" height="60" rx="8" class="c-amber" />
    <text x="340" y="225" text-anchor="middle" class="th">Controllers</text>
    <text x="340" y="245" text-anchor="middle" class="ts">Entry Points</text>
  </g>

  <!-- Tier 4: Service Layer Subgraph -->
  <rect x="20" y="290" width="640" height="200" rx="12" class="region" />
  <text x="30" y="310" class="ts" style="font-weight: bold; fill: #c586c0;">SERVICE LAYER (Cross-Module Impacts)</text>

  <g onclick="showTooltip(event, 'AuthService', 'Đăng ký/Đăng nhập', 'Credentials', 'Tokens')">
    <rect x="40" y="330" width="180" height="60" rx="8" class="c-purple" />
    <text x="130" y="355" text-anchor="middle" class="th">AuthService</text>
    <text x="130" y="375" text-anchor="middle" class="ts">Auth & Security</text>
  </g>

  <g onclick="showTooltip(event, 'UserService', 'Quản lý tài khoản', 'userId', 'User Profile')">
    <rect x="250" y="330" width="180" height="60" rx="8" class="c-purple" />
    <text x="340" y="355" text-anchor="middle" class="th">UserService</text>
    <text x="340" y="375" text-anchor="middle" class="ts">User Management</text>
  </g>

  <g onclick="showTooltip(event, 'AdminService', 'Quản trị hệ thống', 'Admin tasks', 'Audit logs')">
    <rect x="460" y="330" width="180" height="60" rx="8" class="c-purple" />
    <text x="550" y="355" text-anchor="middle" class="th">AdminService</text>
    <text x="550" y="375" text-anchor="middle" class="ts">System Admin</text>
  </g>

  <g onclick="showTooltip(event, 'CatalogService', 'Sản phẩm & Danh mục', 'Query Params', 'Product List')">
    <rect x="40" y="410" width="180" height="60" rx="8" class="c-purple" />
    <text x="130" y="435" text-anchor="middle" class="th">CatalogService</text>
    <text x="130" y="455" text-anchor="middle" class="ts">Catalog Logic</text>
  </g>

  <g onclick="showTooltip(event, 'CartService', 'Quản lý giỏ hàng', 'cartId', 'Cart Items')">
    <rect x="250" y="410" width="180" height="60" rx="8" class="c-purple" />
    <text x="340" y="435" text-anchor="middle" class="th">CartService</text>
    <text x="340" y="455" text-anchor="middle" class="ts">Cart Logic</text>
  </g>

  <g onclick="showTooltip(event, 'OrdersService', 'Thanh toán & Đơn hàng', 'Checkout Data', 'Order Confirmation')">
    <rect x="460" y="410" width="180" height="60" rx="8" class="c-purple" />
    <text x="550" y="435" text-anchor="middle" class="th">OrdersService</text>
    <text x="550" y="455" text-anchor="middle" class="ts">Checkout Logic</text>
  </g>

  <!-- Tier 5: Persistence -->
  <g onclick="showTooltip(event, 'Prisma DB', 'PostgreSQL Database', 'Queries', 'Records')">
    <rect x="130" y="520" width="180" height="60" rx="8" class="c-teal" />
    <text x="220" y="545" text-anchor="middle" class="th">Prisma / DB</text>
    <text x="220" y="565" text-anchor="middle" class="ts">SQL Storage</text>
  </g>

  <g onclick="showTooltip(event, 'Redis Cache', 'Catalog & Session cache', 'Keys', 'JSON Data')">
    <rect x="370" y="520" width="180" height="60" rx="8" class="c-amber" />
    <text x="460" y="545" text-anchor="middle" class="th">Redis / Cache</text>
    <text x="460" y="565" text-anchor="middle" class="ts">NoSQL Optimization</text>
  </g>

  <!-- Tier 6: Result -->
  <g onclick="showTooltip(event, 'ApiResponse', 'Định dạng response chuẩn', 'Data', 'Standard JSON')">
    <rect x="240" y="610" width="200" height="60" rx="8" class="c-gray" />
    <text x="340" y="635" text-anchor="middle" class="th">ApiResponse</text>
    <text x="340" y="655" text-anchor="middle" class="ts">Formatting Layer</text>
  </g>

  <!-- Arrows -->
  <path d="M 340 80 L 340 105" class="arr" />
  <path d="M 340 170 L 340 195" class="arr" />
  <path d="M 340 260 L 340 285" class="arr" />
  
  <path d="M 130 475 L 130 515" class="arr" />
  <path d="M 340 475 L 340 500 Q 340 510 240 515" class="arr" />
  <path d="M 550 475 L 550 515 Q 550 540 460 545" class="arr" />

  <path d="M 340 585 L 340 605" class="arr" />

  <!-- Tooltip UI -->
  <rect x="20" y="640" width="640" height="70" rx="8" fill="#252526" stroke="#404040" />
  <foreignObject x="40" y="645" width="600" height="60">
    <div id="tooltip-content" xmlns="http://www.w3.org/1999/xhtml" style="color:#d4d4d4; font-family:sans-serif; font-size:12px;">
      <div id="tt-title" style="color:#fff; font-weight:bold; margin-bottom:4px;">Click a node to see system component details</div>
      <div id="tt-why" style="margin-bottom:4px; font-style: italic; color: #ce9178;">Sơ đồ hệ thống tổng quan (System Overview)</div>
      <div style="display:flex; gap:20px;">
        <span id="tt-in" style="color:#4ec9b0;">IN: -</span>
        <span id="tt-out" style="color:#569cd6;">OUT: -</span>
      </div>
    </div>
  </foreignObject>

  <script>
    function showTooltip(evt, title, why, input, output) {
      document.getElementById('tt-title').textContent = title;
      document.getElementById('tt-why').textContent = why;
      document.getElementById('tt-in').textContent = 'IN: ' + input;
      document.getElementById('tt-out').textContent = 'OUT: ' + output;
    }
  </script>
</svg>
```

- [ ] **Step 2: Verify `showTooltip` function**

- [ ] **Step 3: Commit changes**

```bash
rtk proxy git add docs/html/src_explanation.html
rtk proxy git commit -m "docs: redesign System Overview flow SVG diagram"
```
