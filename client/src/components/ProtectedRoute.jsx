import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import AccessDenied from '../pages/AccessDenied';

const ProtectedRoute = ({ children }) => {
  const { user } = useSelector((state) => state.user);
  const location = useLocation();

  // Kiểm tra xem người dùng đã đăng nhập chưa
  if (!user) {
    // Nếu chưa đăng nhập, chuyển hướng đến trang đăng nhập và lưu lại đường dẫn hiện tại
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Kiểm tra người dùng có quyền admin không
  if (user.role !== 'admin') {
    // Nếu không có quyền admin, hiển thị trang từ chối truy cập
    return <AccessDenied />;
  }

  // Nếu có quyền admin, cho phép truy cập
  return children;
};

export default ProtectedRoute; 