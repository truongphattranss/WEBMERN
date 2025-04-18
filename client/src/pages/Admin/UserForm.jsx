import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getUserById, createUser, updateUser } from '../../services/adminUserService';
import { useNotification } from '../../contexts/NotificationContext';
import Spinner from '../../components/Spinner';
import AdminSidebar from '../../components/AdminSidebar';

const UserForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!id;
  const { showNotification } = useNotification();
  
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    role: 'user'
  });
  
  const [loading, setLoading] = useState(isEditMode);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  
  const fetchUserData = useCallback(async () => {
    if (!isEditMode) return;
    
    try {
      setLoading(true);
      const result = await getUserById(id);
      
      if (result.success) {
        const { username, role } = result.user;
        setFormData({
          username,
          password: '', // Không hiển thị mật khẩu hiện tại
          role: role || 'user'
        });
      } else {
        showNotification(result.message || 'Không thể tải thông tin người dùng', 'error');
        navigate('/admin/users');
      }
    } catch (err) {
      console.error('Error loading user:', err);
      showNotification('Đã xảy ra lỗi khi tải thông tin người dùng', 'error');
      navigate('/admin/users');
    } finally {
      setLoading(false);
    }
  }, [id, isEditMode, navigate, showNotification]);
  
  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);
  
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.username.trim()) {
      newErrors.username = 'Tên đăng nhập là bắt buộc';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Tên đăng nhập phải có ít nhất 3 ký tự';
    }
    
    if (!isEditMode && !formData.password.trim()) {
      newErrors.password = 'Mật khẩu là bắt buộc';
    } else if (formData.password.trim() && formData.password.length < 6) {
      newErrors.password = 'Mật khẩu phải có ít nhất 6 ký tự';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear validation error when field is edited
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      setSubmitting(true);
      
      // Prepare data for API call
      const userData = { ...formData };
      if (isEditMode && !userData.password.trim()) {
        delete userData.password; // Don't send empty password on edit
      }
      
      const result = isEditMode
        ? await updateUser(id, userData)
        : await createUser(userData);
      
      if (result.success) {
        showNotification(
          result.message || `Người dùng đã ${isEditMode ? 'cập nhật' : 'tạo'} thành công`,
          'success'
        );
        navigate('/admin/users');
      } else {
        showNotification(result.message || 'Có lỗi xảy ra, vui lòng thử lại', 'error');
      }
    } catch (err) {
      console.error('Error saving user:', err);
      showNotification('Đã xảy ra lỗi khi lưu thông tin người dùng', 'error');
    } finally {
      setSubmitting(false);
    }
  };
  
  if (loading) {
    return <Spinner />;
  }
  
  return (
    <div className="flex h-screen bg-gray-50">
      <AdminSidebar />
      
      <div className="flex-1 p-8 overflow-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-800">
            {isEditMode ? 'Chỉnh Sửa Người Dùng' : 'Thêm Người Dùng Mới'}
          </h1>
          <Link 
            to="/admin/users" 
            className="text-indigo-600 hover:text-indigo-900"
          >
            &larr; Quay lại danh sách người dùng
          </Link>
        </div>
        
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <form onSubmit={handleSubmit} className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Username Field */}
              <div>
                <label 
                  htmlFor="username" 
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Tên đăng nhập <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border rounded-md focus:ring-indigo-500 focus:border-indigo-500 ${
                    errors.username ? 'border-red-500' : 'border-gray-300'
                  }`}
                  disabled={isEditMode && formData.username === 'admin'} // Không cho phép sửa tài khoản admin
                />
                {errors.username && (
                  <p className="mt-1 text-sm text-red-500">{errors.username}</p>
                )}
              </div>
              
              {/* Password Field */}
              <div>
                <label 
                  htmlFor="password" 
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Mật khẩu {!isEditMode && <span className="text-red-500">*</span>}
                  {isEditMode && <span className="text-sm text-gray-500 ml-1">(để trống nếu không thay đổi)</span>}
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border rounded-md focus:ring-indigo-500 focus:border-indigo-500 ${
                    errors.password ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.password && (
                  <p className="mt-1 text-sm text-red-500">{errors.password}</p>
                )}
              </div>
              
              {/* Role Field */}
              <div>
                <label 
                  htmlFor="role" 
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Vai trò <span className="text-red-500">*</span>
                </label>
                <select
                  id="role"
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  disabled={isEditMode && formData.username === 'admin'} // Không cho phép sửa vai trò tài khoản admin
                >
                  <option value="user">Người dùng</option>
                  <option value="admin">Quản trị viên</option>
                </select>
              </div>
            </div>
            
            <div className="mt-8 flex justify-end">
              <Link
                to="/admin/users"
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 mr-4 hover:bg-gray-50"
              >
                Hủy
              </Link>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-indigo-300"
              >
                {submitting ? 'Đang lưu...' : isEditMode ? 'Cập nhật' : 'Tạo mới'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default UserForm; 