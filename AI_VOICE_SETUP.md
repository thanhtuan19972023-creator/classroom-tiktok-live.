# Giọng AI Duyên – cô giáo miền Nam (V10)

**Đã tích hợp** giọng Duyên do người dùng tạo bằng ElevenLabs Voice Design.
- Voice ID: `lfkZiOFuinB91hJ9s2uA` (không phải API key)
- Game: https://classroom-tiktok-live.vercel.app/
- Dịch vụ TTS: `/api/tts` trên Vercel, dùng `ELEVENLABS_API_KEY` trong Environment Variables.
- Không đưa API key vào HTML hay GitHub.

## Chuyển đổi từ giọng Tuyết

Mã API có chế độ chuyển đổi tự động: nếu `ELEVENLABS_VOICE_ID` trên Vercel vẫn là ID cũ của Tuyết (`xjyQliDr4k3i3iSr1wSb`), máy chủ sẽ dùng ID mới của Duyên là `lfkZiOFuinB91hJ9s2uA`. Khi cập nhật biến môi trường sang ID giọng khác, máy chủ sẽ tôn trọng lựa chọn đó.

Như vậy, **không cần thay API Key hoặc sửa biến Voice ID ngay** để nghe Duyên; chỉ cần Vercel triển khai thành công commit mới nhất. Về lâu dài, nên cập nhật `ELEVENLABS_VOICE_ID` thành ID của Duyên để cấu hình rõ ràng.

## Kiểm tra trên iPhone

1. Mở https://classroom-tiktok-live.vercel.app/ bằng Safari và tải lại trang.
2. Trong mục **Nguồn giọng**, chọn **Duyên – cô giáo nữ miền Nam AI**.
3. Nhấn **Kiểm tra giọng AI**, sau đó nhấn **NGHE THỬ GIỌNG**.
4. Nếu có lỗi, xem dòng cảnh báo màu đỏ ở dưới phần điều khiển.

## Lưu ý

- Tài khoản ElevenLabs phải được cấp quyền API Text to Speech, còn đủ credits và được phép sử dụng Voice ID này.
- Phát giọng AI sử dụng credits; giới hạn credits API key thấp để kiểm soát chi phí.
- Gói Free có hạn chế về giấy phép thương mại. Nếu livestream nhận quà/kiếm tiền, cần xem lại điều khoản ElevenLabs.
- Người xem TikTok thật vẫn chưa được nối tự động vào game; phần bình luận và quà tặng hiện là mô phỏng.
- Bộ đếm ngược và bảng Top 10 hoạt động độc lập với giọng nói.
