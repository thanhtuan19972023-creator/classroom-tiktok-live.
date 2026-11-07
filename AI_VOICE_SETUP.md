# Giọng nữ AI Tuyết – miền Nam cho game lớp học TikTok LIVE

**Trạng thái:** Đã có mã nguồn tích hợp giọng Tuyết trong `index.html` và `api/tts.js`. Chưa thể phát giọng AI thật trên GitHub Pages khi chưa triển khai backend và cấu hình API key.

**Giọng được chọn:** Tuyết – Southern Vietnamese Storyteller, Voice Library ID công khai: `xjyQliDr4k3i3iSr1wSb` (giọng nữ miền Nam ấm áp, truyền cảm). Có thể cần thêm vào **My Voices** của tài khoản và dùng **Voice ID** được hiển thị trong My Voices, nếu tài khoản không thể truy cập trực tiếp ID thư viện.

## Thực hiện trên iPhone

### 1. Lưu giọng Tuyết vào ElevenLabs
- Mở https://elevenlabs.io và đăng nhập.
- Vào **Voices → Explore** (Thư viện giọng).
- Tìm bằng chữ **Tuyết** hoặc Voice ID `xjyQliDr4k3i3iSr1wSb`.
- Nghe thử giọng rồi nhấn **+** để lưu vào **My Voices**, nếu được cho phép.
- Trong **My Voices**, bấm **… → Copy voice ID**. Hãy dùng ID này cho bước cấu hình Vercel nếu khác ID bên trên.

### 2. Tạo khóa API ElevenLabs
- Chọn **Developers → API Keys → Create API Key**.
- Đặt tên, chẳng hạn `classroom-tikTok-voice`.
- Chỉ cấp quyền Text to Speech (Speech Synthesis); đặt **Credit Quota** thấp để giới hạn chi phí.
- Lưu khóa trong nơi bảo mật của bạn. **Không gửi API key vào cuộc trò chuyện, GitHub, hoặc ô máy chủ trong game.**
- Hướng dẫn chính thức: https://elevenlabs.io/docs/help-center/technical/how-do-i-authorize-myself-using-an-api-key

### 3. Kết nối GitHub 2023 với Vercel
- Truy cập https://vercel.com/new bằng Safari.
- Đăng nhập và nhấn **Continue with GitHub** hoặc phần kết nối GitHub nếu tài khoản Vercel đã đăng nhập.
- Cho phép Vercel truy cập repository `thanhtuan19972023-creator/classroom-tiktok-live.`.
- Chọn **Import** cho repository này, tên dự án gợi ý `classroom-tiktok-voice`, **Framework Preset: Other**, root directory để trống, nhấn **Deploy**.

**Lưu ý:** kết nối GitHub trong ChatGPT không tự cấp quyền GitHub cho Vercel. Vercel phải được bạn cho phép riêng.

### 4. Cấu hình biến môi trường ở Vercel
Trong dự án Vercel → **Settings → Environment Variables** → thêm:

| Name | Value | Cách lưu |
|---|---|---|
| `ELEVENLABS_API_KEY` | Khóa của bạn | **Sensitive** / bảo mật, chọn Production |
| `ELEVENLABS_VOICE_ID` | Voice ID từ My Voices của Tuyết | Production |
| `ELEVENLABS_MODEL_ID` | `eleven_flash_v2_5` (tùy chọn) | Production |

Mã mặc định sử dụng ID công khai của Tuyết, nhưng bạn nên đặt `ELEVENLABS_VOICE_ID` sau khi lưu vào My Voices. **Không đặt API key trong file mã nguồn.**

Khi lưu xong, vào **Deployments → … → Redeploy**. Thay đổi biến môi trường chỉ có hiệu lực ở deployment mới.

### 5. Kiểm tra trên iPhone
**Cách đơn giản nhất:** Mở địa chỉ `https://...vercel.app` của dự án bằng Safari, kéo đến mục **Nguồn giọng**, chọn **Tuyết – giọng nữ miền Nam AI**, nhấn **🔊 NGHE THỬ GIỌNG**. Game tự gọi `/api/tts`.

**Nếu muốn tiếp tục mở game GitHub Pages:** Mở `https://thanhtuan19972023-creator.github.io/classroom-tiktok-live./`, chọn **Nguồn giọng → Tuyết**, dán địa chỉ Vercel vào **Máy chủ giọng AI**, bấm **Lưu máy chủ → Kiểm tra giọng AI → NGHE THỬ GIỌNG**.

Nếu có thông báo `Máy chủ chạy nhưng chưa có khóa`: kiểm tra `ELEVENLABS_API_KEY`, chọn đúng môi trường Production và Redeploy. Nếu thông báo không thể phát được giọng: kiểm tra Voice ID hoặc quyền sử dụng giọng trong ElevenLabs.

## Chi phí, bảo mật và giới hạn
- ElevenLabs API tiêu tốn credits cho mỗi lần tạo câu nói. Cần đặt quota cho key; lưu giọng và xem quyền sử dụng thương mại theo gói.
- Backend hiện chỉ áp dụng rate-limit **best-effort** trong bộ nhớ từng phiên máy chủ; chưa có giới hạn phân tán, xác thực người dùng hay cache âm thanh. **Không để công khai trong livestream đông người trước khi bổ sung kiểm soát chi phí và chống lạm dụng.**
- Câu hỏi, câu trả lời và tên/nội dung bình luận được gửi đến backend và ElevenLabs để tạo giọng. Hãy cân nhắc quyền riêng tư.
- **Chưa kết nối nhận quà/bình luận TikTok LIVE tự động**. Game vẫn đang mô phỏng tương tác; giọng AI là thành phần độc lập.
- Bộ đếm ngược và bảng Top 10 trong game không phụ thuộc vào backend giọng đọc.
