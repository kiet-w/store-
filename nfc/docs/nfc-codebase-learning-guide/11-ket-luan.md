# NFC Codebase Learning Guide

## 11. Kết Luận

Điểm mạnh chính của codebase:

- Backend modular theo domain, dễ học từng phần.
- Global validation/error/response/logging tương đối bài bản.
- RBAC theo scope là một design tốt cho SaaS nhiều công ty.
- Prisma model thể hiện domain rõ.
- Frontend API layer bằng RTK Query có refresh token mutex, rất đáng học.
- Frontend có design system và Storybook, phù hợp dashboard app.
- Digital card editor chọn engine có sẵn thay vì tự viết từ đầu.
- Có hướng CocoIndex analyzer tốt để biến codebase thành tài liệu sống.

Điểm cần cải thiện chính:

- Kiểm tra contract drift frontend/backend.
- Hardening auth/token/OTP.
- Sanitize digital card HTML/CSS.
- Tách service lớn thành use-case.
- Formalize card status transitions.
- Thêm permission/cross-tenant E2E tests.
- Implement CocoIndex analyzer thật cho backend/frontend.

Nếu chỉ chọn 3 thứ đáng học nhất từ repo này:

1. Thiết kế RBAC theo `scope + action + resource` và guard metadata.
2. RTK Query `baseQueryWithReAuth` dùng mutex để refresh token an toàn.
3. Modular monolith theo domain, có global API boundary rõ bằng pipe/filter/interceptor.
