import React from 'react';
import { Link } from 'react-router-dom';

const AccessDenied = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="max-w-md p-8 bg-white shadow-lg rounded-lg text-center">
        <div className="text-red-500 mb-4">
          <i className="fas fa-exclamation-triangle text-6xl"></i>
        </div>
        <h1 className="text-3xl font-bold text-gray-800 mb-4">Truy cập bị từ chối</h1>
        <p className="text-gray-600 mb-6">
          Bạn không có quyền truy cập vào trang này. Vui lòng liên hệ với quản trị viên
          nếu bạn tin rằng đây là lỗi.
        </p>
        <div className="flex justify-center space-x-4">
          <Link
            to="/"
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            Về trang chủ
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AccessDenied; 