# 🔍 Đánh giá cấu trúc dự án AI/LLM Local

> **Ngày:** 2026-06-14  
> **Thư mục:** `ai/llm/`  
> **Mô hình:** Llama 3.2 3B Instruct (qua Ollama)

---

## ✅ Những gì đã ổn

| # | Hạng mục | Chi tiết |
|---|----------|----------|
| 1 | **Ollama hoạt động tốt** | Mô hình `llama3.2:3b` (2.0 GB, đã lượng hóa 4-bit) chạy mượt, stream real-time, không lỗi tài nguyên |
| 2 | **Script `agent_note.py` chạy thành công** | Gọi Ollama đúng cách, có system prompt, streaming output, cấu hình `num_ctx` và `num_thread` hợp lý |
| 3 | **Python environment** | Virtual env `ollm_env/` dùng Python 3.14, thư viện `ollama==0.6.2` đã cài sẵn |
| 4 | **Cấu trúc thư mục có tổ chức rõ ràng** | Tách biệt `models/`, `kv_cache/`, `ollm_env/` — cho thấy ý định thiết kế tốt |

---

## ⚠️ Những gì chưa ổn

| # | Vấn đề | Mức độ | Chi tiết |
|---|--------|--------|----------|
| 1 | **Shebang bị lỗi trong venv** | Trung bình | `ollm_env/bin/pip` trỏ về `/home/baudui/Desktop/llm/ollm_env/...` (đường dẫn cũ). Cần tạo lại venv hoặc dùng `python -m pip` |
| 2 | **Thư mục `models/llama3-3B-chat/` dư thừa ~6.4 GB** | Cao | Chứa trọng số FP16 `.safetensors` thô nhưng **không file nào trong project đang sử dụng**. Code chỉ gọi qua Ollama |
| 3 | **Thư mục `kv_cache/` trống** | Thấp | Tạo ra nhưng chưa có nội dung gì, chưa rõ mục đích sử dụng cụ thể |
| 4 | **Không có `requirements.txt`** | Trung bình | Không có file khai báo dependencies, khó tái tạo môi trường trên máy khác |
| 5 | **Không có `.gitignore` riêng cho thư mục `ai/llm/`** | Trung bình | Thư mục `models/` chứa 6.4 GB weights có thể vô tình bị commit vào git |
| 6 | **Hardcode trong `agent_note.py`** | Thấp | Model name (`llama3.2:3b`), context input, và các options đều hardcode trực tiếp, không dễ tái sử dụng |

---

## 🚀 Những gì cần/nên phát triển tiếp

| # | Hướng phát triển | Mô tả | Độ ưu tiên |
|---|-----------------|-------|-------------|
| 1 | **Tạo `requirements.txt`** | Freeze dependencies hiện tại để ai cũng có thể cài lại đúng môi trường | 🔴 Cao |
| 2 | **Tạo `.gitignore` cho `ai/llm/`** | Loại trừ `models/*.safetensors`, `ollm_env/`, `kv_cache/*.bin` khỏi git | 🔴 Cao |
| 3 | **Dọn hoặc quyết định số phận thư mục `models/`** | Nếu chỉ dùng Ollama → xóa 6.4 GB. Nếu muốn thí nghiệm PyTorch → giữ lại và viết script | 🔴 Cao |
| 4 | **Tạo `Modelfile` cho Ollama** | Đóng gói system prompt, `num_ctx`, `temperature` thành custom model trên Ollama, không cần hardcode trong Python | 🟡 Trung bình |
| 5 | **Tách config ra file riêng** | Tạo `config.py` hoặc `config.json` chứa model name, options, system prompt — để `agent_note.py` gọn hơn và dễ mở rộng | 🟡 Trung bình |
| 6 | **Viết thêm agent scripts** | Mở rộng từ `agent_note.py` thành các agent chức năng khác: tóm tắt file, Q&A trên tài liệu, code review local... | 🟡 Trung bình |
| 7 | **Hiện thực KV Cache optimization** | Nếu muốn thí nghiệm chạy mô hình bằng Transformers trực tiếp (không qua Ollama), viết code tối ưu KV Cache trong `kv_cache/` | 🟢 Thấp (nâng cao) |
| 8 | **Sửa lại venv** | Tạo lại virtual env tại đường dẫn hiện tại để shebang đúng, hoặc thêm script `setup.sh` tự động hóa | 🟢 Thấp |
| 9 | **Thêm README.md cho `ai/llm/`** | Tài liệu hướng dẫn cách cài đặt, chạy, và mục tiêu của project LLM local này | 🟢 Thấp |

---

## 📂 Cấu trúc file hiện tại

```
ai/llm/
├── agent_note.py          # Script chính gọi Ollama
├── update_html.py         # Script cập nhật HTML docs
├── 26.1.2                 # (không rõ mục đích)
├── kv_cache/              # ⚠️ Trống
├── models/
│   └── llama3-3B-chat/    # ⚠️ ~6.4 GB trọng số thô, chưa được sử dụng
│       ├── config.json
│       ├── generation_config.json
│       ├── model-00001-of-00002.safetensors
│       ├── model-00002-of-00002.safetensors
│       ├── model.safetensors.index.json
│       ├── tokenizer.json
│       ├── tokenizer_config.json
│       ├── special_tokens_map.json
│       ├── chat_template.jinja
│       └── README.md
└── ollm_env/              # Python 3.14 venv (shebang lỗi)
```

## 🖥️ Môi trường runtime

- **Python:** 3.14.5 (Homebrew)
- **Ollama model:** `llama3.2:3b` — 2.0 GB (quantized)
- **Thư viện đã cài:** `ollama==0.6.2`, `pydantic==2.13.4`, `httpx==0.28.1`
