# Kế hoạch nâng cấp kết nối MagicTune (Chuẩn Antigravity)

Dựa trên phản hồi của bạn về việc Antigravity kết nối "thầm lặng" và ổn định hơn, tôi nhận thấy ứng dụng hiện tại đang thiếu cơ chế quản lý phiên làm việc (session) thông minh. Tôi sẽ thực hiện nâng cấp lớn sau:

## 1. Tính năng Kết nối tự động (Silent Connection)
- Sử dụng `navigator.usb.getDevices()` để tự động tìm và kết nối lại các thiết bị đã được cấp quyền trước đó.
- Người dùng chỉ cần bấm "Kết nối" một lần duy nhất, các lần sau ứng dụng sẽ tự nhận diện mà không hiện popup trình duyệt (giống hệt cơ chế của Antigravity).

## 2. Xử lý "Dọn dẹp" USB cưỡng bức (`adb-client.ts`)
- Thêm phương thức `forceResetDevice()`: Thực hiện `reset()` và `close()` ở cấp độ phần cứng trước khi bắt đầu phiên mới. 
- Điều này sẽ giải quyết triệt để lỗi "claimInterface" hoặc "Busy" do phiên kết nối cũ bị treo.

## 3. Tối ưu hóa Handshake ADB
- Tinh chỉnh lại chuỗi lệnh bắt tay (Handshake sequence) để đảm bảo điện thoại nhận diện đúng yêu cầu gỡ lỗi ngay từ giây đầu tiên.
- Xử lý lỗi `NetworkError` khi thiết bị từ chối kết nối ban đầu.

## 4. Cập nhật UI chuyên nghiệp
- Thêm các thông báo trạng thái nhỏ dưới nút kết nối: "Đang kiểm tra thiết bị đã ghép đôi...", "Đang khởi tạo handshake...", "Đang chờ xác nhận trên điện thoại...".

## 5. Kiểm tra cuối cùng
- Chạy `lint_applet` và `compile_applet` để đảm bảo mọi thứ hoàn hảo cho bản thương mại.
