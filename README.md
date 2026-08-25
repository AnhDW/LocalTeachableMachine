# Local Teachable Machine

**Local Teachable Machine** là một ứng dụng web mô phỏng lại dự án Teachable Machine nổi tiếng của Google, nhưng được tối ưu hóa để chạy và huấn luyện mô hình AI hoàn toàn tại trình duyệt (Local/Client-side) mà không cần gửi bất kỳ dữ liệu hình ảnh nào lên máy chủ.

Ứng dụng cho phép người dùng tự tạo các phân lớp (Classes), thu thập dữ liệu bằng Webcam hoặc tải ảnh lên, và huấn luyện một mô hình AI nhận diện hình ảnh theo thời gian thực một cách trực quan, nhanh chóng.

## 🚀 Công nghệ sử dụng (Tech Stack)

Dự án được xây dựng trên nền tảng các công nghệ web và AI hiện đại nhất:

- **Framework:** [Angular 18+](https://angular.dev/) (Standalone Components, Signals).
- **Giao diện (UI/UX):** [Tailwind CSS](https://tailwindcss.com/) mang lại giao diện hiện đại, responsive và mượt mà.
- **Trí tuệ nhân tạo (AI Engine):** 
  - **[TensorFlow.js](https://www.tensorflow.org/js):** Lõi xử lý toán học ma trận (Tensors) trên GPU thông qua WebGL.
  - **[MobileNet v2](https://github.com/tensorflow/tfjs-models/tree/master/mobilenet):** Mô hình mạng nơ-ron tích chập (CNN) được dùng làm Feature Extractor (Bóc tách đặc trưng ảnh).
  - **[KNN Classifier](https://github.com/tensorflow/tfjs-models/tree/master/knn-classifier):** Thuật toán phân loại K-Nearest Neighbors siêu tốc, cho phép huấn luyện (Train) mô hình AI mới chỉ trong chớp mắt mà không cần epochs dài dòng.

## ✨ Tính năng nổi bật (Features)

- 📸 **Thu thập dữ liệu đa nguồn:** Hỗ trợ thu thập hàng loạt ảnh từ Webcam (Hold to Record) hoặc tải file ảnh trực tiếp từ máy tính.
- 🗜️ **Tối ưu hóa bộ nhớ:** Hình ảnh thu thập từ Webcam được nén tự động sang định dạng WebP (chất lượng 0.8) để tiết kiệm tối đa RAM của trình duyệt.
- ⚡ **Huấn luyện siêu tốc (Instant Training):** Nhờ việc kết hợp MobileNet (đã pre-train) và thuật toán KNN, quá trình Train diễn ra gần như ngay lập tức.
- 📊 **Giao diện nhận diện mượt mà (Smooth UI):** Thanh % kết quả nhận diện (Preview) được làm mượt bằng thuật toán toán học Trung bình động hàm mũ (EMA - Exponential Moving Average) kết hợp với tf.nextFrame(), mang lại trải nghiệm 60fps mượt mà y hệt bản gốc của Google.
- 🔒 **Bảo mật & Riêng tư:** 100% quá trình học và nhận diện diễn ra trong bộ nhớ RAM và VRAM của máy tính người dùng.

## 🛠️ Cài đặt và Khởi chạy

Yêu cầu hệ thống: [Node.js](https://nodejs.org/) (khuyến nghị bản LTS mới nhất).

1. Clone hoặc tải mã nguồn dự án về máy.
2. Mở Terminal tại thư mục `Client`.
3. Cài đặt các gói thư viện phụ thuộc:
   ```bash
   npm install
   ```
4. Khởi chạy máy chủ phát triển (Dev Server):
   ```bash
   npm start
   ```
5. Mở trình duyệt và truy cập: `http://localhost:4200`

## 📖 Hướng dẫn sử dụng

1. **Tạo phân lớp (Classes):** 
   - Ngay khi mở ứng dụng, bạn sẽ thấy các ô Class (Ví dụ: Class 1, Class 2). 
   - Bạn có thể đổi tên chúng, hoặc nhấn nút **Add a class** để thêm các lớp nhận diện mới.
2. **Thu thập dữ liệu mẫu (Samples):**
   - Ở mỗi Class, nhấn giữ nút **Webcam** để chụp liên tục các góc độ của vật thể/khuôn mặt.
   - Hoặc nhấn nút **Upload** để chọn các file ảnh có sẵn từ máy tính.
   - (Mẹo: Càng nhiều ảnh và nhiều góc độ, AI nhận diện càng chính xác).
3. **Huấn luyện (Train Model):**
   - Di chuyển đến khu vực Training và nhấn nút **Train Model**.
   - Đợi khoảng vài giây để trình duyệt tính toán và phân loại dữ liệu.
4. **Kiểm tra kết quả (Preview):**
   - Đưa vật thể hoặc khuôn mặt ra trước màn hình.
   - Các thanh phần trăm màu sắc sẽ chạy lên xuống mượt mà theo thời gian thực để cho bạn biết AI đang dự đoán hình ảnh thuộc về Class nào.

## 🚧 Lộ trình phát triển tương lai (Roadmap)
- [ ] Tích hợp tính năng Lưu / Tải Project (Lưu dữ liệu cấu trúc mạng KNN xuống LocalStorage hoặc file `.json`).
- [ ] Xây dựng Engine độc lập bóc tách lõi MobileNet để cho phép ứng dụng chạy Offline 100% mà không cần đợi nạp Model từ Internet (Đang lên kế hoạch thử nghiệm).
