# NFC Codebase Learning Guide

## 6. Những Điểm Đáng Học Nhất

## 6.1. Backend: Cross-Cutting Concerns Đặt Ở Global Layer

### Pattern

Validation, response wrapper, exception filter, logger, Swagger đặt ở bootstrap.

### Vì sao tốt

Giúp controller/service tập trung nghiệp vụ.

### Tốt khi

App có nhiều endpoint và cần consistency.

### Xấu khi

Một vài endpoint cần behavior đặc biệt như file stream.

### Mở rộng

Thêm decorators skip/override behavior cho route đặc biệt.

## 6.2. Backend: RBAC Metadata + Guard

### Pattern

Route khai báo permission bằng decorator, guard xử lý enforcement.

### Vì sao tốt

Permission declarative, dễ scan, dễ test.

### Tốt khi

Nhiều role/resource/action.

### Xấu khi

Ownership theo company/user không được kiểm tra kèm.

### Mở rộng

Policy engine hoặc permission cache.

## 6.3. Backend: Service Chứa Business Flow, Controller Mỏng

### Pattern

Controller nhận request và gọi service. Service xử lý nghiệp vụ.

### Vì sao tốt

Dễ test, dễ đọc, đúng NestJS convention.

### Tốt khi

Flow nghiệp vụ nhiều bước.

### Xấu khi

Service thành file quá lớn.

### Mở rộng

Tách use-case service.

## 6.4. Frontend: RTK Query Base Layer Có Re-Auth

### Pattern

Mọi API request đi qua baseQueryWithReAuth.

### Vì sao tốt

Auth, refresh, error normalization tập trung.

### Tốt khi

SPA nhiều request song song.

### Xấu khi

Refresh flow phức tạp, logout race condition.

### Mở rộng

Timeout, cancellation, proactive refresh.

## 6.5. Frontend: Domain API Slices

### Pattern

Mỗi domain inject endpoints riêng vào apiSlice.

### Vì sao tốt

File nhỏ hơn, ownership rõ hơn.

### Tốt khi

API nhiều endpoint.

### Xấu khi

Tag invalidation không nhất quán giữa slices.

### Mở rộng

Codegen từ OpenAPI hoặc convention generator.

## 6.6. Frontend: Design System + Storybook

### Pattern

Atoms/molecules/organisms/templates/pages và stories.

### Vì sao tốt

UI reuse và review độc lập.

### Tốt khi

Dashboard nhiều UI pattern lặp.

### Xấu khi

Over-abstraction hoặc stories stale.

### Mở rộng

Visual regression, accessibility testing.

## 6.7. Full-Stack: Language Header Và I18n

### Pattern

Frontend gửi `accept-language`, backend dùng `ReqLanguage` và `I18nService`.

### Vì sao tốt

Backend message/email theo ngôn ngữ user.

### Tốt khi

Sản phẩm multi-language.

### Xấu khi

Frontend toast dùng backend message làm UI text nhưng i18n frontend/backend không đồng bộ.

### Mở rộng

Backend trả `code`, frontend tự translate.

