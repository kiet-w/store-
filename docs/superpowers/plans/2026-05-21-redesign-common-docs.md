# Common Module Documentation Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign `docs/html/common.html` into a high-fidelity technical documentation page with Mermaid diagrams and VSCode Dark Theme styling.

**Architecture:** Single-file HTML documentation with embedded CSS for VSCode Dark Theme and Mermaid.js for diagrams. Each component will be documented with its Logic Flow, Input, Output, and Side Effects.

**Tech Stack:** HTML5, CSS (VSCode Dark Theme), Mermaid.js.

---

### Task 1: Initialize HTML Structure & Styling

**Files:**
- Modify: `docs/html/common.html`

- [ ] **Step 1: Write the base HTML structure with VSCode Dark Theme CSS**

```html
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Module Common - Documentation</title>
    <script src="https://cdn.jsdelivr.net/npm/mermaid/dist/mermaid.min.js"></script>
    <script>mermaid.initialize({ startOnLoad: true, theme: 'dark' });</script>
    <style>
        :root {
            --bg-color: #1e1e1e;
            --text-color: #d4d4d4;
            --header-bg: #252526;
            --accent-color: #007acc;
            --code-bg: #2d2d2d;
            --border-color: #3e3e3e;
            --keyword: #569cd6;
            --string: #ce9178;
            --comment: #6a9955;
            --function: #dcdcaa;
        }
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: var(--bg-color);
            color: var(--text-color);
            line-height: 1.6;
            margin: 0;
            padding: 0;
        }
        .container {
            max-width: 1000px;
            margin: 0 auto;
            padding: 40px 20px;
        }
        h1, h2, h3 { color: var(--accent-color); border-bottom: 1px solid var(--border-color); padding-bottom: 10px; }
        .module-info {
            background-color: var(--header-bg);
            border-left: 5px solid var(--accent-color);
            padding: 20px;
            margin-bottom: 30px;
        }
        .component-section {
            background-color: var(--header-bg);
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 40px;
            border: 1px solid var(--border-color);
        }
        .diagram-container {
            text-align: center;
            margin: 20px 0;
            background: #252526;
            padding: 20px;
            border-radius: 4px;
        }
        .details-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-top: 20px;
        }
        .detail-item strong { color: var(--function); display: block; margin-bottom: 5px; }
        pre {
            background-color: var(--code-bg);
            padding: 15px;
            border-radius: 4px;
            overflow-x: auto;
            border: 1px solid var(--border-color);
        }
        code { font-family: 'Consolas', monospace; }
        .keyword { color: var(--keyword); }
        .string { color: var(--string); }
        .comment { color: var(--comment); }
        .function { color: var(--function); }
    </style>
</head>
<body>
    <div class="container">
        <!-- Content will be added in subsequent tasks -->
    </div>
</body>
</html>
```

- [ ] **Step 2: Commit**

```bash
git add docs/html/common.html
git commit -m "docs: initialize common.html with VSCode Dark Theme"
```

### Task 2: Implement "THÔNG TIN MODULE" Section

**Files:**
- Modify: `docs/html/common.html`

- [ ] **Step 1: Add the "THÔNG TIN MODULE" header**

```html
<div class="module-info">
    <h1>THÔNG TIN MODULE: COMMON</h1>
    <p><strong>Mô tả:</strong> Module nền tảng chứa các công cụ, tiện ích, cấu hình và các lớp bảo vệ dùng chung (Guards, Filters, Decorators, Utils) cho toàn bộ hệ thống.</p>
    <p><strong>Vị trí:</strong> <code>src/common/</code></p>
    <p><strong>Vai trò:</strong> Chuẩn hóa dữ liệu trả về, kiểm soát quyền hạn, xử lý lỗi tập trung và quản lý cấu hình dùng chung.</p>
</div>
```

- [ ] **Step 2: Commit**

```bash
git add docs/html/common.html
git commit -m "docs: add module info header to common.html"
```

### Task 3: Document Roles Decorator & RolesGuard

**Files:**
- Modify: `docs/html/common.html`

- [ ] **Step 1: Add Roles Decorator section**

```html
<section class="component-section" id="decorators">
    <h2>1. Roles Decorator (@Roles)</h2>
    <p>Dán nhãn quyền hạn yêu cầu cho API bằng cách sử dụng <code>SetMetadata</code>.</p>
    <div class="diagram-container">
        <div class="mermaid">
        graph LR
            A[Controller/Method] -->|Gắn @Roles| B(roles.decorator.ts)
            B -->|SetMetadata| C[Metadata: 'roles']
            C -->|Lưu trữ| D[NestJS Reflector]
        </div>
    </div>
    <div class="details-grid">
        <div class="detail-item"><strong>Logic Flow:</strong> Nhận danh sách UserRole và gán vào metadata 'roles' của handler.</div>
        <div class="detail-item"><strong>Input:</strong> <code>...roles: UserRole[]</code></div>
        <div class="detail-item"><strong>Output:</strong> Custom Decorator.</div>
        <div class="detail-item"><strong>Side Effects:</strong> Ghi metadata vào class hoặc method.</div>
    </div>
</section>
```

- [ ] **Step 2: Add RolesGuard section**

```html
<section class="component-section" id="guards">
    <h2>2. RolesGuard</h2>
    <p>Nhân viên an ninh kiểm tra quyền truy cập dựa trên metadata và thông tin user trong request.</p>
    <div class="diagram-container">
        <div class="mermaid">
        graph TD
            A[Bắt đầu Request] --> B{API có nhãn @Roles?}
            B -- Không --> C[Cho qua - true]
            B -- Có --> D[Lấy roles từ Reflector]
            D --> E[Lấy user.role từ Request]
            E --> F{User role hợp lệ?}
            F -- Có --> G[Cho qua - true]
            F -- Không --> H[Lỗi ForbiddenException - 403]
        </div>
    </div>
    <div class="details-grid">
        <div class="detail-item"><strong>Logic Flow:</strong> Kiểm tra metadata -> Lấy role user -> So sánh -> Quyết định.</div>
        <div class="detail-item"><strong>Input:</strong> <code>ExecutionContext</code></div>
        <div class="detail-item"><strong>Output:</strong> <code>boolean</code></div>
        <div class="detail-item"><strong>Side Effects:</strong> Thêm tính bảo mật cho API.</div>
    </div>
</section>
```

- [ ] **Step 3: Commit**

```bash
git add docs/html/common.html
git commit -m "docs: add Decorators and Guards documentation"
```

### Task 4: Document AllExceptionsFilter

**Files:**
- Modify: `docs/html/common.html`

- [ ] **Step 1: Add AllExceptionsFilter section**

```html
<section class="component-section" id="filters">
    <h2>3. AllExceptionsFilter</h2>
    <p>Lưới bắt lỗi toàn cục, chuẩn hóa phản hồi JSON và bảo vệ thông tin máy chủ.</p>
    <div class="diagram-container">
        <div class="mermaid">
        graph TD
            A[Lỗi xảy ra] --> B[AllExceptionsFilter bắt lỗi]
            B --> C{Phân loại lỗi?}
            C -- HttpException --> D[Lấy message & status gốc]
            C -- Lỗi khác --> E[Status 500 & Message bảo mật]
            B --> F[Ghi log stack trace xuống Server]
            D --> G[Format JSON ApiResponse]
            E --> G
            G --> H[Trả về cho Client]
        </div>
    </div>
    <div class="details-grid">
        <div class="detail-item"><strong>Logic Flow:</strong> Catch -> Phân loại -> Log server -> Masking lỗi 500 -> Trả về JSON.</div>
        <div class="detail-item"><strong>Input:</strong> <code>exception: unknown</code>, <code>host: ArgumentsHost</code></div>
        <div class="detail-item"><strong>Output:</strong> <code>Standardized JSON Response</code></div>
        <div class="detail-item"><strong>Side Effects:</strong> Logging chi tiết (CrisisManagementTeam).</div>
    </div>
</section>
```

- [ ] **Step 2: Commit**

```bash
git add docs/html/common.html
git commit -m "docs: add Exception Filter documentation"
```

### Task 5: Document API Response Utils & Constants

**Files:**
- Modify: `docs/html/common.html`

- [ ] **Step 1: Add API Response Utils section**

```html
<section class="component-section" id="utils">
    <h2>4. API Response Utils</h2>
    <p>Các hàm helper chuẩn hóa cấu trúc dữ liệu trả về cho Frontend.</p>
    <div class="diagram-container">
        <div class="mermaid">
        graph LR
            A[Raw Data] --> B(success / paginated)
            B --> C{Loại Response?}
            C -- success --> D[ApiResponse: success, data]
            C -- paginated --> E[PaginatedApiResponse: success, data, meta]
        </div>
    </div>
    <div class="details-grid">
        <div class="detail-item"><strong>Logic Flow:</strong> Bọc dữ liệu vào interface ApiResponse chuẩn.</div>
        <div class="detail-item"><strong>Input:</strong> Data <code>T</code>, total, page, limit.</div>
        <div class="detail-item"><strong>Output:</strong> Wrapped Object.</div>
        <div class="detail-item"><strong>Side Effects:</strong> Tính toán <code>totalPages</code>.</div>
    </div>
</section>
```

- [ ] **Step 2: Add Constants section**

```html
<section class="component-section" id="constants">
    <h2>5. Standardized Configuration (Constants)</h2>
    <p>Quản lý tập trung các hằng số dùng chung trong hệ thống.</p>
    <h3>Cache Constants</h3>
    <pre><code><span class="keyword">export const</span> <span class="function">CACHE_KEYS</span> = {
  PRODUCTS: <span class="string">'products:list'</span>,
  PRODUCT: (slug: <span class="keyword">string</span>) => <span class="string">`products:${slug}`</span>,
  ...
} <span class="keyword">as const</span>;

<span class="keyword">export const</span> <span class="function">CACHE_TTL</span> = {
  PRODUCTS: <span class="keyword">5 * 60 * 1000</span>, <span class="comment">// 5 mins</span>
  ...
} <span class="keyword">as const</span>;</code></pre>
</section>
```

- [ ] **Step 3: Close HTML tags and finalize**

```html
    </div>
</body>
</html>
```

- [ ] **Step 4: Commit**

```bash
git add docs/html/common.html
git commit -m "docs: finalize common.html with Utils and Constants"
```
