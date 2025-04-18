import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { userLogout } from '../store/userSlice';
import { useNotification } from '../contexts/NotificationContext';

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.user);
  const { showNotification } = useNotification();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  
  const mobileMenuRef = useRef(null);
  const searchFormRef = useRef(null);

  // Kiểm tra xem có thông báo trong state location không
  useEffect(() => {
    console.log("location state:", location.state);
    if (location.state?.notification) {
      showNotification(
        location.state.notification.message,
        location.state.notification.type || 'success'
      );
      
      // Xóa thông báo khỏi location state để không hiển thị lại khi refresh
      window.history.replaceState({}, document.title);
    }
  }, [location.state, showNotification]);

  // Đóng mobile menu khi click bên ngoài
  useEffect(() => {
    function handleClickOutside(event) {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target)) {
        setMobileMenuOpen(false);
      }
      if (searchFormRef.current && !searchFormRef.current.contains(event.target) && window.innerWidth < 768) {
        setMobileSearchOpen(false);
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Xử lý tìm kiếm
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
      setMobileSearchOpen(false);
      setMobileMenuOpen(false);
    }
  };
  
  // Xử lý nhập tìm kiếm, loại bỏ ký tự đặc biệt
  const handleSearchChange = (e) => {
    // Sanitize input by removing special characters
    const rawValue = e.target.value;
    const sanitizedValue = rawValue.replace(/[+\-.,/\\[\]{}()*^%$#@!~`|<>?=&]/g, '');
    
    // Update input field with sanitized value
    setSearchQuery(sanitizedValue);
  };

  // Xử lý đăng xuất
const handleLogout = async () => {
  if (isLoggingOut) return;
  
  try {
    setIsLoggingOut(true);
    await dispatch(userLogout()).unwrap();
    
    // Xóa token
    localStorage.removeItem('token');
    
    // Hiển thị thông báo
    showNotification('Đăng xuất thành công!', 'success');

    // Đợi 1 giây rồi chuyển hướng
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Chuyển hướng về trang login 
    navigate('/login', { replace: true });

  } catch (error) {
    console.error('Lỗi đăng xuất:', error);
    showNotification('Đăng xuất thất bại!', 'error');
  } finally {
    setIsLoggingOut(false);
    setMobileMenuOpen(false);
  }
};

  return (
    <header className="bg-gray shadow-md relative">
      <div className="container mx-auto p-4 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center">
          <img
            src="https://i.pinimg.com/736x/43/5d/09/435d096b52b0be4816d214c05ab0c22e.jpg"
            alt="Logo"
            className="h-12 w-12 sm:h-16 sm:w-16 md:h-20 md:w-20 rounded-full"
          />
          <span className="ml-2 text-lg sm:text-xl font-bold">
            <Link to="/" className="text-gray-800 hover:text-blue-500">
              CurvoTech
            </Link>
          </span>
        </div>

        {/* Navigation Links - Desktop */}
        <nav className="hidden md:flex space-x-4">
          <strong>
            <Link to="/" className="text-gray-700 hover:text-blue-500 mx-4">
              Trang chủ
            </Link>
            <Link to="/products" className="text-gray-700 hover:text-blue-500 mx-4">
              Sản phẩm
            </Link>
            <Link to="/about" className="text-gray-700 hover:text-blue-500 mx-4">
              Giới thiệu
            </Link>
          </strong>
        </nav>

        {/* Search Bar - Desktop */}
        <div className="hidden md:flex items-center space-x-2">
          <form ref={searchFormRef} onSubmit={handleSearchSubmit} className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              className="border border-gray-300 rounded-full py-2 px-4 pl-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Tìm kiếm sản phẩm..."
            />
            <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
          </form>
        </div>

        {/* Search Icon - Mobile */}
        <button 
          className="md:hidden p-2 text-gray-700 hover:text-blue-500" 
          onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
        >
          <i className="fas fa-search text-xl"></i>
        </button>

        {/* Login/Logout - Desktop */}
        <div className="hidden md:flex items-center space-x-4">
          {user ? (
            <>
              {user.role === 'admin' && (
                <Link
                  to="/admin"
                  className="text-gray-700 hover:text-blue-500 flex items-center"
                >
                  <i className="fas fa-cog mr-2"></i> Quản lý Admin
                </Link>
              )}
              <Link
                to="/profile"
                className="text-gray-700 hover:text-blue-500 flex items-center"
              >
                <i className="fas fa-user mr-2"></i> {user.username}
              </Link>
              <Link
                to="/my-orders"
                className="text-gray-700 hover:text-blue-500 flex items-center"
              >
                <i className="fas fa-shopping-bag mr-2"></i> Đơn hàng của tôi
              </Link>
              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className={`text-gray-700 hover:text-blue-500 flex items-center
                  ${isLoggingOut ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {isLoggingOut ? (
                  <>
                    <i className="fas fa-spinner fa-spin mr-2"></i> Đang xử lý...
                  </>
                ) : (
                  <>
                    <i className="fas fa-sign-out-alt mr-2"></i> Đăng xuất
                  </>
                )}
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="text-gray-700 hover:text-blue-500 flex items-center"
              >
                <i className="fas fa-sign-in-alt mr-2"></i> Đăng nhập
              </Link>
              <Link
                to="/register"
                className="text-gray-700 hover:text-blue-500 flex items-center"
              >
                <i className="fas fa-user-plus mr-2"></i> Đăng ký
              </Link>
            </>
          )}
        </div>

        {/* Hamburger Menu - Mobile */}
        <button 
          className="md:hidden p-2 text-gray-700 hover:text-blue-500 ml-2" 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          <i className={`fas ${mobileMenuOpen ? 'fa-times' : 'fa-bars'} text-xl`}></i>
        </button>
      </div>

      {/* Search Bar - Mobile */}
      {mobileSearchOpen && (
        <div className="md:hidden px-4 pb-4">
          <form ref={searchFormRef} onSubmit={handleSearchSubmit} className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              className="w-full border border-gray-300 rounded-full py-2 px-4 pl-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Tìm kiếm sản phẩm..."
              autoFocus
            />
            <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
          </form>
        </div>
      )}

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div 
          ref={mobileMenuRef}
          className="md:hidden bg-white shadow-lg absolute top-full left-0 right-0 z-50 overflow-hidden transition-all duration-300"
          style={{maxHeight: mobileMenuOpen ? '1000px' : '0'}}
        >
          <nav className="flex flex-col p-4">
            <Link 
              to="/" 
              className="py-3 px-4 text-gray-700 hover:bg-gray-100 rounded flex items-center"
              onClick={() => setMobileMenuOpen(false)}
            >
              <i className="fas fa-home mr-3"></i> Trang chủ
            </Link>
            <Link 
              to="/products" 
              className="py-3 px-4 text-gray-700 hover:bg-gray-100 rounded flex items-center"
              onClick={() => setMobileMenuOpen(false)}
            >
              <i className="fas fa-box mr-3"></i> Sản phẩm
            </Link>
            <Link 
              to="/about" 
              className="py-3 px-4 text-gray-700 hover:bg-gray-100 rounded flex items-center"
              onClick={() => setMobileMenuOpen(false)}
            >
              <i className="fas fa-info-circle mr-3"></i> Giới thiệu
            </Link>
            
            <div className="border-t border-gray-200 my-2"></div>
            
            {user ? (
              <>
                {user.role === 'admin' && (
                  <Link
                    to="/admin"
                    className="py-3 px-4 text-gray-700 hover:bg-gray-100 rounded flex items-center"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <i className="fas fa-cog mr-3"></i> Quản lý Admin
                  </Link>
                )}
                <Link
                  to="/profile"
                  className="py-3 px-4 text-gray-700 hover:bg-gray-100 rounded flex items-center"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <i className="fas fa-user mr-3"></i> {user.username}
                </Link>
                <Link
                  to="/my-orders"
                  className="py-3 px-4 text-gray-700 hover:bg-gray-100 rounded flex items-center"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <i className="fas fa-shopping-bag mr-3"></i> Đơn hàng của tôi
                </Link>
                <button
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className={`py-3 px-4 text-gray-700 hover:bg-gray-100 rounded flex items-center w-full text-left
                    ${isLoggingOut ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {isLoggingOut ? (
                    <>
                      <i className="fas fa-spinner fa-spin mr-3"></i> Đang xử lý...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-sign-out-alt mr-3"></i> Đăng xuất
                    </>
                  )}
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="py-3 px-4 text-gray-700 hover:bg-gray-100 rounded flex items-center"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <i className="fas fa-sign-in-alt mr-3"></i> Đăng nhập
                </Link>
                <Link
                  to="/register"
                  className="py-3 px-4 text-gray-700 hover:bg-gray-100 rounded flex items-center"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <i className="fas fa-user-plus mr-3"></i> Đăng ký
                </Link>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;