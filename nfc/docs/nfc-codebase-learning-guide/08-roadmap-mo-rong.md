# NFC Codebase Learning Guide

## 8. Roadmap Mở Rộng Đề Xuất

## 8.1. Giai đoạn 1: Contract Safety

Mục tiêu: giảm lỗi frontend/backend drift.

Việc nên làm:

- Thêm API prefix `/api/v1`.
- Generate OpenAPI JSON trong CI.
- Generate frontend API client hoặc ít nhất type.
- Viết script so sánh RTK endpoints với backend routes.
- Chuẩn hóa response error code.

## 8.2. Giai đoạn 2: Security Hardening

Mục tiêu: giảm rủi ro auth, XSS, tenant leakage.

Việc nên làm:

- Hash OTP.
- Refresh token rotation.
- Rate limit auth endpoints.
- Sanitize digital card HTML/CSS.
- Add request redaction logging.
- Cross-tenant E2E tests.

## 8.3. Giai đoạn 3: Domain Workflow Formalization

Mục tiêu: biến rules ẩn thành rules rõ.

Việc nên làm:

- Physical card status state machine.
- Import job async.
- Thumbnail status/versioning.
- Audit logs.
- Domain events:

```text
PhysicalCardAssigned
PhysicalCardActivated
DigitalCardUpdated
CompanyActivated
UserInvited
```

## 8.4. Giai đoạn 4: CocoIndex Code Intelligence

Mục tiêu: docs/code graph tự cập nhật.

Việc nên làm:

- Implement analyzer cho backend và frontend.
- Extract backend route map.
- Extract frontend RTK endpoint map.
- Link frontend endpoint -> backend route.
- Generate contract drift report.
- Generate permission matrix.
- Generate onboarding guide tự động.

