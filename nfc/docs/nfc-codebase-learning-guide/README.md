# NFC Codebase Learning Guide

Tài liệu này phân tích codebase NFC theo hướng "nhìn vào để học": backend NestJS, frontend React/Vite, API/system design, và hướng dùng CocoIndex để tạo code graph/documentation tự cập nhật.

Phạm vi phân tích:

- Backend: `nfc_b2_v2`
- Frontend: `nfc_front_end`
- CocoIndex design docs: `../docs/superpowers/specs/2026-05-20-cocoindex-codebase-analyzer-design.md`
- Không dùng GitNexus theo project policy.
- `codegraph` CLI có package ở cấp cha nhưng shell hiện tại không chạy được vì thiếu runtime `node`, nên phần graph được dựng từ source structure và dependency flow đọc trực tiếp.

## Mục Lục

1. [Bức tranh tổng thể](01-overview.md)
2. [Backend architecture](02-backend-architecture.md)
3. [Frontend architecture](03-frontend-architecture.md)
4. [API/system design patterns](04-api-system-design.md)
5. [CocoIndex và code graph](05-cocoindex-code-graph.md)
6. [Những điểm đáng học nhất](06-diem-dang-hoc-nhat.md)
7. [Những điểm cần cải thiện](07-diem-can-cai-thien.md)
8. [Roadmap mở rộng](08-roadmap-mo-rong.md)
9. [Cách học từ repo](09-cach-hoc-tu-repo.md)
10. [Checklist review kiến trúc](10-checklist-review-kien-truc.md)
11. [Kết luận](11-ket-luan.md)

## Cách Đọc

Nếu muốn học theo thứ tự, đọc từ file 01 đến 11.

Nếu muốn học nhanh các pattern hay nhất, bắt đầu với:

- [Backend architecture](02-backend-architecture.md)
- [Frontend architecture](03-frontend-architecture.md)
- [Những điểm đáng học nhất](06-diem-dang-hoc-nhat.md)

Nếu muốn biết nên cải thiện gì trước, đọc:

- [Những điểm cần cải thiện](07-diem-can-cai-thien.md)
- [Roadmap mở rộng](08-roadmap-mo-rong.md)
- [Checklist review kiến trúc](10-checklist-review-kien-truc.md)
