import os
import sys

# Đảm bảo thư viện tokenizers đã được cài đặt
try:
    from tokenizers import Tokenizer
except ImportError:
    print("❌ Lỗi: Thư viện 'tokenizers' chưa được cài đặt.")
    print("Vui lòng chạy lệnh: ./ollm_env/bin/python -m pip install tokenizers")
    sys.exit(1)

# Đường dẫn tới file tokenizer.json của Llama 3.2
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
TOKENIZER_PATH = os.path.join(CURRENT_DIR, "models", "llama3-3B-chat", "tokenizer.json")

if not os.path.exists(TOKENIZER_PATH):
    print(f"❌ Lỗi: Không tìm thấy file tokenizer tại đường dẫn: {TOKENIZER_PATH}")
    print("Hãy đảm bảo thư mục models/llama3-3B-chat/ đã được tải về đầy đủ.")
    sys.exit(1)

# Khởi tạo tokenizer từ file cấu hình cục bộ
try:
    tokenizer = Tokenizer.from_file(TOKENIZER_PATH)
except Exception as e:
    print(f"❌ Lỗi khi tải tokenizer: {e}")
    sys.exit(1)

# Văn bản mẫu cần phân tích token
text_input = "Trí tuệ nhân tạo (AI) đang thay đổi cách chúng ta làm việc."

print("=" * 60)
print(f"📝 VĂN BẢN ĐẦU VÀO:\n\"{text_input}\"")
print("=" * 60)

# Mã hóa văn bản thành tokens
encoded = tokenizer.encode(text_input)
token_ids = encoded.ids
tokens = encoded.tokens

# Hiển thị kết quả
print(f"📊 TỔNG SỐ TOKEN: {len(token_ids)}")
print("-" * 60)
print(f"{'STT':<5} | {'Token ID':<10} | {'Token Text (Thô)':<20} | {'Token Text (Đọc được)'}")
print("-" * 60)

for idx, (tid, ttxt) in enumerate(zip(token_ids, tokens)):
    # GPT/Llama tokenizer sử dụng ký tự đặc biệt 'Ġ' để đại diện cho dấu cách (Space)
    # và các ký tự đặc biệt khác để đại diện cho xuống dòng...
    readable_txt = ttxt.replace("Ġ", " ").replace("Ċ", "\n")
    print(f"{idx:<5} | {tid:<10} | {ttxt!r:<20} | {readable_txt!r}")

print("-" * 60)
print("✅ Hoàn thành phân tích token!")
