# NFC Codebase Learning Guide

## 5. CocoIndex Và Code Graph Hướng Mở Rộng

## 5.1. Hiện trạng CocoIndex trong workspace

Có tài liệu design:

- `../docs/superpowers/specs/2026-05-20-cocoindex-codebase-analyzer-design.md`
- `../docs/superpowers/plans/2026-05-20-cocoindex-codebase-analyzer.md`

Chưa thấy implementation analyzer trong `nfc_b2_v2` hoặc `nfc_front_end`.

### Design hiện tại nói gì

Ý tưởng:

1. Dùng CocoIndex scan `src/**/*.ts`.
2. Mỗi file đi qua `@coco.fn(memo=True)`.
3. LLM phân tích file thành structured output.
4. Output gồm:
   - file_path
   - purpose
   - data_flow
   - highlights
5. Aggregate thành `src_explanation.md`.

### Vì sao nó tốt

CocoIndex mạnh ở incremental processing. Nếu codebase có 300 file, lần đầu phân tích hết. Lần sau chỉ file thay đổi mới chạy lại LLM. Điều này tiết kiệm chi phí và thời gian.

Structured extraction bằng Pydantic tốt hơn prompt tự do vì output ổn định và dễ aggregate.

### Tốt trong trường hợp nào

Tốt khi:

- Codebase lớn.
- Muốn docs tự cập nhật.
- Muốn semantic search/code graph.
- Muốn onboarding docs.
- Muốn review impact theo file/module.

### Xấu trong trường hợp nào

Rủi ro:

- LLM có thể hallucinate nếu chỉ đọc từng file không có context graph.
- Phân tích từng file riêng có thể bỏ lỡ flow xuyên module.
- Nếu prompt không ổn định, docs thay đổi noise nhiều.
- Nếu không có CI/process update, docs vẫn stale.

### Tối ưu hoặc mở rộng

Nên nâng analyzer thành nhiều stage:

```text
Stage 1: File extraction
  -> purpose, exports, imports, endpoints, hooks, components

Stage 2: Symbol graph
  -> controller -> service -> database method
  -> page -> hook -> RTK endpoint -> backend route

Stage 3: Flow summary
  -> Auth flow
  -> Physical card assignment flow
  -> Digital card editor publish flow

Stage 4: Risk detection
  -> frontend endpoint not found in backend
  -> route protected frontend but backend public
  -> backend endpoint no frontend consumer
```

## 5.2. Code Graph Nên Có Cho Repo Này

### Backend graph nên extract

Node types:

```text
Module
Controller
Route
Guard
DTO
ServiceMethod
DatabaseMethod
PrismaModel
QueueProducer
StorageOperation
MailerOperation
```

Edges:

```text
Module imports Module
Controller handles Route
Route uses Guard
Route accepts DTO
Route calls ServiceMethod
ServiceMethod calls DatabaseMethod
DatabaseMethod touches PrismaModel
ServiceMethod enqueues QueueProducer
ServiceMethod sends MailerOperation
ServiceMethod uploads StorageOperation
```

### Frontend graph nên extract

Node types:

```text
Route
Page
Template
Organism
Hook
RTKEndpoint
ReduxSlice
ValidationSchema
Component
Story
```

Edges:

```text
Route lazy loads Page
Page renders Template
Template uses Organism
Organism uses Hook
Hook calls RTKEndpoint
RTKEndpoint fetches BackendRoute
Form uses ValidationSchema
Component has Story
```

### Full-stack graph nên extract

Quan trọng nhất:

```text
Frontend RTK endpoint -> Backend route -> Controller method -> Service method -> Database query -> Prisma model
```

Ví dụ:

```text
useLoginMutation
  -> POST /auth/login
  -> AuthController.login
  -> LocalAuthGuard
  -> AuthService.login
  -> JwtService.signAsync
```

```text
useAssignMultipleCardsToEmployeeMutation
  -> PATCH /physical-cards/user/:userId/bulk-assign
  -> PhysicalCardController
  -> PhysicalCardService
  -> DatabaseService
  -> PhysicalCard model
```

### Vì sao full-stack graph tốt

Nó trả lời được các câu hỏi:

- Page này dùng endpoint nào?
- Endpoint này có frontend nào gọi không?
- Nếu sửa response field `physical_cards`, component nào vỡ?
- Nếu sửa permission route, màn hình nào bị ảnh hưởng?
- Backend có route nào orphan không?
- Frontend có endpoint nào không tồn tại không?

## 5.3. Analyzer Output Nên Sinh

Nên sinh nhiều file thay vì một file khổng lồ:

```text
docs/generated/
├── backend-api-map.md
├── backend-domain-map.md
├── frontend-route-map.md
├── frontend-api-consumers.md
├── fullstack-flow-map.md
├── permission-matrix.md
├── data-model-map.md
└── contract-drift-report.md
```

### backend-api-map.md

Nội dung:

```text
Route
Method
Controller method
Guards
Permission required
DTO input
Service method
Response keys
```

### frontend-api-consumers.md

Nội dung:

```text
RTK endpoint
HTTP method/path
Hook exported
Components/pages using hook
Cache tags
Invalidation behavior
```

### permission-matrix.md

Nội dung:

```text
Resource
Action
Scope
Endpoint
Allowed roles
Tests coverage
```

### contract-drift-report.md

Nội dung:

```text
Frontend endpoint missing in backend
Backend endpoint unused by frontend
Response keys expected by frontend but not returned by backend
Backend requires auth but frontend treats public
Frontend sends query param backend DTO does not define
```

