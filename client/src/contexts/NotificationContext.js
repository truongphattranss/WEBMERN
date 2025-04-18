import React, { createContext, useContext, useState } from 'react';

// Create context
const NotificationContext = createContext(null);

// Custom hook to use the notification context
export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

// Provider component
export const NotificationProvider = ({ children }) => {
  const [notification, setNotification] = useState({
    show: false,
    message: '',
    type: 'success', // 'success' or 'error'
  });

  // Show a notification
  const showNotification = (message, type = 'success') => {
    setNotification({
      show: true,
      message,
      type,
    });

    // Auto-hide after 8 seconds
    setTimeout(() => {
      setNotification(prev => ({ ...prev, show: false }));
    }, 8000);
  };

  // Hide notification
  const hideNotification = () => {
    setNotification(prev => ({ ...prev, show: false }));
  };

  // Context value
  const value = {
    notification,
    showNotification,
    hideNotification,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
      {/* Render notification here so it's available throughout the app */}
      {notification.show && (
        <div
          className={`fixed top-5 right-5 ${
            notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'
          } text-white p-4 rounded shadow-lg flex items-center z-50 animate-pulse`}
          style={{
            animation: 'fadeInRight 0.3s ease-in-out',
            boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)',
          }}
        >
          <i
            className={`${
              notification.type === 'success'
                ? 'fas fa-check-circle'
                : 'fas fa-exclamation-circle'
            } mr-2 text-xl`}
          ></i>
          <span>{notification.message}</span>
          <button
            onClick={hideNotification}
            className="ml-4 text-white font-bold hover:text-gray-200 transition-colors"
          >
            ✕
          </button>
        </div>
      )}
      <style jsx="true">{`
        @keyframes fadeInRight {
          from {
            opacity: 0;
            transform: translateX(30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
    </NotificationContext.Provider>
  );
}; 