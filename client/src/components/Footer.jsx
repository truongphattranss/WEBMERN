import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-gray-800 text-white py-8">
      <div className="container mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 px-6 items-center">

        {/* Logo & Description */}
        <div className="flex flex-col items-center md:items-start">
          <div className="flex items-center mb-4">
            <img
              src="https://i.pinimg.com/736x/43/5d/09/435d096b52b0be4816d214c05ab0c22e.jpg"
              alt="CurvoTech"
              className="h-14 w-14 rounded-full mr-3"
            />
            <span className="text-2xl font-bold">CurvoTech</span>
          </div>
          <p className="text-gray-400 text-center md:text-left">
            Nơi cung cấp dịch vụ công nghệ hàng đầu.
          </p>
        </div>

        {/* Contact Info */}
        <div className="flex flex-col items-center md:items-start">
          <h3 className="text-lg font-semibold mb-4">Liên hệ</h3>
          <p className="text-gray-400 mb-2">
            Số điện thoại: +84 123 456 789
          </p>
          <p className="text-gray-400">
            Email: support@curvotech.com
          </p>
        </div>

      </div>

      {/* Copyright */}
      <div className="border-t border-gray-700 mt-8 pt-4 text-center text-gray-500 text-sm">
        © 2025 CurvoTech. All rights reserved.
      </div>
    </footer>
  );
};

export default Footer;
