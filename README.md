#  UIT Survey Auto-Filler Tool

Công cụ tiện ích mở rộng (Chrome Extension) giúp tự động điền nhanh phiếu khảo sát đánh giá giảng viên trên hệ thống khảo sát của Trường Đại học Công nghệ Thông tin - ĐHQG-HCM (`survey.uit.edu.vn`).

---

## ✨ Các tính năng nổi bật
* **🍃 Đánh giá Tự nhiên (Khuyên dùng)**: Hệ thống tự động chọn ngẫu nhiên có trọng số (80% câu trả lời Tối đa và 20% câu trả lời Tốt). Giúp biểu mẫu đánh giá phân bổ đều, tự nhiên, tránh bị hệ thống quét do trùng lặp 100%.
* **⭐ Nhiều mức độ đánh giá**: Tối đa (5/5), Tốt (4/5), Trung bình (3/5).
* **💬 Nhận xét ngẫu nhiên**: Bạn có thể định nghĩa danh sách các câu nhận xét khác nhau (mỗi câu một dòng). Công cụ sẽ bốc ngẫu nhiên một câu riêng biệt cho từng ô ý kiến góp ý của mỗi giảng viên.
* **⏱️ Tự động chuyển trang (Auto Next)**: Tự động click nút Tiếp theo sau một khoảng thời gian chờ tùy chỉnh (từ 0.3s đến 3.0s) giúp trải nghiệm mượt mà và tránh bị lỗi server do thao tác quá nhanh.
* **🛑 Nút dừng khẩn cấp (STOP)**: Bấm nút **DỪNG** bất kỳ lúc nào để chuyển ngay về chế độ tự đánh giá thủ công.

---

## 🛠️ Hướng dẫn cài đặt & Sử dụng

### Bước 1: Tải về và giải nén
Tải UIT-Survey-Auto-Filler.zip này về máy tính của bạn và giải nén (nếu ở định dạng `.zip`).

### Bước 2: Kích hoạt Developer Mode trên trình duyệt
1. Mở trình duyệt Chrome (hoặc Edge, Cốc Cốc, Brave,...).
2. Truy cập vào trang quản lý Extension bằng cách nhập địa chỉ:
   ```text
   chrome://extensions/
   ```
3. Bật **Developer Mode (Chế độ dành cho nhà phát triển)** ở góc trên cùng bên phải màn hình.

### Bước 3: Nạp tiện ích vào trình duyệt
1. Click chọn nút **Load unpacked (Tải thư mục đã giải nén)** ở góc trên cùng bên trái.
2. Trỏ đường dẫn và chọn thư mục chứa dự án này (`UIT-Survey-Auto-Filler`).

### Bước 4: Chạy công cụ
1. Ghim (Pin) tiện ích **UIT Survey Auto-Filler** lên thanh công cụ trình duyệt để tiện thao tác.
2. Mở đường link khảo sát UIT của bạn, ví dụ: [Link Khảo Sát UIT](https://survey.uit.edu.vn/index.php/survey/index/sid/261195/token/wa8aqkcfnzi6jea/lang/vi).
3. Click vào biểu tượng tiện ích, chọn các cấu hình mong muốn và nhấn **Bắt đầu tự động điền**.

---

## ⚠️ Lưu ý an toàn & Hiệu năng

> [!IMPORTANT]
> **Khuyên dùng:** Bạn nên giữ thời gian trễ (Delay) ở mức **1.0s đến 1.5s** thay vì quá nhanh, nhằm tránh việc máy chủ phản hồi không kịp dẫn đến lỗi tải trang.

> [!NOTE]
> **Quyền riêng tư:** Tiện ích hoạt động hoàn toàn cục bộ trên máy tính của bạn, cam kết **không lưu trữ, thu thập hoặc gửi bất kỳ thông tin cá nhân nào** ra ngoài.
