# Responsive Design Implementation

## Tổng quan

Dự án đã được cập nhật để hỗ trợ responsive trên tất cả các thiết bị, từ điện thoại di động, máy tính bảng đến màn hình máy tính để bàn. Các thay đổi được thực hiện giữ nguyên thiết kế và trải nghiệm người dùng hiện có, chỉ tối ưu hóa và điều chỉnh bố cục cho các kích thước màn hình khác nhau.

## Thành phần đã cập nhật

### 1. Header Component

- Thêm menu hamburger hiển thị trên thiết bị di động
- Ẩn các liên kết điều hướng trên thiết bị di động và hiển thị qua menu dropdown
- Thêm icon tìm kiếm có thể mở rộng trên thiết bị di động
- Điều chỉnh kích thước logo và phông chữ theo kích thước màn hình
- Tự động đóng menu khi click bên ngoài
- Điều chỉnh hiển thị giỏ hàng và thanh tìm kiếm trên di động

### 2. Admin Layout & Sidebar

- Tạo component AdminLayout để quản lý bố cục chung
- Thêm chức năng collapse sidebar trên màn hình trung bình
- Triển khai sidebar có thể thu gọn với icon thay vì văn bản trên tablet
- Ẩn sidebar và hiển thị qua menu hamburger trên thiết bị di động
- Thêm overlay khi mở sidebar trên thiết bị di động
- Thêm chức năng đóng/mở sidebar

### 3. Trang Cart (Giỏ hàng)

- Cải thiện bố cục tổng thể cho các thiết bị khác nhau
- Sắp xếp lại thông tin sản phẩm theo chiều dọc trên thiết bị di động
- Điều chỉnh kích thước phông chữ và khoảng cách
- Thêm vùng cố định cho thông tin đơn hàng (sticky) trên desktop
- Bố cục grid trên desktop, chuyển thành bố cục cột trên mobile
- Căn giữa và điều chỉnh khoảng cách nút điều chỉnh số lượng

### 4. Trang Product Detail (Chi tiết sản phẩm)

- Cải thiện hiển thị hình ảnh sản phẩm
- Tối ưu hóa không gian trên thiết bị di động
- Điều chỉnh vị trí và kích thước của các thông tin sản phẩm
- Thêm trạng thái loading với spinner
- Cải thiện xử lý lỗi và hiển thị
- Thay đổi bố cục từ grid sang cột trên thiết bị di động

### 5. Trang Product List (Danh sách sản phẩm)

- Tạo sidebar danh mục sản phẩm cho màn hình lớn
- Chuyển đổi danh mục thành dropdown trên thiết bị di động
- Cải thiện grid sản phẩm với kích thước linh hoạt
- Điều chỉnh hiển thị phân trang phù hợp với kích thước màn hình
- Nút giỏ hàng nổi có thể hiển thị theo kích thước màn hình
- Tối ưu hóa không gian hiển thị sản phẩm

### 6. Admin Dashboard và các trang quản trị

- Áp dụng AdminLayout trên tất cả các trang admin
- Sử dụng các bảng có thể cuộn ngang trên thiết bị di động
- Điều chỉnh kích thước và bố cục của biểu đồ thống kê
- Điều chỉnh form tìm kiếm và bộ lọc
- Nút thêm mới trở nên rõ ràng hơn

## Kỹ thuật sử dụng

1. **Tailwind CSS Classes:**
   - Sử dụng các class responsive (`sm:`, `md:`, `lg:`, `xl:`)
   - Áp dụng Grid và Flexbox một cách linh hoạt
   - Kiểm soát hiển thị với `hidden` và `block`/`flex`

2. **React Hooks:**
   - Sử dụng `useRef` với `window.addEventListener` để theo dõi kích thước
   - `useState` cho trạng thái giao diện trên các thiết bị khác nhau

3. **ARIA và Accessibility:**
   - Tất cả các menu đều có thể truy cập được bằng bàn phím
   - Di chuyển tiêu điểm thích hợp khi các phần tử xuất hiện/biến mất

## Quy tắc chung

1. **Mobile-first Approach:**
   - Thiết kế ban đầu tập trung vào thiết bị di động
   - Mở rộng bố cục khi di chuyển lên màn hình lớn hơn

2. **Progressive Enhancement:**
   - Tất cả các chức năng chính đều được hiển thị trên mọi thiết bị
   - Bổ sung tính năng nâng cao trên màn hình lớn hơn

3. **Performance Optimization:**
   - Lazy loading cho hình ảnh
   - Xử lý lỗi hình ảnh để tăng trải nghiệm
   - Tối ưu hóa kích thước font và padding dựa trên kích thước màn hình

## Testing

Tất cả các thay đổi đã được kiểm tra trên các thiết bị sau:
- Điện thoại di động: iPhone SE, iPhone X, Samsung Galaxy
- Máy tính bảng: iPad, iPad Pro
- Laptop/Desktop: Các kích thước màn hình khác nhau

## Các điểm Break của responsive

- **sm:** 640px (điện thoại lớn/tablet nhỏ)
- **md:** 768px (máy tính bảng)
- **lg:** 1024px (laptop)
- **xl:** 1280px (desktop) 