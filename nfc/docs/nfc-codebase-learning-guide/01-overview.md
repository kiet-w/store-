# NFC Codebase Learning Guide

## 1. Bức Tranh Tổng Thể

### 1.1. Repo đang có gì

Workspace này chứa hai app chính:

```text
nfc/
├── nfc_b2_v2/          # Backend NestJS + Prisma + PostgreSQL
├── nfc_front_end/      # Frontend React + Vite + RTK Query + Storybook
└── docs/               # Tài liệu phân tích được tạo thêm
```

Backend là một modular monolith: vẫn là một app deploy chung, nhưng code được chia theo domain module. Frontend là SPA quản trị và người dùng, có API layer tập trung qua RTK Query, route protected, design system component, và editor danh thiếp số dựa trên GrapesJS.

### 1.2. Domain chính của hệ thống

Các domain quan trọng:

- Authentication: đăng ký, login, verify email, refresh token, forgot/reset password, setup password.
- User: người dùng hệ thống, profile, avatar, user theo công ty.
- Company: công ty, logo, trạng thái, admin công ty.
- Role/Permission: RBAC theo scope hệ thống, công ty, user.
- Physical Card: thẻ NFC vật lý, serial, secret key, trạng thái, assign/revoke.
- Digital Card: danh thiếp số, HTML/CSS design, template, thumbnail preview.
- Card Template và Template Category: template thiết kế danh thiếp.
- Department và Job Title: cấu trúc nhân sự trong công ty.

### 1.3. Full-stack mental model

Luồng request điển hình:

```text
React page/component
  -> domain RTK Query slice
  -> baseQueryWithReAuth
  -> NestJS controller
  -> guards/decorators/pipes
  -> service
  -> DatabaseService
  -> Prisma
  -> PostgreSQL
```

Luồng response đi ngược lại:

```text
Prisma result
  -> service mapper
  -> controller return
  -> ResponseMessageInterceptor
  -> AllExceptionsFilter nếu lỗi
  -> RTK Query transformResponse/transformErrorResponse
  -> UI state/toast/cache invalidation
```

Điểm đáng học ở đây là backend và frontend đều có một "middle layer" rõ ràng:

- Backend middle layer: guards, pipes, filters, interceptors.
- Frontend middle layer: `apiSlice`, endpoint definitions, query tags, auth slice.

Khi hệ thống lớn lên, những layer này giúp tránh việc mỗi page/controller tự xử lý auth, error, validation, và cache theo cách khác nhau.

