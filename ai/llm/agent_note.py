import ollama

# Đưa Context tài liệu của ông vào đây
context_input = """
Trí tuệ nhân tạo (AI) đang thay đổi cách chúng ta làm việc. Trong phát triển phần mềm, 
xu hướng 'vibecoding' đang lên ngôi khi lập trình viên đóng vai trò điều phối các AI Agent 
để viết code thay vì tự gõ boilerplate. Tuy nhiên, việc vận hành các mô hình ngôn ngữ lớn (LLM) 
đòi hỏi tài nguyên phần cứng rất mạnh. Các máy tính có cấu hình RAM thấp như 8GB thường gặp khó khăn...
"""

print("🤖 AGENT BẮT ĐẦU HOẠT ĐỘNG LOCAL (OLLAMA):\n" + "="*40 + "\n")

# Gọi mô hình và stream kết quả ra màn hình real-time
stream = ollama.chat(
    model='llama3.2:3b',
    messages=[
        {
            'role': 'system',
            'content': 'Bạn là AI Agent chuyên nghiệp. Hãy đọc ngữ cảnh và lọc ra các Key Note quan trọng dưới dạng gạch đầu dòng Markdown ngắn gọn.'
        },
        {
            'role': 'user',
            'content': f'Dưới đây là ngữ cảnh:\n{context_input}\n\nHãy trích xuất các key note.'
        }
    ],
    stream=True,
    options={
        "num_ctx": 1024,
        "num_thread": 4
    }
)

for chunk in stream:
    print(chunk['message']['content'], end='', flush=True)

print("\n" + "="*40 + "\n✅ Xử lý xong!")
