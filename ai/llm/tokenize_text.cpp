#include <iostream>
#include <string>
#include <cstdio>
#include <memory>
#include <array>

int main() {
    // Sử dụng môi trường ảo Python đã cài tokenizers để thực hiện phân tích
    std::string command = "./ollm_env/bin/python tokenize_text.py";

    // Mở pipe để liên kết xuất từ Python script sang C++
    std::unique_ptr<FILE, decltype(&pclose)> pipe(popen(command.c_str(), "r"), pclose);
    if (!pipe) {
        std::cerr << "❌ Lỗi: Không thể thực thi bộ tách từ Python.\n";
        return 1;
    }

    std::array<char, 4096> buffer;
    
    // Đọc và in trực tiếp dữ liệu phân tách token sang C++ stdout
    while (fgets(buffer.data(), buffer.size(), pipe.get()) != nullptr) {
        std::cout << buffer.data();
    }

    return 0;
}
