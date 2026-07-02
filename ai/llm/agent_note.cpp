#include <iostream>
#include <string>
#include <cstdio>
#include <memory>
#include <array>

int main() {
    std::cout << "🤖 AGENT BẮT ĐẦU HOẠT ĐỘNG LOCAL (C++ & OLLAMA):\n";
    std::cout << "========================================\n\n";

    // Khởi tạo các prompt đầu vào
    std::string system_prompt = "Bạn là AI Agent chuyên nghiệp. Hãy đọc ngữ cảnh và lọc ra các Key Note quan trọng dưới dạng gạch đầu dòng Markdown ngắn gọn.";
    std::string context_input = "Trí tuệ nhân tạo (AI) đang thay đổi cách chúng ta làm việc. Trong phát triển phần mềm, "
                                "xu hướng 'vibecoding' đang lên ngôi khi lập trình viên đóng vai trò điều phối các AI Agent "
                                "để viết code thay vì tự gõ boilerplate. Tuy nhiên, việc vận hành các mô hình ngôn ngữ lớn (LLM) "
                                "đòi hỏi tài nguyên phần cứng rất mạnh. Các máy tính có cấu hình RAM thấp như 8GB thường gặp khó khăn...";

    // Xây dựng JSON payload thủ công để tránh phụ thuộc thư viện ngoài
    std::string payload = R"({"model": "llama3.2:3b", "messages": [{"role": "system", "content": ")" + system_prompt + 
                          R"("}, {"role": "user", "content": "Dưới đây là ngữ cảnh:\n)" + context_input + 
                          R"(\n\nHãy trích xuất các key note."}], "stream": true, "options": {"num_ctx": 1024, "num_thread": 4}})";

    // Sử dụng curl qua popen để stream dữ liệu thời gian thực
    std::string command = "curl -s -N -X POST http://localhost:11434/api/chat -d '" + payload + "'";

    // Mở pipe để đọc luồng xuất từ lệnh curl
    std::unique_ptr<FILE, decltype(&pclose)> pipe(popen(command.c_str(), "r"), pclose);
    if (!pipe) {
        std::cerr << "❌ Lỗi: Không thể khởi chạy tiến trình kết nối (curl).\n";
        return 1;
    }

    std::array<char, 4096> buffer;
    
    // Đọc luồng dữ liệu trả về từ Ollama (dạng JSON lines)
    while (fgets(buffer.data(), buffer.size(), pipe.get()) != nullptr) {
        std::string chunk(buffer.data());
        
        // Trích xuất thô "content" từ chuỗi JSON trả về
        size_t content_pos = chunk.find("\"content\":\"");
        if (content_pos != std::string::npos) {
            size_t start = content_pos + 11;
            size_t end = chunk.find("\"", start);
            
            if (end != std::string::npos) {
                std::string content = chunk.substr(start, end - start);
                
                // Giải mã các ký tự xuống dòng (\n) và dấu ngoặc kép (\") cơ bản trong JSON
                size_t pos = 0;
                while ((pos = content.find("\\n", pos)) != std::string::npos) {
                    content.replace(pos, 2, "\n");
                    pos += 1;
                }
                pos = 0;
                while ((pos = content.find("\\\"", pos)) != std::string::npos) {
                    content.replace(pos, 2, "\"");
                    pos += 1;
                }
                
                std::cout << content << std::flush;
            }
        }
    }

    std::cout << "\n========================================\n";
    std::cout << "✅ Xử lý xong (C++)!\n";
    return 0;
}
