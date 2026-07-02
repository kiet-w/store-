# NFC Codebase Learning Guide

## 4. API/System Design Patterns

## 4.1. Response Contract Giữa Backend Và Frontend

Backend:

- `ResponseMessageInterceptor`
- `AllExceptionsFilter`

Frontend:

- `isApiError`
- `parseApiError`
- `createMutationDefinition`
- `createQueryDefinition`

### Nó là gì

Backend success response có `message`. Backend error response có `statusCode` và `message`. Frontend dựa vào đó để toast success/error.

### Vì sao nó tốt

Đây là contract full-stack rõ ràng. Nếu response nhất quán, UI code đơn giản:

- mutation success -> show success toast
- mutation error -> parse message -> show error toast
- endpoint có thể opt-out bằng `hideSuccessfulToast`

### Tốt trong trường hợp nào

Tốt khi:

- Product có nhiều form/mutation.
- Muốn UX feedback nhất quán.
- Backend và frontend cùng team hoặc contract rõ.

### Xấu trong trường hợp nào

Rủi ro:

- Nếu backend trả nested validation errors phức tạp, frontend parse string có thể không đủ.
- Nếu endpoint success không nên toast, dev phải nhớ hide.
- Nếu backend message dùng tiếng Anh nhưng UI đang tiếng Việt, UX lẫn ngôn ngữ.

### Tối ưu hoặc mở rộng

Nên dùng error code:

```json
{
  "code": "PHYSICAL_CARD_NOT_FOUND",
  "message": "Physical card not found."
}
```

Frontend map code sang i18n:

```ts
t(`apiErrors.${code}`)
```

Backend vẫn có fallback message.

## 4.2. API Versioning Và Contract Drift

### Hiện trạng

Backend route hiện không có prefix `/api/v1`. Frontend dùng hard-coded paths.

Có dấu hiệu drift cần kiểm tra:

- Frontend có `/auth/logout`
- Frontend có `/auth/register/resend`
- Frontend có `/auth/password/forgot/resend`
- Backend auth controller được đọc hiện chưa thấy các route này.

### Vì sao cần quan tâm

Contract drift là một trong các lỗi phổ biến nhất khi frontend/backend phát triển song song. Frontend gọi endpoint không tồn tại sẽ gây lỗi runtime.

### Tốt trong trường hợp nào nếu giữ hiện tại

Không version và hard-code path vẫn ổn khi:

- Team nhỏ.
- Backend/frontend release cùng lúc.
- API chưa public.
- Product đang prototype.

### Xấu trong trường hợp nào

Xấu khi:

- Có mobile app hoặc external clients.
- Backend deploy độc lập frontend.
- API thay đổi thường xuyên.
- Có nhiều môi trường staging/prod.

### Tối ưu hoặc mở rộng

Nên:

- Thêm global prefix:

```text
/api/v1
```

- Generate frontend client từ OpenAPI.
- Thêm CI check route drift:

```text
backend Swagger routes vs frontend endpoint strings
```

- Tạo endpoint constants hoặc generated client.

## 4.3. Multi-Tenant SaaS Design

### Nó là gì

Hệ thống có nhiều company, mỗi company có users, departments, job titles, cards. User role có thể gắn với company.

### Vì sao nó tốt

Model này phù hợp SaaS B2B:

- một platform quản lý nhiều công ty
- super admin quản trị toàn hệ thống
- company admin quản trị công ty
- employee dùng card cá nhân

### Tốt trong trường hợp nào

Tốt khi:

- Sản phẩm bán cho nhiều doanh nghiệp.
- Cần phân quyền theo công ty.
- Một user có thể thuộc nhiều công ty.

### Xấu trong trường hợp nào

Rủi ro:

- Data leakage cross-company là lỗi nghiêm trọng.
- Query nào quên `company_id` filter có thể lộ data.
- Frontend currentContext stale có thể gọi sai company.
- PermissionGuard không đủ nếu thiếu ownership guard.

### Tối ưu hoặc mở rộng

Nên:

- Dùng helper bắt buộc company scope cho query:

```ts
listUsersForCompany(companyId, params)
```

- Audit các query system-wide.
- Thêm integration test cross-tenant.
- Cân nhắc row-level security ở PostgreSQL nếu yêu cầu bảo mật cao.

## 4.4. Upload Và Import Design

### Hiện trạng

Backend dùng:

- Multer memory storage
- custom parse file pipe
- CSV/XLSX parser
- max import records
- S3/storage service cho image

### Vì sao nó tốt

Upload pipe tách validation file khỏi service. Service tập trung parse/business.

Giới hạn `MAX_IMPORT_RECORDS` tốt vì tránh user upload file quá lớn làm nghẽn process.

### Tốt trong trường hợp nào

Tốt khi:

- File import nhỏ/vừa.
- User cần thao tác admin nhanh.
- Server có đủ memory.

### Xấu trong trường hợp nào

Rủi ro:

- `memoryStorage` giữ file trong RAM.
- XLSX parse sync có thể block event loop.
- Import một request dài dễ timeout.
- Không có import progress.

### Tối ưu hoặc mở rộng

Nên:

- Dùng streaming parser cho CSV lớn.
- Dùng background job cho import lớn.
- Lưu import job result:

```text
ImportJob
ImportJobRowError
```

- Trả report:

```json
{
  "created": 450,
  "failed": 12,
  "errors": [...]
}
```

