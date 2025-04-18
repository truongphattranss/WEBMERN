import React, { useState } from 'react';
import AdminSidebar from './AdminSidebar';

const AdminLayout = ({ children }) => {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const toggleMobileSidebar = () => {
    setIsMobileSidebarOpen(!isMobileSidebarOpen);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <AdminSidebar 
        isMobileSidebarOpen={isMobileSidebarOpen}
        onToggleMobileSidebar={toggleMobileSidebar}
      />
      
      <div className="flex-1 flex flex-col overflow-hidden md:ml-16 lg:ml-56 transition-all duration-300">
        {/* Admin Mobile Header */}
        <div className="bg-white shadow-sm md:hidden">
          <div className="flex items-center justify-between p-4">
            <button 
              onClick={toggleMobileSidebar} 
              className="text-gray-700 focus:outline-none"
            >
              <i className="bi bi-list text-xl"></i>
            </button>
            <h1 className="text-xl font-bold text-indigo-600">CurvoTech Admin</h1>
            <div className="w-6"></div> {/* Placeholder for flexbox alignment */}
          </div>
        </div>
        
        {/* Admin Content */}
        <div className="flex-1 overflow-auto p-4 md:p-6">
          <div className="max-w-full px-4">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLayout; 