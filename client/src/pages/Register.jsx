import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { userRegister } from '../store/userSlice';
import { useNotification } from '../contexts/NotificationContext';

const RegisterPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user, loading, error: reduxError } = useSelector((state) => state.user);
  const { showNotification } = useNotification();
  
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: ''
  });
  const [errorMessage, setErrorMessage] = useState('');
  const [isFormValid, setIsFormValid] = useState(false);

  // Chuyển hướng nếu đã đăng nhập
  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  // Validate form khi input thay đổi
  useEffect(() => {
    const { username, password, confirmPassword } = formData;
    const isValid = 
      username.trim().length >= 3 && 
      password.length >= 6 && 
      password === confirmPassword;
    
    setIsFormValid(isValid);
  }, [formData]);

  // Xử lý lỗi từ Redux
  useEffect(() => {
    if (reduxError) {
      setErrorMessage(reduxError);
    }
  }, [reduxError]);

  const validateForm = () => {
    const { username, password, confirmPassword } = formData;

    if (username.trim().length < 3) {
      setErrorMessage('Tên đăng nhập phải có ít nhất 3 ký tự');
      return false;
    }

    if (password.length < 6) {
      setErrorMessage('Mật khẩu phải có ít nhất 6 ký tự');
      return false;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Mật khẩu nhập lại không khớp');
      return false;
    }

    return true;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setErrorMessage(''); // Xóa thông báo lỗi khi người dùng nhập
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      const result = await dispatch(userRegister(formData)).unwrap();
      if (result) {
        // Hiển thị thông báo đăng ký thành công với đầy đủ thông tin
        showNotification(`Đăng ký tài khoản thành công! Chào mừng ${formData.username} đến với CurvoTech`, 'success');
        
        // Delay chuyển hướng một chút để người dùng có thể đọc thông báo
        setTimeout(() => {
          navigate('/login');
        }, 1500);
      }
    } catch (error) {
      setErrorMessage(
        error.response?.data?.message || 
        'Đăng ký thất bại, vui lòng thử lại!'
      );
    }
  };

  const handleClose = () => {
    setErrorMessage('');
  };

  return (
    <div className="bg-gradient-to-r from-green-400 to-blue-500 flex flex-col min-h-screen items-center justify-center px-4">
      {/* Hiển thị lỗi */}
      {errorMessage && (
        <div className="fixed top-5 right-5 bg-red-500 text-white p-4 rounded shadow-lg flex items-center">
          <i className="fas fa-exclamation-circle mr-2"></i>
          <span>{errorMessage}</span>
          <button 
            onClick={handleClose} 
            className="ml-4 text-white font-bold hover:text-red-200 transition-colors"
          >
            ✕
          </button>
        </div>
      )}

      {/* Register Form */}
      <div className="w-full max-w-md bg-white p-8 rounded-lg shadow-xl">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-8">Đăng ký tài khoản</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-gray-700 font-medium mb-2" htmlFor="username">
              <i className="fas fa-user mr-2"></i>Tên đăng nhập
            </label>
            <input
              className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 transition-all"
              id="username"
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="Nhập tên đăng nhập"
              required
              autoFocus
            />
          </div>
          <div>
            <label className="block text-gray-700 font-medium mb-2" htmlFor="password">
              <i className="fas fa-lock mr-2"></i>Mật khẩu
            </label>
            <input
              className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 transition-all"
              id="password"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Nhập mật khẩu"
              required
            />
          </div>
          <div>
            <label className="block text-gray-700 font-medium mb-2" htmlFor="confirmPassword">
              <i className="fas fa-check-circle mr-2"></i>Nhập lại mật khẩu
            </label>
            <input
              className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 transition-all"
              id="confirmPassword"
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Nhập lại mật khẩu"
              required
            />
          </div>
          <button
            className={`w-full p-3 rounded-lg font-bold text-white transition-all duration-300
              ${loading || !isFormValid 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-green-600 hover:bg-green-700 active:bg-green-800'}`}
            type="submit"
            disabled={loading || !isFormValid}
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Đang xử lý...
              </div>
            ) : (
              'Đăng ký'
            )}
          </button>
        </form>
        <div className="mt-6 space-y-2">
          <p className="text-sm text-gray-600 text-center">
            Đã có tài khoản? {' '}
            <Link to="/login" className="text-green-500 hover:text-green-700 hover:underline transition-colors">
              Đăng nhập ngay
            </Link>
          </p>
          <p className="text-sm text-gray-600 text-center">
            <Link to="/" className="text-green-500 hover:text-green-700 hover:underline transition-colors">
              ← Quay lại trang chủ
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;