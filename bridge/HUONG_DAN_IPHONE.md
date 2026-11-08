# KẾT NỐI TIKTOK LIVE THẬT CHO LỚP HỌC 12A

**Chỉ dùng iPhone; game Vercel không cần máy tính ở nhà.**

## Việc cần làm một lần trên iPhone

1. Vào https://dashboard.render.com/ và đăng nhập (GitHub sẽ tiện nhất).
2. Chọn **New → Blueprint**, kết nối repo `thanhtuan19972023-creator/classroom-tiktok-live.` (dấu chấm ở cuối tên repo là có thật).
3. Render đọc file `render.yaml` ở thư mục gốc. Xem kế hoạch **Free**, tên `classroom-12a-live-bridge`, vùng Singapore, rồi bấm tạo/deploy. **Không chọn gói trả phí nếu muốn thử miễn phí.**
4. Ở biến `TIKTOK_USERNAME`, nhập **@tên người dùng TikTok của chính bạn** (không phải tên hiển thị, không nhập mật khẩu/cookie).
5. Render sẽ có địa chỉ dạng `https://classroom-12a-live-bridge.onrender.com` (tên thực tế có thể khác). Mở `/api/status` và kiểm tra.
6. Mở `https://classroom-tiktok-live.vercel.app/` → phần **Kết nối TikTok LIVE thật** → dán địa chỉ Render → nhấn **Kết nối**. Trạng thái **Đã kết nối TikTok LIVE** chỉ xuất hiện khi server kết nối tới LIVE đang phát.
7. Mở TikTok LIVE Mobile Gaming rồi quay lại Safari game. Bật **Tự chuyển câu** và **Bắt đầu**. Dùng tài khoản TikTok khác bình luận A/B/C/D và tặng một quà nhỏ để kiểm tra.

## Phương thức và sự kiện

- `GET /health`, `GET /api/status`: trạng thái WebSocket TikTok, `instanceId`, `cursor`.
- `GET /api/events?after=123`: lấy bình luận, quà, thành viên theo đúng thứ tự nhận; không gửi mật khẩu.
- `TIKTOK_USERNAME`: tên TikTok public đang LIVE, cố định ở cấu hình máy chủ.
- Đọc tên 5 người đúng nhanh nhất và công bố số còn lại **sau 20 giây**; quà tặng mời học sinh vào lớp. Đếm combo quà một lần sau khi chuỗi kết thúc.
- Người vừa vào phòng chỉ được tự đưa vào lớp nếu bạn bật tùy chọn chào người vào LIVE; mặc định quà tặng và bình luận mới là tương tác chính.

## Giới hạn

- TikTok LIVE Connector **không chính thức**; có thể gặp giới hạn ký kết nối, mất sự kiện hoặc không kết nối sau khi TikTok thay đổi giao thức.
- Gói Render **Free** có thể ngủ sau 15 phút không có yêu cầu và mất khoảng một phút để khởi động. Khi game được mở và đang thăm dò server thì thường giữ máy chủ hoạt động, nhưng iPhone có thể tạm dừng Safari khi màn hình không ở trước.
- Không phải LIVE API chính thức của TikTok. Không hứa 100% đúng số sự kiện/quà, nhất là khi mất mạng.
- Event API chỉ đọc sự kiện: không gửi tin nhắn vào tài khoản TikTok hay tự gửi quà.
- Quà tặng là tùy chọn của người xem; **không bắt buộc trả tiền để tham gia**.
- Hãy dùng thử với tài khoản phụ trước khi mở phiên LIVE chính thức.

Thư viện: https://github.com/zerodytrash/TikTok-Live-Connector
Tài liệu: https://ttlc.docs.isaackogan.com/
Render: https://render.com/docs/free
