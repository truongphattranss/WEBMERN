import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import 'bootstrap-icons/font/bootstrap-icons.css';

const AdminSidebar = ({ isMobileSidebarOpen, onToggleMobileSidebar }) => {
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(window.innerWidth < 1024);
  
  useEffect(() => {
    const handleResize = () => {
      setIsCollapsed(window.innerWidth < 1024);
    };
    
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const menuItems = [
    { path: '/admin/dashboard', icon: 'bi bi-speedometer2', label: 'Dashboard' },
    { path: '/admin/products', icon: 'bi bi-box', label: 'Sản phẩm' },
    { path: '/admin/categories', icon: 'bi bi-tags', label: 'Danh mục' },
    { path: '/admin/orders', icon: 'bi bi-receipt', label: 'Đơn hàng' },
    { path: '/admin/users', icon: 'bi bi-people', label: 'Người dùng' },
    { path: '/', icon: 'bi bi-house', label: 'Trang chủ' }
  ];

  // Check if current path starts with the menu item path
  const isActive = (path) => {
    if (path === '/admin/dashboard') {
      return location.pathname === '/admin' || location.pathname === '/admin/dashboard';
    }
    
    // Special case for home path to prevent it from matching all routes
    if (path === '/') {
      return location.pathname === '/';
    }
    
    return location.pathname.startsWith(path);
  };

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  const sidebarClass = `bg-white shadow-lg transition-all duration-300 ${
    isCollapsed ? 'w-16' : 'w-56'
  } ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'} z-30 h-screen fixed md:sticky top-0 left-0`;

  return (
    <>
      {/* Overlay for mobile */}
      {isMobileSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden" 
          onClick={onToggleMobileSidebar}
        ></div>
      )}
      
      <div className={sidebarClass}>
        <div className={`p-4 flex ${isCollapsed ? 'justify-center' : 'justify-between'} items-center border-b border-gray-200`}>
          {!isCollapsed && (
            <div className="flex items-center">
              <img
                src="https://i.pinimg.com/736x/43/5d/09/435d096b52b0be4816d214c05ab0c22e.jpg"
                alt="Logo"
                className="h-10 w-10 rounded-full mr-2"
              />
              <h1 className="text-xl font-bold text-indigo-600">CurvoTech</h1>
            </div>
          )}
          {isCollapsed && (
            <img
              src="https://i.pinimg.com/736x/43/5d/09/435d096b52b0be4816d214c05ab0c22e.jpg"
              alt="Logo"
              className="h-10 w-10 rounded-full"
            />
          )}
          <button 
            className="text-gray-500 hover:text-indigo-600 md:block hidden"
            onClick={toggleCollapse}
          >
            <i className={`bi ${isCollapsed ? 'bi-chevron-right' : 'bi-chevron-left'}`}></i>
          </button>
          <button 
            className="text-gray-500 hover:text-indigo-600 md:hidden block"
            onClick={onToggleMobileSidebar}
          >
            <i className="bi bi-x-lg"></i>
          </button>
        </div>
        <nav className="mt-4 overflow-y-auto" style={{ height: 'calc(100vh - 76px)' }}>
          <ul>
            {menuItems.map((item) => (
              <li
                key={item.path}
                className={`px-3 py-3 ${
                  isActive(item.path)
                    ? 'bg-indigo-50 text-indigo-600 border-r-4 border-indigo-600'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Link 
                  to={item.path} 
                  className={`flex ${isCollapsed ? 'justify-center' : 'items-center'} ${isCollapsed ? 'flex-col' : ''}`}
                  onClick={window.innerWidth < 768 ? onToggleMobileSidebar : undefined}
                >
                  <i className={`${item.icon} ${isCollapsed ? 'text-xl mb-1' : 'mr-3'}`}></i>
                  {(!isCollapsed || window.innerWidth < 768) && (
                    <span className={`font-medium ${isCollapsed ? 'text-xs' : ''}`}>{item.label}</span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </>
  );
};

export default AdminSidebar; 