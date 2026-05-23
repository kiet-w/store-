# Hạ tầng Kỹ thuật (Infrastructure)

Tài liệu này giải thích kiến trúc hạ tầng của hệ thống, tập trung vào cách kết nối cơ sở dữ liệu, chiến lược caching và quản lý cấu hình.

## 1. Kết nối PostgreSQL (Supabase/Local)

Hệ thống sử dụng **Prisma ORM** làm lớp giao tiếp với PostgreSQL. Tuy nhiên, thay vì sử dụng kết nối TCP mặc định của Prisma, chúng ta triển khai kiến trúc **Driver Adapter**.

### Chi tiết triển khai (`src/prisma/prisma.service.ts`)
- **pg Pool:** Sử dụng thư viện `pg` để quản lý một nhóm các kết nối (connection pool). Điều này giúp tối ưu hóa hiệu suất bằng cách tái sử dụng các kết nối hiện có thay vì tạo mới cho mỗi truy vấn.
- **PrismaPg Adapter:** Chúng ta sử dụng `@prisma/adapter-pg` để tích hợp `pg.Pool` vào Prisma Client.

### Tại sao chọn cách này?
1. **Hiệu suất:** Connection pooling cực kỳ quan trọng trong môi trường doanh nghiệp để giảm độ trễ (latency) khi thiết lập kết nối.
2. **Khả năng tương thích:** Driver Adapter là giải pháp tối ưu khi làm việc với các dịch vụ cloud như **Supabase** hoặc trong môi trường serverless, nơi việc quản lý kết nối trực tiếp thường gặp khó khăn.

## 2. Redis Caching

Để giảm tải cho cơ sở dữ liệu chính và tăng tốc độ phản hồi, hệ thống tích hợp Redis thông qua `@nestjs/cache-manager`.

### Mô hình `getOrSet` (`src/redis/redis.service.ts`)
Chúng ta áp dụng pattern `getOrSet` cho các dữ liệu thường xuyên được truy cập (như danh mục sản phẩm):

```typescript
async getOrSet(key: string, fetchFunction: () => Promise<any>, ttl: number = 30000) {
  const cachedData = await this.cacheManager.get(key);
  if (cachedData) return cachedData; // "Lấy từ tủ lạnh Redis"

  const freshData = await fetchFunction(); // "Xuống hầm tìm dữ liệu"
  await this.cacheManager.set(key, freshData, ttl);
  return freshData;
}
```

- **TTL (Time-To-Live):** Mặc định là 30 giây (30000ms), đảm bảo dữ liệu không quá cũ nhưng vẫn giảm đáng kể số lượng truy cập vào DB.
- **Tác động:** Giúp hệ thống chịu tải tốt hơn khi có lượng lớn người dùng truy cập cùng lúc vào các trang Catalog hoặc Sản phẩm.

## 3. Quản lý Biến môi trường

Toàn bộ cấu hình hệ thống được quản lý thông qua `@nestjs/config` và file `.env`.

- **Tính toàn cục:** `ConfigModule` được đăng ký ở `AppModule` với flag `isGlobal: true`, cho phép mọi service truy cập cấu hình mà không cần import lại.
- **Tính an toàn:** Trong `PrismaService`, chúng ta thực hiện kiểm tra nghiêm ngặt:
  ```typescript
  if (!databaseUrl) {
    throw new InternalServerErrorException('DATABASE_URL is not defined');
  }
  ```
- **Lợi ích:** Phát hiện lỗi cấu hình ngay lập tức khi ứng dụng khởi động, tránh các lỗi runtime khó kiểm soát.

## 4. Lifecycle Hooks

Hệ thống tận dụng các hooks của NestJS để quản lý vòng đời kết nối.

- **`onModuleInit`:** Trong `PrismaService`, chúng ta sử dụng hook này để gọi `this.$connect()`.
- **Eager Connection:** Việc kết nối ngay khi module được khởi tạo giúp đảm bảo rằng khi có request đầu tiên đến, kết nối DB đã sẵn sàng (warm-up), giảm độ trễ cho người dùng đầu tiên.

## Các gói phụ thuộc chính (Key Packages)

Dựa trên `package.json`, các thư viện hạ tầng cốt lõi bao gồm:
- **Database:** `@prisma/client`, `@prisma/adapter-pg`, `pg`.
- **Cache:** `@nestjs/cache-manager`, `cache-manager-redis-yet`, `redis`.
- **Config:** `@nestjs/config`.
