# NFC Codebase Learning Guide

## 3. Frontend Architecture

## 3.1. Frontend Stack

Frontend nằm ở:

- `nfc_front_end`

Stack chính:

- React 19
- Vite
- React Router
- Redux Toolkit
- RTK Query
- redux-persist
- React Hook Form
- Zod
- i18next
- Tailwind CSS
- Radix/shadcn-style components
- Storybook
- GrapesJS

### Vì sao stack này tốt

Stack này phù hợp dashboard/business app:

- Vite build/dev nhanh.
- RTK Query xử lý server state tốt.
- Redux persist giữ auth/session.
- Zod + React Hook Form tốt cho form nhiều rule.
- Radix/shadcn tốt cho accessible UI primitives.
- Storybook tốt để phát triển component độc lập.
- GrapesJS tốt cho visual editor phức tạp.

### Khi nào stack này xấu

Có thể xấu nếu:

- App rất nhỏ, Redux/RTK Query hơi nặng.
- Team chưa quen Redux Toolkit.
- GrapesJS customize quá sâu, dễ thành hệ thống khó maintain.
- Storybook nhiều nhưng không được review/update, sẽ thành stale docs.

### Tối ưu hoặc mở rộng

Nên:

- Generate API hooks/types từ OpenAPI nếu backend Swagger ổn.
- Thêm test cho components quan trọng bằng Storybook/Vitest.
- Thêm Playwright E2E cho auth và card flows.
- Chuẩn hóa route constants để tránh hard-code path.

## 3.2. API Layer Trung Tâm Bằng RTK Query

File:

- `nfc_front_end/src/redux/apiSlice.ts`

### Nó là gì

`apiSlice` là base API service. Các domain slice inject endpoints vào:

- `authApiSlice`
- `companyApiSlice`
- `physicalCardApiSlice`
- `digitalCardApiSlice`
- `userApiSlice`
- `departmentApiSlice`
- `jobTitleApiSlice`

### Vì sao nó tốt

Mọi request đi qua một nơi:

- base URL
- auth header
- accept-language header
- params serializer
- error normalization
- token refresh
- cache tags

Khi muốn sửa auth header hoặc refresh token flow, sửa một file.

### Tốt trong trường hợp nào

Tốt khi:

- App có nhiều endpoint.
- Server state nhiều và cần cache.
- Nhiều page dùng cùng data.
- Cần invalidation sau mutation.
- Cần refresh token tự động.

### Xấu trong trường hợp nào

Rủi ro:

- Nếu baseQuery phức tạp quá, mọi API bug đều tập trung một chỗ.
- Nếu response backend không thống nhất, transform/error handling dễ vỡ.
- RTK Query cache invalidation sai có thể làm UI stale hoặc refetch quá nhiều.

### Tối ưu hoặc mở rộng

Nên thêm:

- Type-safe endpoint paths.
- OpenAPI codegen.
- Centralized API error code handling.
- Retry policy cho network error.
- `refetchOnReconnect` cho dashboard data.

## 3.3. Refresh Token Flow Với Mutex

File:

- `nfc_front_end/src/redux/apiSlice.ts`

### Nó là gì

Khi request bị 401:

1. Nếu request là `/auth/login`, trả lỗi luôn.
2. Nếu request khác và mutex đang lock, chờ refresh xong rồi retry.
3. Nếu mutex chưa lock, acquire lock.
4. Gọi `/auth/refresh`.
5. Nếu có access token mới, update store và retry request gốc.
6. Nếu refresh fail, reset auth state.

### Vì sao nó tốt

Không có mutex, khi 10 request cùng bị 401, frontend sẽ gọi 10 request refresh. Điều này gây:

- race condition token
- server load tăng
- refresh token rotation lỗi
- request retry lộn xộn

Mutex đảm bảo chỉ một refresh chạy cùng lúc.

### Tốt trong trường hợp nào

Tốt khi:

- SPA gọi nhiều API song song.
- Access token ngắn hạn.
- Refresh token dùng chung trong app.
- Dashboard có nhiều widget query.

### Xấu trong trường hợp nào

Rủi ro:

- Nếu refresh request treo, các request khác chờ lâu.
- Nếu API có nhiều auth context, một mutex global có thể block không cần thiết.
- Nếu logout xảy ra khi refresh đang chạy, state có thể bị update lại nếu không guard.

### Tối ưu hoặc mở rộng

Nên thêm:

- Timeout cho refresh.
- Check auth state sau refresh trước khi retry.
- Queue cancellation khi user logout.
- Token expiry proactive refresh trước khi request.

## 3.4. Params Serializer Và Backend Query Parser

Frontend:

- `nfc_front_end/src/redux/apiSlice.ts`

Backend:

- `nfc_b2_v2/src/main.ts`

### Nó là gì

Frontend serialize array:

```text
status[]=ACTIVE&status[]=INACTIVE
```

Backend dùng:

```ts
app.set('query parser', 'extended')
```

để parse dạng query phức tạp.

### Vì sao nó tốt

Đây là một full-stack contract nhỏ nhưng quan trọng. Nếu frontend gửi array mà backend parser không hiểu, filter sẽ sai.

### Tốt trong trường hợp nào

Tốt khi:

- List API có filter multi-select.
- Query param có object/array.
- Backend NestJS cần nhận array trong DTO.

### Xấu trong trường hợp nào

Rủi ro hiện tại:

```ts
if (!value) continue;
```

Dòng này bỏ qua `0` và `false`. Nếu API cần gửi:

```text
page=0
active=false
count=0
```

thì sẽ mất param.

### Tối ưu hoặc mở rộng

Nên đổi check thành:

```ts
if (value === undefined || value === null || value === '') {
  continue;
}
```

Và nếu array có number/boolean, convert rõ:

```ts
searchParams.append(`${key}[]`, String(item));
```

## 3.5. Domain API Slices Và Cache Tags

Files:

- `nfc_front_end/src/redux/auth/authApiSlice.ts`
- `nfc_front_end/src/redux/companies/companyApiSlice.ts`
- `nfc_front_end/src/redux/physicalCards/physicalCardApiSlice.ts`
- `nfc_front_end/src/utils/api.ts`

### Nó là gì

Mỗi domain định nghĩa endpoint riêng bằng `apiSlice.injectEndpoints`.

Cache tag pattern:

```text
LIST tag
detail id tag
special STATS tag
```

### Vì sao nó tốt

Khi mutation update physical card, chỉ invalidates tags liên quan. UI list/stats tự refetch đúng chỗ.

Ví dụ physical cards có `STATS` tag riêng. Đây là pattern hay vì stats không nhất thiết là một card cụ thể.

### Tốt trong trường hợp nào

Tốt khi:

- List/detail cùng tồn tại.
- Mutation ảnh hưởng nhiều view.
- Dashboard có stats.
- Data được dùng lại ở nhiều page.

### Xấu trong trường hợp nào

Rủi ro:

- Invalidate list quá rộng gây refetch nhiều.
- Invalidate detail nhưng quên list làm table stale.
- Tag naming không nhất quán.
- Không phân biệt company-scoped list và system-wide list, có thể refetch thừa.

### Tối ưu hoặc mở rộng

Nên tạo tag key có scope:

```text
PhysicalCards-LIST-system
PhysicalCards-LIST-company-123
PhysicalCards-STATS-system
PhysicalCards-STATS-company-123
```

Hoặc dùng `listWithKeys`:

```ts
listWithKeys({ companyId, page, status })
```

Cần cẩn thận vì tag quá chi tiết có thể làm invalidation thiếu.

## 3.6. Redux Persist: Persist Ít Nhưng Đúng

File:

- `nfc_front_end/src/redux/store.ts`

### Nó là gì

App persist:

- auth: `isAuthenticated`, `tokens`, `user`, `currentContext`
- businessCard: `hasSeenGuide`, `totalSteps`

Không persist RTK Query cache.

### Vì sao nó tốt

Auth cần sống qua reload. Server data không nên persist tùy tiện vì dễ stale. Đây là decision tốt.

### Tốt trong trường hợp nào

Tốt khi:

- SPA cần giữ login session.
- Some UI onboarding state cần persist.
- Server data có thể refetch nhanh.

### Xấu trong trường hợp nào

Rủi ro:

- Token trong localStorage/session storage dễ bị ảnh hưởng bởi XSS.
- Persist user roles có thể stale nếu role bị đổi.
- `isAuthenticated` persist true nhưng token hết hạn, cần protected route kiểm tra lại profile.

### Tối ưu hoặc mở rộng

Nên:

- Rehydrate xong gọi `getProfile`.
- Nếu profile fail 401, reset auth.
- Cân nhắc refresh token httpOnly cookie thay vì localStorage.
- Lưu access token in-memory nếu security yêu cầu cao hơn.

## 3.7. Route Structure Và Protected Layout

Files:

- `nfc_front_end/src/router/router.tsx`
- `nfc_front_end/src/guards/ProtectedRoute.tsx`
- `nfc_front_end/src/hooks/useProtectedRoute.ts`

### Nó là gì

Public routes:

```text
/
/register
/login
/forgot-password
/auth/set-password
```

Private routes được bọc bởi:

```tsx
<ProtectedRoute>
  <DashboardLayout>
    <Outlet />
  </DashboardLayout>
</ProtectedRoute>
```

### Vì sao nó tốt

Protected boundary nằm ở route tree, không phải từng page. Mọi dashboard page tự động cần auth.

Lazy loading page giúp giảm bundle ban đầu.

### Tốt trong trường hợp nào

Tốt khi:

- App có public marketing/auth pages và private dashboard.
- Dashboard pages nhiều.
- Muốn chung layout sidebar/header/footer.

### Xấu trong trường hợp nào

Rủi ro:

- `ProtectedRoute` hiện có prop `requiredRole` nhưng chưa dùng.
- Nếu chỉ check `isAuthenticated` từ persisted state, user có thể thấy private shell trước khi token được verify.
- Route path hard-code nhiều nơi dễ drift.

### Tối ưu hoặc mở rộng

Nên thêm:

- `AuthBootstrap` hoặc `RequireAuth` gọi profile check sau rehydrate.
- Role-aware route:

```tsx
<ProtectedRoute requiredPermissions={['companies:READ']}>
```

- Route constants:

```ts
export const ROUTES = {
  dashboard: '/dashboard',
  companyManagement: '/company-management',
}
```

- NotFound route.
- Unauthorized route.

## 3.8. DashboardLayout Và Context-Aware Navigation

File:

- `nfc_front_end/src/components/organisms/layout/DashboardLayout.tsx`

### Nó là gì

Sidebar items được build theo `currentContext`:

- super admin thấy users/company management.
- company context thấy employee/company department.
- user context thấy personal info/my cards.

### Vì sao nó tốt

Navigation phản ánh permission/context, giúp UX sạch hơn. User không thấy menu không liên quan.

### Tốt trong trường hợp nào

Tốt khi:

- Một user có nhiều context.
- Super admin/company admin/user dùng chung dashboard.
- Menu phụ thuộc role.

### Xấu trong trường hợp nào

Rủi ro:

- Ẩn menu không phải security. Backend vẫn phải guard.
- Nếu `currentContext` stale, menu sai.
- Sidebar logic trong component có thể phình lớn.

### Tối ưu hoặc mở rộng

Nên tách navigation config:

```text
src/router/navigation.ts
```

Mỗi item có:

```ts
{
  labelKey,
  href,
  icon,
  requiredContext,
  requiredPermission,
}
```

Sau đó filter bằng helper. Điều này dễ test hơn.

## 3.9. Design System: Atoms, Molecules, Organisms, Templates

Folders:

- `src/components/atoms`
- `src/components/molecules`
- `src/components/organisms`
- `src/components/templates`
- `src/pages`

### Nó là gì

Frontend dùng cấu trúc gần atomic design:

```text
atoms       # primitive UI: Button, Input, Modal
molecules   # composed small UI: SearchGroup, StatisticCard
organisms   # feature blocks: CompanyTable, PhysicalCardList
templates   # page-level composition
pages       # route entry
```

### Vì sao nó tốt

Nó giúp component reuse theo tầng. Button/Input không biết nghiệp vụ. Organism biết nghiệp vụ hơn. Page chủ yếu nối route với template.

Storybook stories nhiều component là điểm rất tốt để học UI system.

### Tốt trong trường hợp nào

Tốt khi:

- App dashboard có nhiều màn hình giống nhau.
- Team design/frontend cần reusable components.
- Muốn develop UI độc lập bằng Storybook.

### Xấu trong trường hợp nào

Rủi ro:

- Atomic design quá cứng có thể gây tranh cãi file đặt ở đâu.
- Component bị over-abstract.
- Storybook stories stale nếu không chạy trong CI.
- Nếu organism chứa quá nhiều business logic, khó test.

### Tối ưu hoặc mở rộng

Nên:

- Dùng feature folders cho logic nghiệp vụ lớn:

```text
features/physical-cards/
├── components/
├── hooks/
├── api.ts
└── types.ts
```

- Giữ `components/atoms` cho UI primitive thật sự global.
- Storybook CI hoặc Chromatic.
- Add accessibility tests cho component critical.

## 3.10. Form Validation Với Zod

Folder:

- `nfc_front_end/src/validation`

Ví dụ:

- `auth.schema.ts`

### Nó là gì

Frontend dùng Zod schema cho form validation. Ví dụ đổi password yêu cầu:

- oldPassword không rỗng
- newPassword ít nhất 8 ký tự
- có chữ hoa, chữ thường, số, ký tự đặc biệt
- confirm password match

### Vì sao nó tốt

Zod schema là single source cho form rule ở frontend. Kết hợp React Hook Form tốt vì:

- validate trước khi gọi API
- message rõ cho user
- infer TypeScript type từ schema

### Tốt trong trường hợp nào

Tốt khi:

- Form nhiều rule.
- Cần type-safe form data.
- UI cần show validation instant.

### Xấu trong trường hợp nào

Rủi ro:

- Backend rule và frontend rule drift.
- Message hard-code tiếng Việt trong schema, khó i18n nếu app đổi language dynamic.
- Regex password quá nghiêm có thể giảm UX nếu policy không cần.

### Tối ưu hoặc mở rộng

Nên:

- Dùng i18n keys thay vì message hard-code.
- Generate hoặc share validation schema nếu backend dùng compatible schema.
- Backend vẫn phải validate đầy đủ, frontend validation chỉ là UX.

## 3.11. GrapesJS Digital Card Editor

File:

- `nfc_front_end/src/components/molecules/digital-card-editor/PageEditor.tsx`

### Nó là gì

Frontend dùng GrapesJS để build visual editor cho digital card. Code customize:

- thêm block div
- chỉnh text trait chọn tag h1/h2/h3/p/span
- custom style manager sectors
- chỉnh panel buttons
- thêm preview event listeners
- local autosave
- asset embed base64

### Vì sao nó tốt

Không tự viết visual editor từ đầu là quyết định đúng. Editor kéo thả, style manager, traits, blocks, canvas, asset manager là hệ thống lớn. GrapesJS cung cấp nền tảng mạnh.

### Tốt trong trường hợp nào

Tốt khi:

- User cần thiết kế HTML/CSS linh hoạt.
- Template có thể chỉnh kéo thả.
- App cần export/save design HTML/CSS.
- Team không đủ thời gian build editor engine riêng.

### Xấu trong trường hợp nào

Rủi ro:

- GrapesJS customization sâu có thể khó maintain.
- `allowScripts: true` có nguy cơ XSS nếu HTML render public.
- `localStorage.clear()` khi clear canvas có thể xóa nhầm data khác của app.
- `assetManager.embedAsBase64` làm design payload lớn.
- Autosave local có thể conflict với server save.

### Tối ưu hoặc mở rộng

Nên:

- Sandbox preview iframe.
- Sanitize HTML/CSS server-side trước khi public render.
- Không dùng `localStorage.clear()`, chỉ clear key của GrapesJS.
- Lưu design version trên server.
- Thêm autosave draft API:

```text
PATCH /digital-cards/:id/draft
POST /digital-cards/:id/publish
```

- Thêm template validation:

```text
HTML size limit
CSS size limit
disallow script tags
disallow external JS
allowlist CSS properties nếu cần
```

