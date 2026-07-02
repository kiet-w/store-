# NFC Codebase Learning Guide

## 10. Checklist Review Kiến Trúc

Dùng checklist này khi thêm feature mới.

### Backend feature mới

- Module/domain đặt đúng chỗ chưa?
- DTO validate đủ input chưa?
- Route có Swagger decorator chưa?
- Route có `JwtAuthGuard` nếu cần auth chưa?
- Route có `PermissionGuard` nếu cần permission chưa?
- Nếu route company/user scoped, có access guard chưa?
- Service có transaction nếu update nhiều bảng chưa?
- Error message có i18n chưa?
- Response shape có match frontend expectation không?
- E2E test có cover happy path và forbidden path không?

### Frontend feature mới

- Endpoint đặt vào domain API slice chưa?
- Request/response type có rõ chưa?
- Cache tag provides/invalidates đúng chưa?
- Form có Zod schema chưa?
- Page có protected route đúng chưa?
- Sidebar/menu có check context/permission chưa?
- Loading/error/empty state có đủ chưa?
- Component reusable có story chưa?
- API path có tồn tại ở backend không?

### Full-stack feature mới

- Backend route và frontend endpoint match path/method chưa?
- Query param format match DTO/parser chưa?
- Response keys frontend dùng có backend trả không?
- Error code/message frontend parse được không?
- Permission backend và route visibility frontend có đồng bộ không?
- Cross-tenant access đã test chưa?

