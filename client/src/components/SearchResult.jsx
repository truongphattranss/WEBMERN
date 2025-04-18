import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import axios from 'axios';
import handleAddToCart from '../services/cartService';

// CSS animation styles
const styles = {
  fadeIn: `
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(-10px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .notification-animate {
      animation: fadeIn 0.3s ease-out forwards;
    }
  `
};

const SearchResult = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const productsPerPage = 9; // Hiển thị 9 sản phẩm mỗi trang
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });

  useEffect(() => {
    const fetchProducts = async () => {
      if (!query) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const res = await axios.get(`/api/search/search?q=${encodeURIComponent(query)}&page=${currentPage}&limit=${productsPerPage}`);
        setProducts(res.data.products);
        setTotalPages(res.data.totalPages);
        setCurrentPage(res.data.currentPage);
      } catch (err) {
        console.error('Error searching products:', err);
        setError('Có lỗi xảy ra khi tìm kiếm sản phẩm');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [query, currentPage]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  // Hiển thị thông báo
  const showNotification = (message, type) => {
    setNotification({ show: true, message, type });
    
    // Tự động ẩn thông báo sau 3 giây
    setTimeout(() => {
      setNotification({ show: false, message: '', type: '' });
    }, 3000);
  };

  if (!query) {
    return (
      <div className="container mx-auto p-4 text-center">
        <h2 className="text-xl mb-4">Vui lòng nhập từ khóa tìm kiếm</h2>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <style>{styles.fadeIn}</style>
      
      <h2 className="text-xl font-bold mb-4">Kết quả tìm kiếm cho: "{query}"</h2>
      
      {notification.show && (
        <div 
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg notification-animate ${
            notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'
          } text-white flex items-center`}
        >
          <span className="mr-2">
            {notification.type === 'success' ? '✓' : '✕'}
          </span>
          {notification.message}
        </div>
      )}

      {loading ? (
        <div className="text-center py-10">
          <div className="spinner-border text-primary" role="status">
            <span className="sr-only">Đang tải...</span>
          </div>
        </div>
      ) : error ? (
        <div className="text-center py-10 text-red-500">
          {error}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-10">
          <p>Không tìm thấy sản phẩm nào phù hợp với từ khóa "{query}"</p>
        </div>
      ) : (
        <div className="container mx-auto p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => (
              <div key={product._id} className="bg-white rounded-lg shadow-md overflow-hidden flex flex-col h-full hover:shadow-lg transition-shadow duration-300">
                <Link to={`/products/${product._id}`} className="flex flex-col flex-grow">
                  <div className="w-full h-40 overflow-hidden">
                    {product.image ? (
                      <img 
                        src={`${product.image}`}
                        alt={product.name} 
                        className="w-full h-40 object-cover hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = 'https://via.placeholder.com/300x200?text=No+Image';
                        }}
                      />
                    ) : (
                      <div className="w-full h-40 bg-gray-200 flex items-center justify-center">
                        <span className="text-gray-500">No image</span>
                      </div>
                    )}
                  </div>
                  <div className="p-4 flex flex-col flex-grow">
                    <h3 className="text-lg font-semibold mb-1 line-clamp-2 h-14 overflow-hidden" title={product.name}>{product.name}</h3>
                    <p className="text-xs text-gray-500 mb-2">
                      {product.category && product.category.name ? product.category.name : 
                       product.categoryName ? product.categoryName : "Không có danh mục"}
                    </p>
                    <p className="mt-auto text-red-500 font-bold">{product.price ? product.price.toLocaleString('vi-VN') : 0}đ</p>
                  </div>
                </Link>
                <div className="px-4 pb-4">
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      handleAddToCart(product._id, showNotification);
                    }}
                    className="w-full bg-blue-100 text-blue-500 py-2 rounded-lg flex items-center justify-center hover:bg-blue-200 transition-colors"
                  >
                    <i className="fas fa-shopping-cart mr-2"></i> Thêm vào giỏ hàng
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-6">
          <nav className="flex items-center">
            <button 
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className={`mx-1 px-3 py-1 rounded ${currentPage === 1 ? 'bg-gray-200 cursor-not-allowed' : 'bg-blue-500 text-white hover:bg-blue-600'}`}
            >
              &laquo; Prev
            </button>
            
            {[...Array(totalPages)].map((_, index) => (
              <button
                key={index + 1}
                onClick={() => handlePageChange(index + 1)}
                className={`mx-1 px-3 py-1 rounded ${currentPage === index + 1 ? 'bg-blue-500 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}
              >
                {index + 1}
              </button>
            ))}
            
            <button 
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className={`mx-1 px-3 py-1 rounded ${currentPage === totalPages ? 'bg-gray-200 cursor-not-allowed' : 'bg-blue-500 text-white hover:bg-blue-600'}`}
            >
              Next &raquo;
            </button>
          </nav>
        </div>
      )}
    </div>
  );
};

export default SearchResult;
