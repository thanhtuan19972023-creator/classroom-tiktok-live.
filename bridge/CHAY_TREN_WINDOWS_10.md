# Chạy Lớp học 12A nhận TikTok LIVE thật bằng Windows 10

## 1. Cài ứng dụng một lần
- [Node.js LTS](https://nodejs.org/en/download) (gồm npm). Cài bằng file MSI của Windows. Đóng/mở lại cửa sổ CMD sau khi cài.
- Cloudflare Tunnel: Mở **Command Prompt** và chạy `winget install -e --id Cloudflare.cloudflared`. Nếu không có winget, dùng bộ cài **Windows 64-bit MSI** chính hãng tại https://developers.cloudflare.com/tunnel/downloads/.
- Kiểm tra: mở CMD, gõ `node -v`, `npm -v`, `cloudflared --version`.

## 2. Tải mã đã chuẩn bị
1. Từ https://github.com/thanhtuan19972023-creator/classroom-tiktok-live. nhấn **Code → Download ZIP**.
2. Giải nén ZIP, vào thư mục **bridge** (đây là mã máy chủ riêng, không phải file index.html).
3. Nhấp đúp `01_CHAY_TIKTOK_WIN10.cmd` và nhập **username thật sau @**, ví dụ tài khoản `@abc123` thì gõ `abc123`.
4. Lần đầu máy tự chạy `npm install`, các lần sau nhanh hơn. Để cửa sổ này mở trong khi LIVE.
5. Trên máy tính, vào `http://127.0.0.1:10000/health`. Nếu hiện JSON với `ready:true`, máy chủ đã chạy; muốn có `connected:true` thì tài khoản phải đang LIVE và TikTok cho phép kết nối.

## 3. Tạo đường dẫn HTTPS
1. Sau khi máy chủ chạy, nhấp đúp `02_MO_HTTPS_WIN10.cmd`.
2. Tìm dòng `https://...trycloudflare.com` và **sao chép URL đó**.
3. Trên iPhone, mở https://classroom-tiktok-live.vercel.app/ và kéo xuống **📡 Kết nối TikTok LIVE thật**.
4. Dán URL Cloudflare, nhấn **📶 Kết nối LIVE thật**.
5. Bắt đầu buổi TikTok Mobile Gaming LIVE trên iPhone, chuyển về Safari đang mở game, bật **Tự chuyển câu**, **Bắt đầu**.
6. Dùng tài khoản phụ vào LIVE, bình luận `A`, `B`, `C`, `D`. Kết quả đúng mới được cộng và hết giờ cô Duyên đọc tên 5 bạn nhanh nhất. Có quà thật thì game phát lời cảm ơn và cho vào lớp.

## Lưu ý
- **Không nhập mật khẩu TikTok hay cookie TikTok vào chương trình này.** Chỉ nhập tên @username public của bạn.
- Hai cửa sổ CMD phải chạy đồng thời; máy tính không ngủ khi LIVE. Link Cloudflare thử nghiệm sẽ thay đổi mỗi lần khởi chạy.
- Quick Tunnel là **đường dẫn công khai tạm thời**, dùng để thử; không chia sẻ công khai link nếu không cần. Không phù hợp triển khai lâu dài. Cần HTTPS từ Cloudflare vì game chạy trên Vercel HTTPS.
- TikTok-Live-Connector **không chính thức**; có thể báo offline, mất kết nối, thiếu bình luận/quà hoặc ngừng chạy nếu TikTok thay đổi giao thức.
- **Không thể xác nhận LIVE thật** chỉ bằng cài mã: phải có phiên TikTok LIVE đang diễn ra và thử sự kiện thật.
- Windows 10 đã kết thúc hỗ trợ bảo mật phổ thông, vì vậy chỉ dùng máy cập nhật/được bảo vệ và tránh mở các dịch vụ không cần thiết ra ngoài mạng.
