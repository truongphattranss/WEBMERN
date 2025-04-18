import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { userLogin } from '../store/userSlice';
import { useNotification } from '../contexts/NotificationContext';

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { user, loading, error: reduxError } = useSelector((state) => state.user);
  const { showNotification } = useNotification();
  
  // Sử dụng useMemo để tránh tạo lại đối tượng mỗi khi component render
  const fromLocation = useMemo(() => 
    location.state?.from || { pathname: '/' }
  , [location.state]);
  
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [errorMessage, setErrorMessage] = useState('');
  const [isFormValid, setIsFormValid] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate(fromLocation.pathname);
    }
  }, [user, navigate, fromLocation]);

  // Validate form whenever input changes
  useEffect(() => {
    setIsFormValid(formData.username.trim() !== '' && formData.password.trim() !== '');
  }, [formData]);

  // Handle Redux errors
  useEffect(() => {
    if (reduxError) {
      setErrorMessage(reduxError);
    }
  }, [reduxError]);

  const handleClose = () => {
    setErrorMessage('');
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value.trim()
    }));
    setErrorMessage(''); // Clear error when user types
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isFormValid) {
      setErrorMessage('Vui lòng nhập đầy đủ thông tin!');
      return;
    }

    try {
      const result = await dispatch(userLogin(formData)).unwrap();
      if (result) {
        showNotification(`Đăng nhập thành công! Chào mừng ${result.user.username || formData.username} trở lại`, 'success');
        
        setTimeout(() => {
          // Chuyển hướng đến trang trước đó hoặc trang chủ
          navigate(fromLocation.pathname);
        }, 1500);
      }
    } catch (error) {
      const errorMsg = error.response?.data?.message 
        || error.message 
        || (error.code === 'ERR_NETWORK' 
          ? 'Không thể kết nối đến máy chủ' 
          : 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin!');
      setErrorMessage(errorMsg);
    }
  };

  return (
    <div className="bg-gradient-to-r from-blue-500 to-purple-600 flex flex-col min-h-screen items-center justify-center px-4">
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

      {/* Login Form */}
      <div className="w-full max-w-md bg-white p-8 rounded-lg shadow-xl">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-8">Đăng nhập</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-gray-700 font-medium mb-2" htmlFor="username">
              <i className="fas fa-user mr-2"></i>Tên đăng nhập
            </label>
            <input
              className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all"
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
              className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all"
              id="password"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Nhập mật khẩu"
              required
            />
          </div>
          <button
            className={`w-full p-3 rounded-lg font-bold text-white transition-all duration-300
              ${loading || !isFormValid 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800'}`}
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
              'Đăng nhập'
            )}
          </button>
        </form>
        <div className="mt-6 space-y-2">
          <p className="text-sm text-gray-600 text-center">
            Chưa có tài khoản? {' '}
            <Link to="/register" className="text-blue-500 hover:text-blue-700 hover:underline transition-colors">
              Đăng ký ngay
            </Link>
          </p>
          <p className="text-sm text-gray-600 text-center">
            <Link to="/" className="text-blue-500 hover:text-blue-700 hover:underline transition-colors">
              ← Quay lại trang chủ
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;