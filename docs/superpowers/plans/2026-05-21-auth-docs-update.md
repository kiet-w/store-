# Auth Module Documentation Update Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Update `docs/html/auth.html` with individual Mermaid diagrams and detailed metadata for every handler and method in the Auth module.

**Architecture:** A single-file HTML dashboard using VSCode Dark Theme, Mermaid.js for diagrams, and structured "Tech Cards" for clarity.

**Tech Stack:** HTML5, CSS3, Mermaid.js.

---

### Task 1: Initialize HTML Template and THÔNG TIN MODULE

**Files:**
- Modify: `docs/html/auth.html`

- [ ] **Step 1: Write the base template and header**

```html
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Phân Tích Chuyên Sâu Module Auth - NestJS Learning Dashboard</title>
  <script src="https://cdn.jsdelivr.net/npm/mermaid/dist/mermaid.min.js"></script>
  <script>mermaid.initialize({ startOnLoad: true, theme: 'dark' });</script>
  <style>
    /* VSCode Dark Theme Styles */
    :root {
      --bg: #1e1e1e; --bg-sidebar: #252526; --bg-surface: #2d2d30; --bg-surface2: #3c3c3c;
      --border: #404040; --text: #d4d4d4; --text-muted: #858585; --text-bright: #ffffff;
      --kw: #569cd6; --fn: #dcdcaa; --typ: #4ec9b0; --accent: #007acc;
    }
    body { background: var(--bg); color: var(--text); font-family: 'Segoe UI', sans-serif; margin: 0; padding: 0; }
    .container { display: flex; min-height: 100vh; }
    .sidebar { width: 260px; background: var(--bg-sidebar); border-right: 1px solid var(--border); position: sticky; top: 0; height: 100vh; overflow-y: auto; }
    .content { flex: 1; padding: 40px; max-width: 1000px; margin: 0 auto; }
    .tech-card { background: var(--bg-surface); border: 1px solid var(--border); border-radius: 8px; margin-bottom: 30px; overflow: hidden; }
    .tech-header { background: var(--bg-surface2); padding: 12px 20px; color: var(--fn); font-family: monospace; font-weight: bold; border-bottom: 1px solid var(--border); }
    .tech-body { padding: 20px; display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
    .field-label { font-size: 11px; text-transform: uppercase; color: var(--text-muted); display: block; }
    .field-value { font-family: monospace; color: var(--text); }
    .full-width { grid-column: span 2; }
    .mermaid { background: rgba(0,0,0,0.2); padding: 15px; border-radius: 4px; margin-top: 15px; }
    table.info-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
    table.info-table th, table.info-table td { border: 1px solid var(--border); padding: 10px; text-align: left; }
    table.info-table th { background: var(--bg-surface2); color: var(--text-bright); width: 200px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="content">
      <h1>THÔNG TIN MODULE: AuthModule</h1>
      <table class="info-table">
        <tr><th>Module</th><td>AuthModule</td></tr>
        <tr><th>Path</th><td><code>src/auth/</code></td></tr>
        <tr><th>Role</th><td>Authentication & JWT Management</td></tr>
        <tr><th>Security</th><td>HttpOnly Cookies, Bcrypt Hashing, JWT Rotation</td></tr>
      </table>
      <!-- Content placeholders -->
    </div>
  </div>
</body>
</html>
```

### Task 2: Implement AuthController Section

**Files:**
- Modify: `docs/html/auth.html`

- [ ] **Step 1: Add AuthController methods (register, login, refresh, logout, me)**

Each method should have a `tech-card` with fields: Method+Path, Function, Decorators, Input, Output, Calls, and a Mermaid diagram.

### Task 3: Implement AuthService (Public) Section

**Files:**
- Modify: `docs/html/auth.html`

- [ ] **Step 1: Add AuthService Public methods**

Methods: `register`, `login`, `handleRefresh`, `handleLogout`, `logout`, `validateAccessToken`.
Fields: Name, Input, Output, Internal Calls / Called By, Side Effects, Logic Description, and a Mermaid diagram.

### Task 4: Implement AuthService (Private) Section

**Files:**
- Modify: `docs/html/auth.html`

- [ ] **Step 1: Add AuthService Private helpers**

Methods: `setCookies`, `generateTokens`, `updateRefreshToken`.
Fields: Name, Input, Output, Internal Calls, Logic Description, and a Mermaid diagram.

### Task 5: Final Assembly and Guard/Logic Sections

**Files:**
- Modify: `docs/html/auth.html`

- [ ] **Step 1: Add AuthGuard and High-level Data Flow**
- [ ] **Step 2: Add sidebar navigation**
- [ ] **Step 3: Verify all diagrams render correctly**
