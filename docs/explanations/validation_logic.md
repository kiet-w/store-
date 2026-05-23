# Cơ Chế Xác Thực và Chuẩn Hóa Dữ Liệu: Validation & Exception Handling

Tài liệu này giải thích chi tiết cách hệ thống NestJS của chúng ta kiểm soát chất lượng dữ liệu đầu vào (Input Validation) và cách xử lý lỗi tập trung (Centralized Exception Handling) để đảm bảo tính an toàn, nhất quán và cung cấp trải nghiệm tốt nhất cho người dùng/frontend.

---

## 1. Global ValidationPipe: Lá Chắn Dữ Liệu Toàn Cục

Trong `src/main.ts`, chúng ta cấu hình `ValidationPipe` chạy trên toàn bộ ứng dụng. Đây là bộ lọc đầu tiên mà mọi yêu cầu (Request) phải đi qua trước khi chạm đến logic nghiệp vụ trong Controller.

### 1.1. Giải Mã 3 Flag Cấu Hình Trọng Yếu

```typescript
app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true,
    transform: true,
    forbidNonWhitelisted: true,
  }),
);
```

- **`whitelist: true` (Danh sách trắng)**:
  - **Cơ chế**: Tự động loại bỏ tất cả các thuộc tính không được định nghĩa trong class DTO (Data Transfer Object).
  - **Lợi ích**: Ngăn chặn tấn công **Mass Assignment**. Ví dụ: Kẻ xấu cố tình gửi thêm trường `role: 'admin'` khi đăng ký tài khoản, `ValidationPipe` sẽ lọc bỏ trường này vì nó không tồn tại trong `RegisterDto`.

- **`forbidNonWhitelisted: true` (Cấm trường lạ)**:
  - **Cơ chế**: Thay vì chỉ âm thầm loại bỏ các trường thừa (như `whitelist`), flag này sẽ **ném ra một lỗi (Exception)** nếu phát hiện bất kỳ trường nào không có trong DTO.
  - **Lợi ích**: Ép buộc phía Frontend/Client phải tuân thủ nghiêm ngặt API Contract. Điều này giúp phát hiện sớm các lỗi typo hoặc gửi nhầm dữ liệu từ phía Client.

- **`transform: true` (Tự động chuyển đổi)**:
  - **Cơ chế**: 
    1. Chuyển đổi Plain Object từ Request Body thành một Instance của class DTO tương ứng.
    2. Tự động chuyển đổi kiểu dữ liệu cơ bản (Primitive types). Ví dụ: Một tham số trên URL (Query/Param) luôn là `string`, nhưng nếu DTO định nghĩa kiểu `number`, NestJS sẽ tự động ép kiểu cho bạn.
  - **Lợi ích**: Giảm thiểu mã nguồn thủ công để ép kiểu (như `parseInt`) và cho phép sử dụng các phương thức của class DTO nếu cần.

---

## 2. DTO & class-validator: Định Nghĩa Quy Tắc Dữ Liệu

Chúng ta sử dụng class kết hợp với các decorators từ thư viện `class-validator` để định nghĩa các quy tắc kiểm tra dữ liệu một cách trực quan và mạnh mẽ.

### Ví dụ: `src/auth/dto/register.dto.ts`

```typescript
export class RegisterDto {
  @IsEmail({}, { message: 'Email không hợp lệ' })
  @IsNotEmpty({ message: 'Email không được để trống' })
  email!: string;

  @MinLength(6, { message: 'Mật khẩu phải có ít nhất 6 ký tự' })
  password!: string;
}
```

- **Tính Declarative (Khai báo)**: Thay vì viết các câu lệnh `if-else` phức tạp, chúng ta chỉ cần gắn nhãn (decorator) cho thuộc tính.
- **Custom Messages**: Chúng ta có thể dễ dàng cấu hình thông báo lỗi bằng tiếng Việt để trả về trực tiếp cho Frontend hiển thị cho người dùng.
- **Phạm vi bảo vệ**: Kiểm tra từ kiểu dữ liệu (`@IsString`), định dạng (`@IsEmail`, `@IsEnum`) cho đến logic độ dài (`@MinLength`, `@MaxLength`).

---

## 3. Standardized Errors: Vai Trò Của `AllExceptionsFilter`

Khi có lỗi xảy ra (do Validation thất bại hoặc lỗi logic nghiệp vụ), hệ thống không trả về lỗi thô của Node.js. Thay vào đó, `AllExceptionsFilter` (`src/common/filters/all-exceptions.filter.ts`) sẽ can thiệp để chuẩn hóa phản hồi.

### 3.1. Cấu Trúc Phản Hồi Lỗi Chuẩn (API Contract)

Mọi lỗi trả về cho Frontend luôn tuân thủ cấu trúc:

```json
{
  "statusCode": 400,
  "timestamp": "2024-05-21T10:00:00.000Z",
  "path": "/auth/register",
  "message": "Email không hợp lệ"
}
```

### 3.2. Lợi Ích Của Việc Xử Lý Tập Trung

- **Tính Bảo Mật**: 
  - Đối với lỗi hệ thống (`Internal Server Error - 500`), Filter sẽ ghi log chi tiết (kèm Stack Trace) vào Console/File để lập trình viên theo dõi, nhưng chỉ trả về một thông báo chung chung cho người dùng: *"Có sự cố xảy ra, chúng tôi đang xử lý"*. 
  - Điều này ngăn chặn việc rò rỉ cấu trúc database hoặc mã nguồn thông qua thông báo lỗi.
- **Tính Đồng Nhất**: Frontend chỉ cần viết một hàm xử lý lỗi duy nhất vì cấu trúc JSON trả về là bất biến cho mọi Endpoint.
- **Logging**: Tự động ghi lại mọi lỗi phát sinh trong hệ thống kèm theo URL và Phương thức HTTP, giúp việc Debug trở nên dễ dàng hơn bao giờ hết.

---

## 4. Cơ Chế Transformation (Chuyển Đổi Dữ Liệu)

Nhờ vào `transform: true` trong `ValidationPipe`, dòng chảy dữ liệu trong ứng dụng trở nên mượt mà và an toàn hơn về mặt kiểu dữ liệu (Type-safe).

### 4.1. Chuyển Đổi Kiểu Tự Động (Implicit Conversion)

Khi nhận dữ liệu từ `Query String` hoặc `URL Params`, tất cả ban đầu đều là chuỗi.

- **Yêu cầu**: `GET /products?limit=10`
- **DTO**: 
  ```typescript
  class PaginationDto {
    @IsNumber()
    limit: number;
  }
  ```
- **Kết quả**: `limit` trong Controller sẽ là kiểu `number` (giá trị `10`), không phải chuỗi `"10"`.

### 4.2. Chuyển Đổi Sang Class Instance

ValidationPipe sử dụng `class-transformer` để biến các object JSON vô hồn thành các instance thực sự của class. Điều này cho phép chúng ta:
- Sử dụng các getters/setters trong DTO.
- Áp dụng các logic mặc định ngay trong constructor hoặc khai báo biến.
- Đảm bảo dữ liệu đi vào Service luôn là dữ liệu "sạch" và đúng định dạng mong muốn.

---

## Tổng Kết Luồng Xử Lý

1. **Request** gửi đến server.
2. **ValidationPipe** kiểm tra:
   - Nếu có trường lạ -> Ném lỗi (400 Bad Request).
   - Nếu sai định dạng (vượt decorators) -> Ném lỗi (400 Bad Request).
   - Nếu hợp lệ -> Lọc trường thừa, ép kiểu dữ liệu và chuyển sang Controller.
3. **Controller/Service** xử lý logic. Nếu có lỗi nghiệp vụ (ví dụ: User không tồn tại) -> Ném `HttpException`.
4. **AllExceptionsFilter** bắt lấy mọi Exception -> Ghi log lỗi -> Đóng gói lại thành JSON chuẩn -> Trả về cho **Client**.
