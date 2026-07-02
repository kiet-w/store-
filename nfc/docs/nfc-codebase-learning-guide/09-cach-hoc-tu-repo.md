# NFC Codebase Learning Guide

## 9. Cách Học Từ Repo Này Theo Thứ Tự

Nếu muốn học hiệu quả, nên đi theo thứ tự này:

1. Đọc `nfc_b2_v2/src/main.ts` để hiểu global API behavior.
2. Đọc `nfc_b2_v2/src/app.module.ts` để hiểu module graph.
3. Đọc `prisma/schema.prisma` để hiểu domain model.
4. Đọc `auth.controller.ts` và `auth.service.ts` để hiểu auth flow.
5. Đọc `permission.guard.ts`, `company-access.guard.ts`, `user-access.guard.ts`.
6. Đọc `physical-card.controller.ts` và `physical-card.service.ts` để học workflow asset management.
7. Đọc `nfc_front_end/src/redux/apiSlice.ts` để hiểu frontend API foundation.
8. Đọc `authApiSlice.ts`, `physicalCardApiSlice.ts`, `companyApiSlice.ts`.
9. Đọc `router.tsx`, `ProtectedRoute.tsx`, `DashboardLayout.tsx`.
10. Đọc `PageEditor.tsx` nếu muốn học cách wrap một engine phức tạp như GrapesJS.
11. Đọc E2E tests trong `nfc_b2_v2/test` để hiểu cách flow được verify.

