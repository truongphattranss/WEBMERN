import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';

const UserProtectedRoute = ({ children }) => {
  const { user } = useSelector((state) => state.user);
  const location = useLocation();

  // Kiểm tra xem người dùng đã đăng nhập chưa
  if (!user) {
    // Nếu chưa đăng nhập, chuyển hướng đến trang đăng nhập và lưu lại đường dẫn hiện tại
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Nếu đã đăng nhập, cho phép truy cập
  return children;
};

export default UserProtectedRoute; 