# Tích hợp giọng nữ AI tự nhiên (ElevenLabs)

Mã game đã có nút **Nguồn giọng → Giọng nữ AI ElevenLabs** và máy chủ trung gian `api/tts.js`. Lưu ý **GitHub Pages chỉ chạy file tĩnh**: giọng AI thật chưa thể hoạt động cho đến khi triển khai máy chủ và cài đặt thông tin dịch vụ.

## Cách kết nối qua iPhone

1. Mở https://elevenlabs.io và tạo tài khoản. Trong phần Text to Speech, thử nhiều **giọng nữ tiếng Việt** và chọn giọng bạn thích; ghi lại **Voice ID**. Mô hình mặc định trong mã là `eleven_flash_v2_5`, phù hợp nội dung tiếng Việt tốc độ nhanh.
2. Mở Developers → API Keys theo tài liệu https://elevenlabs.io/docs/help-center/technical/how-do-i-authorize-myself-using-an-api-key. Tạo API key với **chỉ quyền Text to Speech** và đặt **credit limit** thấp để chống vượt mức.
3. Đăng nhập Vercel tại https://vercel.com, liên kết tài khoản GitHub 2023 trong phần kết nối Git. Import repository `thanhtuan19972023-creator/classroom-tiktok-live.` thành một dự án Vercel mới.
4. Ở Vercel → Project → Settings → Environment Variables, đặt:
   - `ELEVENLABS_API_KEY`: giá trị API key, loại Sensitive / Encrypted
   - `ELEVENLABS_VOICE_ID`: ID giọng nữ bạn đã chọn
   - `ELEVENLABS_MODEL_ID` (tùy chọn): `eleven_flash_v2_5` hoặc `eleven_v4_turbo`
5. Redeploy sau khi thêm biến môi trường. Mở địa chỉ **Vercel** vừa được cấp (không phải GitHub Pages) và chọn **Nguồn giọng → Giọng nữ AI ElevenLabs**, sau đó bấm **NGHE THỬ GIỌNG**.
6. iPhone cần mở bằng Safari và nhấn nút nghe thử một lần để cho phép âm thanh Web Audio.

## Hạn chế quan trọng

- **Không bao giờ đưa API key vào GitHub Pages, file HTML, đoạn chat công khai hoặc client-side JavaScript.** Chỉ nhập vào biến môi trường Vercel.
- Trang GitHub Pages hiện tại vẫn sử dụng giọng Safari dự phòng cho đến khi có URL máy chủ AI.
- Giọng đọc câu hỏi, đáp án, tên người vào lớp, quà và bình luận sẽ gửi phần chữ tương ứng đến ElevenLabs. Hãy lưu ý quyền riêng tư của người xem.
- API `/api/tts` có giới hạn 450 ký tự mỗi lần và giới hạn best-effort 12 yêu cầu/phút/IP trên từng phiên máy chủ. **Đây không phải rate limit tuyệt đối**; cần giới hạn credit quota trên ElevenLabs và cân nhắc xác thực bổ sung trước khi đưa vào livestream đông người.
- Sự kiện quà và bình luận TikTok thật vẫn chưa được nối; bản game chỉ mô phỏng sự kiện. Máy chủ giọng AI không tự cung cấp kết nối TikTok LIVE.
- Gói ElevenLabs Free chỉ dùng **phi thương mại** và cần ghi nguồn; nếu LIVE có kiếm tiền, hãy dùng gói trả phí có giấy phép thương mại phù hợp: https://elevenlabs.io/terms-of-use .
