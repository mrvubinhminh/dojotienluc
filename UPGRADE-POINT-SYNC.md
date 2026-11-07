# Nâng cấp đồng bộ điểm V2

## Reset điểm lớp về ban đầu (0 điểm)

1. Chọn đúng lớp ở danh sách lớp, mở màn hình **Lớp học**.
2. Bấm **Reset điểm lớp**, đọc tên lớp và xác nhận.
3. Điểm cộng, điểm trừ và tổng điểm của tất cả học sinh trong lớp được đưa về 0. Danh sách học sinh, lịch sử và các kỳ đã lưu vẫn giữ nguyên. Chức năng này không tạo kỳ mới; muốn lưu kết quả thành một kỳ, dùng **Kết thúc kỳ**.
4. Chờ nhãn **Đã lưu điểm ☁️**. Nếu mất mạng, lệnh được giữ lại và gửi khi kết nối trở lại.

Reset là lệnh riêng trong sổ giao dịch, được máy chủ xử lý theo thứ tự nhận. Tất cả điểm máy chủ đã nhận trước lệnh reset về 0; giao dịch điểm đến sau reset được cộng tiếp, kể cả giao dịch từ thiết bị khác từng mất mạng. Gửi lại cùng lệnh reset không reset lần thứ hai. Chỉ lớp được chọn bị tác động. Các cột điểm trong bảng Students cũng được cập nhật từ sổ giao dịch.

**Mã Apps Script đầy đủ:** [apps-script-v2.gs](apps-script-v2.gs). Sao chép toàn bộ tệp vào dự án Apps Script và triển khai phiên bản mới cho deployment hiện tại. Mẫu mã trong phần hướng dẫn đồng bộ của ứng dụng cũng đã được cập nhật. Bản máy chủ V2 cũ chưa có lệnh reset cần được thay bằng tệp mới này.

## Đã thay đổi

- Mọi chức năng sửa điểm đi qua `capturePointChanges()` trong `saveData()`. Cách này bao phủ cả trò chơi cũ, thưởng mục tiêu, hoàn tác, điều chỉnh tay và đặt lại cuối kỳ mà không bỏ sót luồng riêng.
- Mỗi lần lưu thay đổi điểm tạo một giao dịch UUID, chứa chênh lệch tổng điểm/điểm cộng/điểm trừ. Hàng đợi lưu dưới các khóa localStorage riêng theo địa chỉ đồng bộ, không dùng một mảng chung dễ bị hai tab ghi đè. Gửi lại giữ nguyên UUID.
- Máy chủ giữ sổ `_PointLedgerV2`, khóa bằng `getScriptLock()` và kiểm tra trùng mã. Tổng điểm đọc từ số dư mở đầu cộng các giao dịch; dữ liệu tổng điểm trong bản lưu từ trình duyệt không có quyền thay thế tổng điểm máy chủ.
- Số dư mở đầu lấy từ bảng Students hiện có, không cộng lại lịch sử cũ. Nâng cấp lần đầu không thay đổi điểm đang lưu trên Sheets.
- Hoàn tác và điều chỉnh tạo chênh lệch bù; reset lớp/kết thúc kỳ tạo lệnh reset riêng theo thứ tự; lịch sử máy chủ giữ dấu vết. Xóa lịch sử trên giao diện không xóa sổ giao dịch và lịch sử sẽ xuất hiện lại khi đồng bộ.
- Phản hồi mạng được ghép với giao dịch còn chờ, kể cả điểm cộng trong lúc yêu cầu đang chạy. Tự đồng bộ điểm sau 1,5 giây và kiểm tra/gửi lại mỗi 30 giây; lỗi hiển thị trên nhãn đồng bộ.
- Tự đồng bộ chỉ ghi giao dịch điểm. Nút **Lưu**/đẩy lên lưu thông tin lớp, học sinh và các sổ khác theo phiên bản. Bản cũ bị từ chối, không ghi đè. Tải về thủ công nhập thông tin lớp mới nhất và giữ giao dịch điểm chưa được xác nhận.
- Biểu mẫu sửa học sinh chỉ áp dụng phần chênh lệch điểm giáo viên thực sự sửa, giữ điểm mới cộng trong lúc biểu mẫu mở.

## Triển khai (cần thực hiện trên Apps Script đang dùng)

1. Xuất bản sao Google Sheet và sao lưu dữ liệu trình duyệt quan trọng trước khi chuyển đổi. Chọn Sheet có điểm đúng làm số dư mở đầu; lỗi đã xảy ra trước bản V2 không tự khôi phục được.
2. Đóng các tab ứng dụng cũ trên các thiết bị để tránh tiếp tục ghi dữ liệu theo giao thức cũ trong lúc chuyển đổi.
3. Mở dự án Apps Script gắn với Google Sheet đang dùng. Thay mã máy chủ bằng **toàn bộ** `apps-script-v2.gs`. Không dùng riêng `dojo-sync-v2.gs` vì đó chỉ là phần mở rộng để kiểm thử.
4. Lưu, vào Deploy → Manage deployments, sửa deployment hiện tại và chọn phiên bản mới. Giữ nguyên URL `/exec` và quyền truy cập hiện có. Nếu đổi URL, phải đồng bộ hết giao dịch chờ ở URL cũ trước.
5. Phát hành các tệp ứng dụng đã sửa cùng lúc, bao gồm `js/point-transactions.js`. Tải lại ứng dụng trên tất cả thiết bị.
6. Trước khi sửa thông tin lớp, dùng **Tải về** trên từng thiết bị để nhập dữ liệu và phiên bản V2 mới nhất. Điểm chưa gửi được tạo bởi V2 vẫn được giữ/gửi qua hàng đợi; dữ liệu chưa đồng bộ từ phiên bản cũ cần đối chiếu với bản sao trước khi nhập.
7. Kiểm tra hai thiết bị cùng cộng lần lượt +2 và +3 cho một học sinh: tổng phải tăng +5. Ngắt mạng, cộng tiếp, tải lại tab, bật mạng: giao dịch chỉ áp dụng một lần.

Nếu máy chủ chưa được nâng cấp, V2 báo lỗi và giữ hàng đợi điểm. Không quay lại bản cũ để bấm lưu toàn bộ dữ liệu.

## Kiểm tra tại máy

```sh
npm test
npm run export:apps-script
```

Các kiểm thử dùng bộ nhớ giả lập Google Sheets và trình duyệt để kiểm tra giao thức, đồng bộ, mất mạng, gửi trùng, xung đột, chuyển đổi số dư, xóa học sinh và biểu mẫu sửa điểm. Chưa thay thế kiểm tra deployment Apps Script thực tế/CORS, giới hạn thời gian và hạn mức của tài khoản Google.

## Giới hạn vận hành

- LocalStorage là nơi giữ giao dịch chưa gửi; xóa dữ liệu trang trước khi đồng bộ sẽ xóa hàng đợi đó. Dữ liệu đã được xác nhận nằm ở máy chủ.
- Không sửa/xóa trực tiếp các bảng `_PointLedgerV2` và `_DojoRevision`; sửa điểm bằng ứng dụng để có giao dịch đối chiếu.
- Khóa bảo vệ đoạn đọc/ghi đồng thời, không phải giao dịch cơ sở dữ liệu cho toàn bộ các sổ metadata. Việc ghi điểm bền vững nằm trong ledger; bảng metadata vẫn là các lần ghi Sheets riêng biệt.
- Sổ giao dịch được đọc lại khi đồng bộ. Khi dữ liệu tăng lớn, nên chuyển ledger sang cơ sở dữ liệu có transaction/index thay vì xóa lịch sử để giảm dung lượng.
- Chưa thay đổi mô hình quyền truy cập của Web App hiện có. Mã chống trùng bảo vệ tính nhất quán khi gửi lại, không thay thế xác thực người dùng.

Nếu sửa mẫu máy chủ trong `js/google-sheets-sync.js`, chạy lệnh export để cập nhật tệp triển khai. `dojo-sync-v2.gs` phải khớp phần V2 đầu mẫu; có kiểm thử kiểm tra điều này.
