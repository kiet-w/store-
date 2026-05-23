# Tài liệu Kỹ thuật: Hệ thống Kiểm thử E2E (End-to-End)

Tài liệu này giải thích kiến trúc và triết lý kiểm thử E2E trong dự án NestJS E-commerce, tập trung vào cách chúng ta đảm bảo luồng nghiệp vụ hoạt động chính xác từ tầng API đến Database.

## 1. Triết lý Kiểm thử (The Testing Mindset)

Trong một hệ thống Enterprise, Unit Test là chưa đủ. Kiểm thử E2E (End-to-End) đóng vai trò là "chốt chặn cuối cùng" vì nó xác thực sự phối hợp của toàn bộ hệ thống:

*   **Auth -> Guard:** Đảm bảo Middleware và Decorator bảo mật hoạt động (Cookie có được gửi đi không? Guard có chặn đúng Role không?).
*   **Logic -> Service:** Xác nhận các Business Logic phức tạp (tính toán giá, kiểm tra tồn kho) hoạt động chính xác.
*   **Prisma -> Database:** Kiểm tra các hiệu ứng phụ (side-effects) trên dữ liệu thực tế.
*   **Redis Integration:** Xác thực việc quản lý session hoặc caching (nếu có).

### Phân biệt `request(app)` và `request.agent(app)`
Đây là điểm mấu chốt trong kiểm thử ứng dụng sử dụng Cookie:
*   **`request(app)`:** Sử dụng cho các request đơn lẻ, không trạng thái. Mỗi lần gọi là một phiên làm việc mới.
*   **`request.agent(app)`:** Tạo ra một "tác nhân" có khả năng lưu trữ Cookie. Khi bạn đăng nhập bằng agent, các request sau đó của agent này sẽ tự động đính kèm Cookie `access_token`, giúp giả lập hành vi trình duyệt của người dùng thực tế.

---

## 2. Giải mã 'Xương sống' e2e-helpers.ts

File `test/e2e-helpers.ts` chứa các công cụ giúp viết test nhanh và sạch hơn.

### Authentication Helpers
Chúng ta không lặp lại logic đăng nhập trong từng bản test. Thay vào đó, sử dụng:
*   `loginAsCustomer(app)`: Trả về một `agent` đã đăng nhập với quyền Customer.
*   `loginAsAdmin(app)`: Trả về một `agent` đã đăng nhập với quyền Admin.
*   `expectLoginCookies(...)`: Dùng để kiểm tra xem API login có trả về đúng các header `set-cookie` hay không.

### State Cleanup (Làm sạch trạng thái)
Để đảm bảo tính độc lập giữa các test case (Test Isolation), chúng ta cần xóa sạch dữ liệu rác sau mỗi lần chạy:
*   **`resetCustomerState(prisma)`**: Xóa toàn bộ đơn hàng (Orders), giỏ hàng (Carts) và Token cũ của khách hàng test. 
*   **Tại sao quan trọng?** Nếu Test A tạo một đơn hàng mà không xóa, Test B (kiểm tra giỏ hàng trống) có thể bị thất bại do dữ liệu từ Test A còn sót lại.

### Scenario Building (Xây dựng kịch bản)
Thay vì viết 20 dòng code để tạo một đơn hàng nhằm kiểm tra tính năng "Hủy đơn", chúng ta sử dụng các hàm kịch bản:
*   `createCheckoutOrderForCustomer(app, prisma)`: Tự động thực hiện chuỗi hành động: Reset state -> Thêm sản phẩm vào giỏ -> Thực hiện checkout.

---

## 3. Kỹ thuật Xác minh Database (Side-effect Verification)

Một bài test E2E tốt không chỉ kiểm tra mã trạng thái HTTP (200, 201), mà còn phải kiểm tra dữ liệu trong Database.

Chúng ta sử dụng `PrismaService` trực tiếp trong các bản test để:
1.  **Chuẩn bị dữ liệu (Setup):** Ép tồn kho sản phẩm về 0 để test lỗi "Hết hàng" (`setProductStock`).
2.  **Xác minh kết quả (Verify):** Sau khi Checkout thành công, truy vấn Database để kiểm tra xem `stock` của sản phẩm có bị giảm đi đúng số lượng hay không.

```typescript
// Ví dụ minh họa trong test
await setProductStock(prisma, 'iphone-15', 10);
// ... thực hiện mua 2 sản phẩm ...
const product = await getSeedProduct(prisma, 'iphone-15');
expect(product.stock).toBe(8); // Kiểm tra stock đã trừ trong DB
```

---

## 4. Cấu trúc một bản Test E2E tiêu chuẩn

Mọi file `.e2e-spec.ts` nên tuân thủ cấu trúc sau để đảm bảo hiệu năng và tính ổn định.

### Vai trò của `e2e-app.ts`
File này cung cấp hàm `createE2EApp()` giúp khởi tạo ứng dụng NestJS đồng nhất với môi trường Production (cùng ValidationPipe, Filters, và Middleware). Điều này đảm bảo "test sao, chạy vậy".

### Tổ chức Describe/It
```typescript
describe('Tên Module E2E', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    // Khởi tạo app 1 lần duy nhất cho toàn bộ file để tăng tốc độ
    const setup = await createE2EApp();
    app = setup.app;
    prisma = setup.prisma;
  });

  beforeEach(async () => {
    // Reset dữ liệu trước MỖI test case
    await resetCustomerState(prisma);
  });

  afterAll(async () => {
    // Đóng app để giải phóng bộ nhớ
    await closeE2EApp(app);
  });

  it('mô tả kịch bản test', async () => {
    // 1. Arrange (Chuẩn bị)
    // 2. Act (Thực hiện)
    // 3. Assert (Xác nhận)
  });
});
```

---

## 5. Tips & Tricks

*   **Chạy một test duy nhất:** Sử dụng `npm run test:e2e -- <file-name>` hoặc thêm `.only` vào `it.only(...)` để tập trung debug một kịch bản.
*   **Đọc Logs:** Nếu test thất bại với lỗi 500, hãy kiểm tra console. `AllExceptionsFilter` trong môi trường test được cấu hình để log chi tiết lỗi ra terminal.
*   **Thứ tự chạy:** E2E test thường tốn thời gian. Hãy tận dụng `beforeAll` để khởi tạo app và `beforeEach` để dọn dẹp data thay vì khởi tạo lại app liên tục.
*   **Database Test:** Đảm bảo bạn đang chạy test trên một database riêng (thường là shadow database hoặc test container) để không ảnh hưởng đến dữ liệu phát triển.
