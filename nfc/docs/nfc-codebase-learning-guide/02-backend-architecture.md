# NFC Codebase Learning Guide

## 2. Backend Architecture

## 2.1. Modular Monolith Theo Domain

Backend entry module nằm ở:

- `nfc_b2_v2/src/app.module.ts`

Các module chính được import:

```text
AuthModule
UserModule
CompanyModule
PhysicalCardModule
DigitalCardModule
DigitalCardTemplateModule
TemplateCategoryModule
CompanyDepartmentModule
JobTitleModule
DatabaseModule
MailerModule
StorageModule
UserCacheModule
```

### Nó là gì

Đây là cách tổ chức backend thành nhiều module theo business domain. Mỗi module thường có:

```text
module-name/
├── module-name.module.ts
├── module-name.controller.ts
├── module-name.service.ts
└── dto/
```

Ví dụ:

```text
src/modules/physical-card/
├── physical-card.module.ts
├── physical-card.controller.ts
├── physical-card.service.ts
├── dto/
└── pipes/
```

### Vì sao nó tốt

Nó tốt vì code được gom theo nghiệp vụ thay vì gom theo kỹ thuật. Khi muốn sửa logic thẻ vật lý, bạn vào `physical-card`. Khi muốn sửa auth, bạn vào `auth`. Điều này giảm cognitive load.

Nó cũng giúp controller và service của từng domain nhỏ hơn. Developer mới có thể học từng mảng một thay vì phải hiểu toàn app.

### Tốt trong trường hợp nào

Pattern này tốt khi:

- Sản phẩm có nhiều domain nhưng vẫn deploy chung.
- Team còn nhỏ hoặc vừa, chưa cần microservices.
- Cần transaction hoặc query qua nhiều bảng trong cùng database.
- Business logic thay đổi nhanh và cần refactor dễ.
- App cần tận dụng dependency injection của NestJS.

### Xấu trong trường hợp nào

Pattern này có thể xấu khi:

- Module bắt đầu import vòng tròn quá nhiều.
- Service domain này gọi service domain kia liên tục, tạo coupling.
- Database schema quá chung, mọi module đều đụng cùng một bảng.
- Team quá lớn và mỗi team cần deploy độc lập.
- Một domain có scaling profile khác hẳn, ví dụ preview rendering cần queue worker riêng lớn.

### Tối ưu hoặc mở rộng

Nên thêm boundary rõ hơn cho mỗi module:

- Public API của module chỉ export service thật sự cần dùng ngoài.
- Tránh import service chéo tùy tiện.
- Với logic dùng chung, tách sang `shared` hoặc domain service riêng.
- Với flow nhiều bước, cân nhắc application service/use-case service:

```text
modules/physical-card/
├── use-cases/
│   ├── assign-card-to-company.use-case.ts
│   ├── assign-card-to-user.use-case.ts
│   └── import-physical-cards.use-case.ts
```

Khi service quá dài, use-case service giúp mỗi file có một trách nhiệm rõ.

## 2.2. Bootstrap Layer: Validation, CORS, Swagger, Error, Response

Backend bootstrap nằm ở:

- `nfc_b2_v2/src/main.ts`

Các setup quan trọng:

- `app.set('query parser', 'extended')`
- `ResponseMessageInterceptor`
- `ValidationPipe`
- `AllExceptionsFilter`
- CORS từ `CORS_ALLOWED_ORIGINS`
- Swagger docs tại `/docs`
- Logger từ `nestjs-pino`

### Nó là gì

Bootstrap layer là nơi cấu hình behavior toàn cục cho API. Thay vì mỗi controller tự validate, tự wrap response, tự handle error, app set một lần ở entry point.

### Vì sao nó tốt

`ValidationPipe` với:

```ts
whitelist: true
forbidNonWhitelisted: true
transform: true
enableImplicitConversion: true
```

là một setup tốt vì:

- `whitelist`: loại bỏ field không khai báo trong DTO.
- `forbidNonWhitelisted`: reject luôn request có field lạ.
- `transform`: convert input plain object thành DTO instance.
- `enableImplicitConversion`: query param `"1"` có thể thành number nếu DTO khai báo number.

Điều này giảm lỗi injection dữ liệu không mong muốn.

`SwaggerModule` tốt vì API contract có thể xem trực tiếp. Với dự án có frontend riêng, Swagger giúp frontend biết endpoint, body, auth scheme, và response mô tả.

`CORS_ALLOWED_ORIGINS` tốt vì production có thể giới hạn origin, còn local dev có thể mở.

### Tốt trong trường hợp nào

Rất tốt khi:

- API public hoặc dùng bởi nhiều frontend.
- Có nhiều controller và cần response/error thống nhất.
- Team backend/frontend tách nhau.
- Cần debug production bằng request id.
- Cần auto-document API.

### Xấu trong trường hợp nào

Có vài rủi ro:

- `enableImplicitConversion` tiện nhưng có thể che giấu input sai nếu DTO không chặt.
- Response wrapper toàn cục có thể gây mismatch nếu endpoint cần trả binary/stream/file.
- CORS fallback `true` nếu env không set có thể quá mở trong production nếu config thiếu.
- Swagger expose `/docs` trong production có thể cần auth hoặc disable tùy sản phẩm.

### Tối ưu hoặc mở rộng

Nên thêm:

- Env validation bằng Joi/Zod để thiếu `CORS_ALLOWED_ORIGINS`, `DATABASE_URL`, `JWT_SECRET` thì fail sớm.
- Disable hoặc protect Swagger ở production:

```text
ENABLE_SWAGGER=true/false
```

- Global API prefix:

```text
/api/v1/auth/login
/api/v1/companies
```

- Versioning:

```text
/api/v1
/api/v2
```

- Rate limiting cho auth endpoints.
- Request body size limit cho upload/import.

## 2.3. ResponseMessageInterceptor: Chuẩn Hóa Response

File:

- `nfc_b2_v2/src/common/interceptors/response-message.interceptor.ts`

### Nó là gì

Interceptor này đảm bảo mọi response thành công có `message`. Nếu controller return object chưa có message, interceptor thêm:

```json
{
  "message": "Success",
  "...": "..."
}
```

Nếu return array/primitive/null, nó wrap:

```json
{
  "message": "Success",
  "data": ...
}
```

### Vì sao nó tốt

Frontend đang có `createMutationDefinition` đọc `result.message` để show toast. Vì vậy response thống nhất giúp frontend không cần if/else từng endpoint.

Nó còn giúp API user có experience nhất quán: mutation nào cũng có message.

### Tốt trong trường hợp nào

Tốt khi:

- API chủ yếu trả JSON.
- Frontend muốn toast success chung.
- Team muốn quy ước response wrapper.
- Controller không cần lặp `{ message: 'Success' }` ở mọi nơi.

### Xấu trong trường hợp nào

Rủi ro khi:

- Endpoint trả file stream, image, CSV, PDF.
- Endpoint proxy response từ service khác.
- GraphQL hoặc SSE/WebSocket không hợp với wrapper.
- Frontend cần strict OpenAPI schema và interceptor làm schema thực tế khác schema khai báo.

### Tối ưu hoặc mở rộng

Nên thêm decorator để skip wrapper cho route đặc biệt:

```ts
@RawResponse()
@Get('export')
exportCsv() {}
```

Nên chuẩn hóa response shape rõ hơn:

```json
{
  "success": true,
  "message": "Success",
  "data": {},
  "meta": {}
}
```

Hiện một số service trả `{ physical_card: ... }`, `{ counts: ... }`, `{ message: ... }`. Có thể giữ nguyên nhưng nên document contract.

## 2.4. AllExceptionsFilter: Error Contract Và Observability

File:

- `nfc_b2_v2/src/common/filters/all_exceptions_filter.ts`

### Nó là gì

Filter bắt mọi exception, lấy HTTP status, set header `x-request-id`, log lỗi server, và trả JSON:

```json
{
  "requestId": "...",
  "statusCode": 500,
  "message": "Internal Server Error"
}
```

### Vì sao nó tốt

Nó tốt vì lỗi API có shape ổn định. Frontend `isApiError` đang kiểm tra `error.data.statusCode`, tức backend và frontend có contract rõ.

Request id là điểm rất đáng học:

- Backend log có `requestId`.
- Response trả `x-request-id`.
- User báo lỗi có thể gửi request id.
- Dev tìm log theo request id.

### Tốt trong trường hợp nào

Tốt khi:

- App chạy production và cần debug lỗi.
- Có centralized logging như Loki.
- Frontend cần parse error chung.
- Có nhiều exception source: validation, auth, Prisma, runtime error.

### Xấu trong trường hợp nào

Có thể xấu nếu:

- Filter expose quá nhiều details từ exception response.
- Validation error array không được format dễ đọc.
- Non-HTTP error bị trả generic quá mức trong staging, khó debug.
- Không map Prisma error cụ thể, ví dụ unique constraint, foreign key.

### Tối ưu hoặc mở rộng

Nên thêm:

- Error code nội bộ:

```json
{
  "statusCode": 409,
  "code": "EMAIL_ALREADY_REGISTERED",
  "message": "Email is already registered.",
  "requestId": "..."
}
```

- Prisma exception mapping:

```text
P2002 -> 409 Conflict
P2025 -> 404 Not Found
```

- Log warning cho 4xx quan trọng như auth brute force, permission denied.
- Không log full request body nếu có password/token.

## 2.5. Logging Với Pino Và Loki

File:

- `nfc_b2_v2/src/app.module.ts`

### Nó là gì

App dùng `nestjs-pino`, tạo request id bằng `randomUUID`, log ra stdout và optionally gửi Loki nếu có `LOKI_URL`.

### Vì sao nó tốt

Pino nhanh, phù hợp Node.js production. Loki giúp tập trung log nhiều instance. Label `app` và `environment` giúp query log theo môi trường.

### Tốt trong trường hợp nào

Tốt khi:

- Deploy Docker/Kubernetes.
- Cần tìm log theo request id.
- Có staging/production riêng.
- Cần audit lỗi theo endpoint.

### Xấu trong trường hợp nào

Rủi ro:

- Nếu log quá nhiều body/request data có thể lộ PII.
- Loki target lỗi có thể ảnh hưởng logging nếu config sai.
- Không có redaction password/token thì nguy hiểm.

### Tối ưu hoặc mở rộng

Nên thêm redaction:

```ts
redact: [
  'req.headers.authorization',
  'req.body.password',
  'req.body.refreshToken',
]
```

Nên thêm structured logs trong service quan trọng:

- Auth login failure count.
- Card import count.
- Thumbnail preview enqueue failure.
- Permission denied reason.

## 2.6. Prisma Schema: Domain Model Rõ

File:

- `nfc_b2_v2/prisma/schema.prisma`

### Nó là gì

Prisma schema định nghĩa database model:

```text
User
Company
Department
JobTitle
Role
Permission
UserRoleCompany
PhysicalCard
DigitalCard
CardTemplate
TemplateCategory
```

### Vì sao nó tốt

Schema thể hiện domain rõ ràng. Quan trọng nhất là `UserRoleCompany`, vì nó giải quyết bài toán multi-tenant role:

```text
User A có thể là SUPER_ADMIN toàn hệ thống
User B có thể là COMPANY_ADMIN ở Company 1
User C có thể là COMPANY_MANAGER ở Company 2
User D có thể là employee bình thường trong Company 1
```

Role không gắn trực tiếp trên `User`, mà gắn qua bảng nối với company optional. Đây là design tốt cho SaaS nhiều công ty.

### Tốt trong trường hợp nào

Tốt khi:

- Một user có thể thuộc nhiều company.
- Role của user thay đổi theo company.
- Permission cần theo resource/action/scope.
- App cần phân biệt system admin và company admin.

### Xấu trong trường hợp nào

Có thể phức tạp nếu:

- Product chỉ có một company duy nhất.
- Role chỉ có admin/user đơn giản.
- Query profile cần include quá nhiều relation.
- Permission thay đổi liên tục và cần policy engine phức tạp hơn.

### Tối ưu hoặc mở rộng

Nên cân nhắc:

- Unique constraint tránh duplicate role mapping:

```prisma
@@unique([user_id, company_id, role_id])
```

- Index cho các filter hay dùng:

```prisma
@@index([company_id])
@@index([role_id])
@@index([department_id])
```

- Nếu permission phức tạp, cân nhắc policy table hoặc CASL/Oso/OpenFGA.
- Nếu audit quan trọng, thêm bảng audit:

```text
AuditLog(id, actor_user_id, action, resource, resource_id, before, after, created_at)
```

## 2.7. RBAC Theo Scope: PermissionGuard

File:

- `nfc_b2_v2/src/common/guards/permission.guard.ts`

### Nó là gì

Guard đọc metadata từ `@RequirePermission(...)`, sau đó kiểm tra bảng `permission` theo:

- role ids của user
- scope
- action
- resource
- allowed = true

Scope có priority:

```text
SYSTEM_WISE = 3
COMPANY_WISE = 2
USER_WISE = 1
```

Nếu route yêu cầu `USER_WISE`, quyền `SYSTEM_WISE` hoặc `COMPANY_WISE` cũng pass.

### Vì sao nó tốt

Đây là điểm system design tốt nhất của backend. Nó tách permission khỏi business logic.

Controller chỉ khai báo:

```ts
@UseGuards(JwtAuthGuard, PermissionGuard)
@RequirePermission({
  scope: permission_scope.COMPANY_WISE,
  action: permission_action.UPDATE,
  resource: permission_resource.physical_cards,
})
```

Service không cần biết route đang yêu cầu permission nào. Điều này giảm duplicate logic.

### Tốt trong trường hợp nào

Tốt khi:

- Có nhiều role.
- Mỗi role có permission khác nhau.
- Permission cần chỉnh trong database/seed.
- Có route system-wide, company-wide, user-wise.
- Muốn kiểm tra permission nhất quán.

### Xấu trong trường hợp nào

Rủi ro:

- Guard chỉ kiểm tra "có quyền loại này", chưa chắc kiểm tra đúng company ownership.
- Nếu user có `COMPANY_WISE` ở Company A, cần đảm bảo không dùng được trên Company B.
- Query permission mỗi request có thể tốn nếu traffic cao.
- Permission table quá chi tiết có thể khó quản trị.

### Tối ưu hoặc mở rộng

Nên kết hợp PermissionGuard với access guard:

```text
PermissionGuard: user có quyền UPDATE physical_cards không?
CompanyAccessGuard/UserAccessGuard: user có quyền trên company/user cụ thể không?
```

Nên cache permission theo role:

```text
roleId -> permission matrix
```

Nên thêm test case:

- System admin pass company endpoint.
- Company admin Company A không pass Company B.
- User-wise không pass company-wise endpoint.
- Role không permission bị 403.

## 2.8. CompanyAccessGuard Và Multi-Tenancy Boundary

File:

- `nfc_b2_v2/src/common/guards/company-access.guard.ts`

### Nó là gì

Guard lấy `companyId` từ route param, rồi kiểm tra user có access company đó không. Super admin pass. Company admin/manager pass nếu role thuộc company đó.

### Vì sao nó tốt

Permission và ownership là hai chuyện khác nhau:

- Permission: user có loại quyền gì?
- Ownership/access: quyền đó áp dụng cho record nào?

Tách hai lớp này giúp tránh lỗi nghiêm trọng: user có quyền company admin nhưng thao tác nhầm sang company khác.

### Tốt trong trường hợp nào

Tốt khi:

- Multi-tenant SaaS.
- Route có `companyId`.
- Admin công ty chỉ được quản lý công ty của mình.
- Super admin có thể xem toàn hệ thống.

### Xấu trong trường hợp nào

Rủi ro:

- Guard phụ thuộc route param tên `companyId`. Nếu route dùng `id` hoặc `company_id`, guard không hoạt động đúng.
- Với resource không có `companyId` trực tiếp trong param, ví dụ `cardId`, guard cần load card để biết company.
- Nếu route nested phức tạp, guard logic có thể lan rộng.

### Tối ưu hoặc mở rộng

Nên tạo decorator cấu hình param:

```ts
@CompanyScoped({ param: 'companyId' })
```

Hoặc với resource:

```ts
@ResourceCompanyScoped({
  resource: 'physicalCard',
  idParam: 'cardId',
})
```

Nên chuẩn hóa route luôn dùng `:companyId` khi route company-scoped.

## 2.9. AuthService: Token Lifecycle Và Email Flow

File:

- `nfc_b2_v2/src/modules/auth/auth.service.ts`

### Nó là gì

AuthService xử lý:

- validate email/password bằng bcrypt
- register pending user
- gửi OTP verify email
- verify OTP và activate account
- login trả token pair
- refresh token
- forgot/reset password
- setup password invitation
- preferred language

### Vì sao nó tốt

Controller rất mỏng, còn business flow nằm trong service. Điều này đúng với NestJS style.

Auth flow cũng tránh leak thông tin ở forgot password:

```text
Nếu email không tồn tại, vẫn trả generic success.
```

Đây là security design tốt vì không cho attacker enumerate email.

Token payload có `tokenType: 'access' | 'refresh'`, giúp backend reject refresh endpoint nếu user gửi access token.

### Tốt trong trường hợp nào

Tốt khi:

- App cần email verification.
- App cần invite/setup password cho employee.
- App cần refresh token.
- App đa ngôn ngữ email/message.
- User có role/context trong JWT.

### Xấu trong trường hợp nào

Rủi ro:

- Refresh token nếu không lưu server-side thì không revoke từng token được.
- JWT chứa role snapshot có thể stale nếu role đổi nhưng access token chưa hết hạn.
- OTP lưu plain text trong DB có thể không tối ưu bảo mật.
- AuthService có thể lớn dần vì chứa nhiều flow.

### Tối ưu hoặc mở rộng

Nên cân nhắc:

- Hash OTP trước khi lưu DB.
- Lưu refresh token family/session để revoke khi logout.
- Rotate refresh token và detect reuse.
- Tách service:

```text
AuthCredentialService
OtpService
TokenService
PasswordResetService
InvitationService
```

- Thêm rate limit:

```text
/auth/login
/auth/register
/auth/password/forgot
/auth/register/verify
```

- Thêm audit log auth events.

## 2.10. DatabaseService: Repository Facade Trên Prisma

File:

- `nfc_b2_v2/src/shared/database/database.service.ts`

### Nó là gì

DatabaseService wrap Prisma client và expose helper như:

- `findUserByEmail`
- `findUserById`
- `createUser`
- `updateUser`
- `listPhysicalCards`
- `countPhysicalCards`
- `createDigitalCard`

Nó cũng expose raw client qua:

```ts
get client(): PrismaService
```

### Vì sao nó tốt

Nó giúp controller/service không import Prisma trực tiếp. Nếu include shape thay đổi, có thể sửa ở DatabaseService.

Ví dụ `userWithRolesInclude` dùng chung giúp AuthService luôn nhận user kèm roles/company/department/job title.

### Tốt trong trường hợp nào

Tốt khi:

- Muốn tập trung query logic.
- App còn vừa phải, chưa cần repository riêng từng aggregate.
- Cần type alias cho Prisma payload.
- Muốn handle Prisma unique constraint ở một chỗ.

### Xấu trong trường hợp nào

Rủi ro:

- File có thể phình rất lớn vì mọi query dồn vào một service.
- `get client()` làm các service bypass abstraction.
- Một service chung cho mọi domain có thể thành god service.
- Khó unit test domain nếu query logic lẫn lộn.

### Tối ưu hoặc mở rộng

Khi code lớn hơn, nên tách repository theo domain:

```text
shared/database/repositories/
├── user.repository.ts
├── company.repository.ts
├── physical-card.repository.ts
├── digital-card.repository.ts
└── permission.repository.ts
```

Hoặc đặt repository trong từng module:

```text
modules/physical-card/
├── physical-card.repository.ts
├── physical-card.service.ts
└── physical-card.controller.ts
```

Nên hạn chế raw `client` bằng cách thêm helper explicit cho query permission.

## 2.11. PhysicalCard Domain: Workflow Không Chỉ CRUD

Files:

- `nfc_b2_v2/src/modules/physical-card/physical-card.controller.ts`
- `nfc_b2_v2/src/modules/physical-card/physical-card.service.ts`
- `nfc_b2_v2/prisma/schema.prisma`

### Nó là gì

Physical card có lifecycle:

```text
INSTOCK
ASSIGNED
ACTIVE
LOST
BLOCKED
RETIRED
```

Các action:

- list system-wide
- list by company
- stats by status
- create card
- import CSV/XLSX
- update card
- assign to company
- revoke from company
- assign to user
- revoke from user
- bulk assign
- attach/detach digital card

### Vì sao nó tốt

Đây là ví dụ domain workflow thực tế. Service không chỉ `create/read/update/delete`, mà encode nghiệp vụ:

- thẻ có thể thuộc company
- thẻ có thể thuộc user
- thẻ có thể link digital card
- import có giới hạn `MAX_IMPORT_RECORDS`
- import normalize column name
- image upload qua storage
- permission khác nhau cho system/company/user

### Tốt trong trường hợp nào

Tốt khi:

- Sản phẩm quản lý asset vật lý.
- Cần assign/revoke asset.
- Cần import hàng loạt.
- Cần status dashboard.
- Cần phân quyền theo vai trò.

### Xấu trong trường hợp nào

Rủi ro:

- Service quá dài, nhiều private helper.
- Status transition chưa được formal hóa, có thể update status không hợp lệ.
- Import file sync parse có thể tốn CPU nếu file lớn.
- Bulk operation cần transaction để tránh update một nửa.

### Tối ưu hoặc mở rộng

Nên thêm state machine cho status:

```text
INSTOCK -> ASSIGNED
ASSIGNED -> ACTIVE
ACTIVE -> LOST/BLOCKED
LOST -> RETIRED
BLOCKED -> ACTIVE/RETIRED
```

Nên validate transition:

```ts
canTransition(from, to)
```

Nên dùng transaction cho bulk assign/import:

```ts
await prisma.$transaction([...])
```

Nên đưa import vào background job nếu file lớn:

```text
POST /physical-cards/import -> returns jobId
GET /import-jobs/:jobId -> progress/result
```

Nên thêm idempotency key cho import để tránh user upload lại file tạo duplicate.

## 2.12. DigitalCard Domain Và Preview Queue

Files:

- `nfc_b2_v2/src/modules/digital-card/digital-card.service.ts`
- `nfc_b2_v2/src/modules/digital-card/digital-card-preview-queue.service.ts`

### Nó là gì

Digital card lưu:

- `design_html`
- `design_css`
- `thumbnail_image_url`
- owner là user hoặc company
- optional template

Khi tạo hoặc sửa design, service enqueue thumbnail preview request.

### Vì sao nó tốt

Generate thumbnail có thể chậm. Nếu request tạo/sửa card phải đợi render preview, UX sẽ kém và API dễ timeout. Queue side-effect giúp request chính nhanh hơn.

Pattern này tốt:

```ts
void this.previewQueue.enqueueThumbnailRequest(...)
```

Nó nói rõ "side effect này không block response".

### Tốt trong trường hợp nào

Tốt khi:

- Task phụ có thể chạy async.
- Preview/image generation chậm.
- Failure preview không nên rollback card creation.
- Có SQS hoặc background worker.

### Xấu trong trường hợp nào

Rủi ro:

- Nếu enqueue fail silently, card tạo xong nhưng không có thumbnail.
- Nếu user cần thumbnail ngay, async có thể gây trạng thái pending.
- Nếu queue duplicate nhiều, worker tốn tài nguyên.

### Tối ưu hoặc mở rộng

Nên thêm field:

```text
thumbnail_status: PENDING | READY | FAILED
thumbnail_error: string?
thumbnail_requested_at
```

Nên retry queue có backoff.

Nên debounce nếu user save design liên tục.

Nên version design:

```text
design_version
thumbnail_version
```

Worker chỉ update thumbnail nếu version còn mới, tránh race condition.

## 2.13. DTO Và Validation

Files:

- `nfc_b2_v2/src/modules/**/dto/*.ts`

### Nó là gì

DTO định nghĩa input của API. Global ValidationPipe enforce DTO.

### Vì sao nó tốt

DTO là API boundary. Nó giúp:

- validate field bắt buộc
- validate enum
- transform query
- tự sinh Swagger schema tốt hơn
- reject field lạ

### Tốt trong trường hợp nào

Tốt gần như mọi REST API.

### Xấu trong trường hợp nào

Rủi ro:

- DTO trùng lặp quá nhiều giữa create/update.
- DTO không match frontend type.
- Validation message không consistent i18n.

### Tối ưu hoặc mở rộng

Nên dùng mapped types:

```ts
PartialType(CreateCompanyDto)
PickType(...)
OmitType(...)
```

Nên cân nhắc generate frontend API types từ OpenAPI để giảm drift.

## 2.14. E2E Tests

Folder:

- `nfc_b2_v2/test`

### Nó là gì

Backend có E2E tests cho:

- auth
- user
- company
- physical card
- digital card
- digital card template
- template category

### Vì sao nó tốt

E2E test qua HTTP thật kiểm tra được:

- controller route
- guard
- pipe
- filter/interceptor
- service
- database/mock context
- response shape

Ví dụ auth e2e test cover login, refresh, register, OTP, reset password. Đây là loại test bắt bug tốt hơn unit test nhỏ khi thay đổi auth flow.

### Tốt trong trường hợp nào

Tốt khi:

- API contract quan trọng.
- Có nhiều guard/permission.
- Flow nhiều bước như register/verify/reset.
- Frontend phụ thuộc response shape.

### Xấu trong trường hợp nào

Rủi ro:

- E2E test chậm.
- Setup test data phức tạp.
- Nếu test dùng mock quá nhiều thì không còn giống production.
- Nếu test phụ thuộc order, dễ flaky.

### Tối ưu hoặc mở rộng

Nên thêm test permission matrix:

```text
SUPER_ADMIN can manage all companies
COMPANY_ADMIN can manage own company
COMPANY_ADMIN cannot manage other company
USER cannot call company admin endpoints
```

Nên thêm contract tests so sánh frontend endpoint với backend route.

