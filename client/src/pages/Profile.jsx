import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useNotification } from '../contexts/NotificationContext';
import { getProfile, changePassword } from '../services/userService';

const Profile = () => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [passwordFormErrors, setPasswordFormErrors] = useState({});
  const [touchedFields, setTouchedFields] = useState({
    currentPassword: false,
    newPassword: false,
    confirmPassword: false
  });
  const navigate = useNavigate();
  const { showNotification } = useNotification();

  useEffect(() => {
    let isMounted = true;
    console.log('Profile useEffect triggered once');

    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          console.log('No token found, redirecting to login');
          navigate('/login');
          return;
        }

        console.log('Token found, fetching profile...');
        const response = await getProfile();
        
        if (isMounted) {
          setUser(response.user);
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
        if (error.response && error.response.status === 401) {
          // Token expired or invalid
          localStorage.removeItem('token');
          if (isMounted) {
            navigate('/login');
          }
        } else if (isMounted) {
          setError('Có lỗi xảy ra khi tải thông tin người dùng');
          setIsLoading(false);
        }
      }
    };

    fetchProfile();

    return () => {
      isMounted = false;
    };
  }, [navigate]); // Added navigate to the dependency array

  // Validate mật khẩu hiện tại
  const validateCurrentPassword = (value) => {
    if (!value) {
      return 'Vui lòng nhập mật khẩu hiện tại';
    }
    return '';
  };

  // Validate mật khẩu mới
  const validateNewPassword = (value) => {
    if (!value) {
      return 'Vui lòng nhập mật khẩu mới';
    }
    if (value.length < 6) {
      return 'Mật khẩu mới phải có ít nhất 6 ký tự';
    }
    if (value === passwordData.currentPassword) {
      return 'Mật khẩu mới không được trùng với mật khẩu hiện tại';
    }
    return '';
  };

  // Validate xác nhận mật khẩu
  const validateConfirmPassword = (value) => {
    if (!value) {
      return 'Vui lòng xác nhận mật khẩu mới';
    }
    if (value !== passwordData.newPassword) {
      return 'Mật khẩu xác nhận không khớp với mật khẩu mới';
    }
    return '';
  };

  // Validate real-time khi người dùng nhập xong từng trường
  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouchedFields(prev => ({
      ...prev,
      [name]: true
    }));

    let errorMessage = '';
    switch (name) {
      case 'currentPassword':
        errorMessage = validateCurrentPassword(value);
        break;
      case 'newPassword':
        errorMessage = validateNewPassword(value);
        // Nếu mật khẩu mới thay đổi, cũng cần kiểm tra lại trường confirm
        if (touchedFields.confirmPassword && passwordData.confirmPassword) {
          const confirmError = validateConfirmPassword(passwordData.confirmPassword);
          setPasswordFormErrors(prev => ({
            ...prev,
            confirmPassword: confirmError
          }));
        }
        break;
      case 'confirmPassword':
        errorMessage = validateConfirmPassword(value);
        break;
      default:
        break;
    }

    setPasswordFormErrors(prev => ({
      ...prev,
      [name]: errorMessage
    }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Real-time validation khi người dùng đã từng tương tác với trường này
    if (touchedFields[name]) {
      let errorMessage = '';
      switch (name) {
        case 'currentPassword':
          errorMessage = validateCurrentPassword(value);
          break;
        case 'newPassword':
          errorMessage = validateNewPassword(value);
          break;
        case 'confirmPassword':
          errorMessage = validateConfirmPassword(value);
          break;
        default:
          break;
      }

      setPasswordFormErrors(prev => ({
        ...prev,
        [name]: errorMessage
      }));
    }
  };

  const validatePasswordForm = () => {
    // Đánh dấu tất cả các trường đã được tương tác
    setTouchedFields({
      currentPassword: true,
      newPassword: true,
      confirmPassword: true
    });

    const currentPasswordError = validateCurrentPassword(passwordData.currentPassword);
    const newPasswordError = validateNewPassword(passwordData.newPassword);
    const confirmPasswordError = validateConfirmPassword(passwordData.confirmPassword);
    
    const errors = {
      currentPassword: currentPasswordError,
      newPassword: newPasswordError,
      confirmPassword: confirmPasswordError
    };
    
    setPasswordFormErrors(errors);
    return !currentPasswordError && !newPasswordError && !confirmPasswordError;
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    
    if (!validatePasswordForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await changePassword(
        passwordData.currentPassword,
        passwordData.newPassword
      );
      
      showNotification('Đổi mật khẩu thành công!', 'success');
      
      // Reset form
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setTouchedFields({
        currentPassword: false,
        newPassword: false,
        confirmPassword: false
      });
      setPasswordFormErrors({});
    } catch (error) {
      console.error('Error changing password:', error);
      
      // Xử lý lỗi theo thông điệp được trả về
      if (error.response?.data?.message) {
        const errorMessage = error.response.data.message;
        
        // Trường hợp mật khẩu hiện tại không đúng
        if (errorMessage.includes('hiện tại') || 
            errorMessage.includes('current password') || 
            errorMessage.includes('không đúng')) {
          
          // Chỉ hiển thị lỗi, không đăng xuất
          setPasswordFormErrors(prev => ({
            ...prev,
            currentPassword: 'Mật khẩu hiện tại không đúng'
          }));
          
          // Thông báo lỗi
          showNotification('Mật khẩu hiện tại không đúng', 'error');
        } else {
          // Các lỗi khác
          showNotification(errorMessage || 'Có lỗi xảy ra khi đổi mật khẩu', 'error');
          
          // Kiểm tra nếu token còn tồn tại (chưa bị xóa bởi interceptor)
          if (!localStorage.getItem('token')) {
            // Token đã bị xóa bởi interceptor do lỗi xác thực
            navigate('/login');
          }
        }
      } else {
        // Các lỗi khác không từ API
        showNotification(error.message || 'Có lỗi xảy ra khi đổi mật khẩu', 'error');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div className="text-center py-10">Đang tải thông tin...</div>;
  }

  if (error) {
    return <div className="text-center py-10 text-red-500">{error}</div>;
  }

  return (
    <div className="container mx-auto p-4">
      {user ? (
        <div className="max-w-4xl mx-auto">
          <div className="bg-white shadow-md rounded-lg p-6 mb-6">
            <h1 className="text-2xl font-bold mb-4">Thông tin tài khoản</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-gray-700 mb-2">
                  <span className="font-semibold">Tên đăng nhập:</span> {user.username}
                </p>
                <p className="text-gray-700">
                  <span className="font-semibold">Vai trò:</span> {user.role === 'admin' ? 'Quản trị viên' : 'Người dùng'}
                </p>

                {/* Add Order History Link */}
                <div className="mt-4 pt-3 border-t border-gray-200">
                  <Link 
                    to="/my-orders" 
                    className="inline-flex items-center text-indigo-600 hover:text-indigo-800"
                  >
                    <i className="bi bi-bag mr-2"></i>
                    Xem lịch sử đơn hàng
                  </Link>
                </div>
              </div>
              
              <div className="p-4 bg-gray-50 rounded-lg">
                <h2 className="text-xl font-semibold mb-3">Đổi mật khẩu</h2>
                <form onSubmit={handlePasswordSubmit}>
                  <div className="mb-3">
                    <label className="block text-gray-700 text-sm font-medium mb-1" htmlFor="currentPassword">
                      Mật khẩu hiện tại
                    </label>
                    <input
                      id="currentPassword"
                      type="password"
                      name="currentPassword"
                      className={`w-full p-2 border rounded ${passwordFormErrors.currentPassword ? 'border-red-500' : 'border-gray-300'}`}
                      value={passwordData.currentPassword}
                      onChange={handlePasswordChange}
                      onBlur={handleBlur}
                    />
                    {passwordFormErrors.currentPassword && (
                      <p className="text-red-500 text-xs mt-1">{passwordFormErrors.currentPassword}</p>
                    )}
                  </div>
                  
                  <div className="mb-3">
                    <label className="block text-gray-700 text-sm font-medium mb-1" htmlFor="newPassword">
                      Mật khẩu mới
                    </label>
                    <input
                      id="newPassword"
                      type="password"
                      name="newPassword"
                      className={`w-full p-2 border rounded ${passwordFormErrors.newPassword ? 'border-red-500' : 'border-gray-300'}`}
                      value={passwordData.newPassword}
                      onChange={handlePasswordChange}
                      onBlur={handleBlur}
                    />
                    {passwordFormErrors.newPassword && (
                      <p className="text-red-500 text-xs mt-1">{passwordFormErrors.newPassword}</p>
                    )}
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-medium mb-1" htmlFor="confirmPassword">
                      Xác nhận mật khẩu mới
                    </label>
                    <input
                      id="confirmPassword"
                      type="password"
                      name="confirmPassword"
                      className={`w-full p-2 border rounded ${passwordFormErrors.confirmPassword ? 'border-red-500' : 'border-gray-300'}`}
                      value={passwordData.confirmPassword}
                      onChange={handlePasswordChange}
                      onBlur={handleBlur}
                    />
                    {passwordFormErrors.confirmPassword && (
                      <p className="text-red-500 text-xs mt-1">{passwordFormErrors.confirmPassword}</p>
                    )}
                  </div>
                  
                  <button
                    type="submit"
                    className={`bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition duration-200 ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Đang xử lý...' : 'Đổi mật khẩu'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-10">
          <p>Vui lòng đăng nhập để xem thông tin tài khoản</p>
        </div>
      )}
    </div>
  );
};

export default Profile; 