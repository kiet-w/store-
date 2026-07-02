# NFC Codebase Learning Guide

## 7. Những Điểm Cần Cải Thiện Ưu Tiên

## 7.1. Kiểm tra endpoint drift giữa frontend và backend

### Vấn đề

Frontend có một số endpoint chưa thấy trong backend auth controller đã đọc:

```text
POST /auth/logout
POST /auth/register/resend
POST /auth/password/forgot/resend
```

### Tại sao quan trọng

Nếu endpoint không tồn tại, UI sẽ fail runtime.

### Cách tối ưu

Tạo contract check:

```text
Extract RTK endpoint paths
Extract NestJS routes
Compare
Report missing
```

Hoặc generate client từ Swagger.

## 7.2. Sửa params serializer bỏ nhầm falsy value

### Vấn đề

Frontend bỏ qua `0` và `false` vì `if (!value) continue`.

### Tại sao quan trọng

Filter boolean hoặc numeric zero sẽ không gửi lên server.

### Cách tối ưu

Sửa thành:

```ts
if (value === undefined || value === null || value === '') {
  continue;
}
```

## 7.3. Role-based protected route chưa dùng

### Vấn đề

`ProtectedRouteProps` có `requiredRole` nhưng component không dùng.

### Tại sao quan trọng

Ẩn sidebar chưa đủ. Route cũng nên biết user có quyền xem page không.

### Cách tối ưu

Thêm:

```ts
requiredPermissions?: PermissionRequirement[]
```

và check từ `auth.user.roles` hoặc `currentContext`.

## 7.4. Sanitize Digital Card HTML/CSS

### Vấn đề

Editor cho phép HTML/CSS linh hoạt, có `allowScripts: true`.

### Tại sao quan trọng

Nếu design được render public, XSS là rủi ro nghiêm trọng.

### Cách tối ưu

- Sanitize server-side.
- Sandbox preview.
- Disable scripts nếu không cần.
- Allowlist CSS/HTML tags.

## 7.5. Tách service lớn thành use-case

### Vấn đề

PhysicalCardService và AuthService có nhiều flow.

### Tại sao quan trọng

Service lớn khó test và khó review.

### Cách tối ưu

Tách use-case:

```text
AssignPhysicalCardToUserUseCase
ImportPhysicalCardsUseCase
RefreshTokenUseCase
RequestPasswordResetUseCase
```

## 7.6. Permission cache và cross-tenant tests

### Vấn đề

Permission query mỗi request có thể tốn. Cross-tenant bug có risk cao.

### Cách tối ưu

- Cache permission matrix theo role id.
- Add tests cho Company A không access Company B.
- Add audit logs cho permission denied.

