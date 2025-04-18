import React, { useState, useEffect, useCallback } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { getUserOrders } from '../services/orderService';
import { formatPrice, formatDate } from '../utils/formatters';
import Spinner from '../components/Spinner';
import Pagination from '../components/Pagination';
import { useSelector } from 'react-redux';

const MyOrders = () => {
  const location = useLocation();
  const { user, loading: userLoading } = useSelector((state) => state.user);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit] = useState(5);

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      console.log(`Fetching orders: page=${page}, limit=${limit}`);
      
      const result = await getUserOrders({ page, limit });
      console.log('Orders result:', result);
      
      if (result.success) {
        setOrders(result.orders.map(processOrderData));
        setTotalPages(Math.ceil(result.pagination.total / limit));
      } else {
        setError(result.message || 'Không thể tải thông tin đơn hàng');
        setOrders([]);
      }
    } catch (err) {
      console.error('Error in fetchOrders:', err);
      setError('Không thể tải thông tin đơn hàng. Vui lòng thử lại sau.');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [page, limit]);

  useEffect(() => {
    if (user) {
      fetchOrders();
    }
  }, [fetchOrders, user]);

  // Hàm để xử lý dữ liệu từ Backend - bảo đảm tương thích với cấu trúc dữ liệu mới
  const processOrderData = (order) => {
    // Đảm bảo trả về đúng format dữ liệu cho frontend hiển thị
    return {
      ...order,
      // Đảm bảo products có định dạng đúng cho hiển thị
      products: Array.isArray(order.products) ? order.products.map(item => ({
        ...item,
        product: item.productId || item.product, // Hỗ trợ cả hai định dạng cũ và mới
        quantity: item.quantity || 1,
      })) : []
    };
  };

  // Hàm thử lại khi gặp lỗi
  const handleRetry = () => {
    fetchOrders();
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'processing':
        return 'bg-indigo-100 text-indigo-800';
      case 'paid':
        return 'bg-emerald-100 text-emerald-800';
      case 'failed':
        return 'bg-orange-100 text-orange-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending':
        return 'Chờ xác nhận';
      case 'processing':
        return 'Đang xử lý';
      case 'paid':
        return 'Đã thanh toán';
      case 'failed':
        return 'Thanh toán thất bại';
      case 'cancelled':
        return 'Đã hủy';
      default:
        return status;
    }
  };

  const handlePageChange = (newPage) => {
    setPage(newPage);
  };

  // Kiểm tra người dùng đã đăng nhập chưa
  if (userLoading) {
    return <Spinner />;
  }

  // Nếu chưa đăng nhập, chuyển hướng về trang đăng nhập
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (loading) {
    return <Spinner />;
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-100 text-red-700 p-4 rounded mb-4">
          <p className="mb-2">{error}</p>
          <button 
            onClick={handleRetry}
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Đơn hàng của tôi</h1>
      
      {orders.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-600 mb-4">Bạn chưa có đơn hàng nào.</p>
          <Link 
            to="/products" 
            className="bg-primary text-white px-4 py-2 rounded hover:bg-primary-dark"
          >
            Mua sắm ngay
          </Link>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Mã đơn hàng
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ngày đặt
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tổng cộng
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Trạng thái
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Chi tiết
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {orders.map((order) => (
                  <tr key={order._id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {order._id.substring(0, 8)}...
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(order.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatPrice(order.totalAmount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClass(order.status)}`}>
                        {getStatusText(order.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link 
                        to={`/my-orders/${order._id}`} 
                        className="text-primary hover:text-primary-dark"
                      >
                        Xem chi tiết
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {totalPages > 1 && (
            <div className="mt-6">
              <Pagination 
                currentPage={page}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default MyOrders; 