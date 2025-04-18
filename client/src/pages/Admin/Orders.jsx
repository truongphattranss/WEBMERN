import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { getOrders, deleteOrder } from '../../services/adminOrderService';
import 'bootstrap-icons/font/bootstrap-icons.css';
import AdminLayout from '../../components/AdminLayout';

// Delete Confirmation Modal component
// eslint-disable-next-line no-unused-vars
const DeleteConfirmationModal = ({ isOpen, onClose, onConfirm, orderId }) => {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6 animate-fadeIn">
        <div className="text-center mb-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 text-red-500 mb-4">
            <i className="bi bi-exclamation-triangle-fill text-2xl"></i>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Xác nhận xóa</h3>
          <p className="text-gray-600">
            Bạn có chắc chắn muốn xóa đơn hàng <span className="font-medium">#{orderId?.slice(-8)}</span>?
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Hành động này không thể hoàn tác.
          </p>
        </div>
        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-md transition"
          >
            Hủy bỏ
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition"
          >
            Xóa đơn hàng
          </button>
        </div>
      </div>
    </div>
  );
};

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalItems: 0,
    totalPages: 0
  });
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    dateFrom: '',
    dateTo: ''
  });
  
  // State for delete confirmation modal
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    orderId: null
  });
  
  // Ref để giữ focus ở ô tìm kiếm
  const searchInputRef = useRef(null);
  
  const fetchOrders = useCallback(async () => {
    try {
      if (initialLoading) {
        setInitialLoading(true);
      } else {
        setLoading(true);
      }
      setError(null);
      
      // Lấy giá trị từ state filters
      const { search, status, dateFrom, dateTo } = filters;
      const currentPage = pagination.page;
      const currentLimit = pagination.limit;
      
      console.log('Fetching orders with params:', { search, status, dateFrom, dateTo, page: currentPage, limit: currentLimit });
      
      // Gọi API với các tham số lọc
      const response = await getOrders({
        search,
        status,
        dateFrom,
        dateTo,
        page: currentPage,
        limit: currentLimit
      });
      
      if (response.success) {
        setOrders(response.orders);
        setPagination(prev => ({
          ...prev,
          totalPages: response.pagination.totalPages,
          total: response.pagination.total,
          totalItems: response.pagination.total
        }));
      } else {
        setError(response.message || 'Có lỗi xảy ra khi tải danh sách đơn hàng');
      }
    } catch (err) {
      console.error('Lỗi khi lấy danh sách đơn hàng:', err);
      setError('Không thể kết nối đến máy chủ');
    } finally {
      setInitialLoading(false);
      setLoading(false);
    }
  }, [filters, pagination.page, pagination.limit, initialLoading]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Xử lý thay đổi bộ lọc tự động gọi API (trừ search)
  useEffect(() => {
    if (filters.status || filters.dateFrom || filters.dateTo) {
      // Reset về trang 1 khi thay đổi bộ lọc
      setPagination(prev => ({ ...prev, page: 1 }));
      // Gọi API
      fetchOrders();
    }
  }, [filters.status, filters.dateFrom, filters.dateTo, fetchOrders]);

  // eslint-disable-next-line no-unused-vars
  const handleDeleteOrder = async (id) => {
    // Open confirmation modal
    setDeleteModal({
      isOpen: true,
      orderId: id
    });
  };
  
  // eslint-disable-next-line no-unused-vars
  const confirmDelete = async () => {
    try {
      setLoading(true);
      const response = await deleteOrder(deleteModal.orderId);
      
      if (response.success) {
        // Close modal
        setDeleteModal({ isOpen: false, orderId: null });
        
        // Show success notification
        const successMessage = document.createElement('div');
        successMessage.className = 'fixed top-4 right-4 bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded shadow-md z-50';
        successMessage.innerHTML = '<div class="flex items-center"><i class="bi bi-check-circle-fill mr-2"></i>Đã xóa đơn hàng thành công!</div>';
        document.body.appendChild(successMessage);
        
        // Remove notification after 3 seconds
        setTimeout(() => {
          document.body.removeChild(successMessage);
        }, 3000);
        
        // Update the orders list
        setOrders(orders.filter(order => order._id !== deleteModal.orderId));
      } else {
        setError(response.message || 'Có lỗi xảy ra khi xóa đơn hàng');
        setDeleteModal({ isOpen: false, orderId: null });
      }
    } catch (err) {
      console.error('Lỗi khi xóa đơn hàng:', err);
      setError('Không thể kết nối đến máy chủ');
      setDeleteModal({ isOpen: false, orderId: null });
    } finally {
      setLoading(false);
    }
  };

  // Handle filter changes
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle search submit
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    
    // Reset về trang 1 khi tìm kiếm
    setPagination(prev => ({
      ...prev,
      page: 1
    }));
    
    // Focus vào ô tìm kiếm sau khi submit
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
    
    // Gọi API tìm kiếm
    fetchOrders();
  };

  // eslint-disable-next-line no-unused-vars
  const handleResetFilters = () => {
    setFilters({
      search: '',
      status: '',
      dateFrom: '',
      dateTo: ''
    });
    setPagination(prev => ({
      ...prev,
      page: 1
    }));
  };

  // Pagination controls
  const handlePageChange = (newPage) => {
    if (newPage > 0 && newPage <= pagination.totalPages) {
      setPagination({
        ...pagination,
        page: newPage
      });
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'processing':
        return 'bg-indigo-100 text-indigo-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
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
      case 'processing':
        return 'Đang xử lý';
      case 'pending':
        return 'Chờ xác nhận';
      case 'paid':
        return 'Đã thanh toán';
      case 'failed':
        return 'Thanh toán thất bại';
      case 'cancelled':
        return 'Đã hủy';
      default:
        return 'Không xác định';
    }
  };

  // eslint-disable-next-line no-unused-vars
  const handleCancelDelete = () => {
    setDeleteModal({ isOpen: false, orderId: null });
  };
  
  // Các hàm tiện ích
  const getPaymentMethodDisplay = (method) => {
    const methodMap = {
      'banking': 'Chuyển khoản ngân hàng',
      'momo': 'Ví MoMo'
    };
    return methodMap[method] || method;
  };

  const getPaymentStatusDisplay = (status) => {
    const statusMap = {
      'pending': 'Chờ xử lý',
      'processing': 'Đang xử lý',
      'completed': 'Hoàn thành',
      'failed': 'Thất bại',
      'refunded': 'Hoàn tiền'
    };
    return statusMap[status] || status;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0
    }).format(amount);
  };
  
  if (initialLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          <p className="ml-4 text-gray-600">Đang tải dữ liệu...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="mb-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Quản lý Đơn hàng</h1>
        </div>
        
        {/* Filters */}
        <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
          <form onSubmit={handleSearchSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label htmlFor="search" className="block text-xs font-medium text-gray-500 mb-1">
                  Tìm kiếm
                </label>
                <div className="flex">
                  <input
                    type="text"
                    id="search"
                    name="search"
                    value={filters.search}
                    onChange={handleFilterChange}
                    placeholder="Tìm kiếm theo tên, email, username, mã đơn hàng..."
                    className="w-full p-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                    ref={searchInputRef}
                  />
                  <button 
                    type="submit"
                    className="bg-indigo-600 text-white px-4 py-2 rounded-r-md hover:bg-indigo-700 flex items-center justify-center"
                  >
                    <i className="bi bi-search"></i>
                  </button>
                </div>
              </div>
              
              <div>
                <label htmlFor="status" className="block text-xs font-medium text-gray-500 mb-1">
                  Trạng thái
                </label>
                <select
                  id="status"
                  name="status"
                  value={filters.status}
                  onChange={handleFilterChange}
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                >
                  <option value="">Tất cả</option>
                  <option value="pending">Chờ xác nhận</option>
                  <option value="paid">Đã thanh toán</option>
                  <option value="shipped">Đang giao hàng</option>
                  <option value="delivered">Đã giao hàng</option>
                  <option value="cancelled">Đã hủy</option>
                  <option value="failed">Thanh toán thất bại</option>
                </select>
              </div>
              
              <div>
                <label htmlFor="createdAt" className="block text-xs font-medium text-gray-500 mb-1">
                  Ngày đặt
                </label>
                <select
                  id="createdAt"
                  name="createdAt"
                  value={filters.createdAt}
                  onChange={handleFilterChange}
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                >
                  <option value="">Tất cả</option>
                  <option value="today">Hôm nay</option>
                  <option value="yesterday">Hôm qua</option>
                  <option value="last7days">7 ngày qua</option>
                  <option value="last30days">30 ngày qua</option>
                </select>
              </div>
              
              <div>
                <label htmlFor="limit" className="block text-xs font-medium text-gray-500 mb-1">
                  Hiển thị
                </label>
                <select
                  id="limit"
                  name="limit"
                  value={filters.limit}
                  onChange={handleFilterChange}
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                >
                  <option value="10">10 đơn hàng</option>
                  <option value="25">25 đơn hàng</option>
                  <option value="50">50 đơn hàng</option>
                  <option value="100">100 đơn hàng</option>
                </select>
              </div>
            </div>
          </form>
        </div>
      </div>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4">
          <div className="flex items-center">
            <i className="bi bi-exclamation-triangle-fill mr-2"></i>
            <span>{error}</span>
          </div>
        </div>
      )}
      
      {/* Orders Table */}
      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-64 py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          <p className="mt-4 text-gray-600">Đang tải dữ liệu...</p>
        </div>
      ) : orders.length > 0 ? (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full divide-y divide-gray-200">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Đơn hàng
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Khách hàng
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ngày đặt
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Trạng thái
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Thanh toán
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tổng tiền
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {orders.map(order => (
                  <tr key={order._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-indigo-600">#{order.orderNumber || order._id.substr(-6)}</div>
                      <div className="text-xs text-gray-500">{order._id}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {order.shippingInfo?.name || order.billingInfo?.name || order.name || 'Khách hàng'}
                      </div>
                      {order.user?.username && (
                        <div className="text-xs text-gray-500">@{order.user?.username}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {new Date(order.createdAt).toLocaleDateString('vi-VN')}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(order.createdAt).toLocaleTimeString('vi-VN')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClass(order.status)}`}>
                        {getStatusText(order.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {getPaymentMethodDisplay(order.paymentMethod)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {getPaymentStatusDisplay(order.paymentStatus)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {formatCurrency(order.totalAmount)} VNĐ
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link 
                        to={`/admin/orders/${order._id}`}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        Chi tiết
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200">
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-500">
                  Hiển thị <span className="font-medium">{orders.length ? (pagination.page - 1) * pagination.limit + 1 : 0}</span> đến <span className="font-medium">
                    {orders.length ? Math.min(pagination.page * pagination.limit, pagination.totalItems || 0) : 0}
                  </span> trong <span className="font-medium">{pagination.totalItems || 0}</span> đơn hàng
                </div>
                <div className="flex space-x-1">
                  <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 1}
                    className={`px-3 py-1 rounded-md ${
                      pagination.page === 1
                        ? 'text-gray-400 cursor-not-allowed'
                        : 'text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <i className="bi bi-chevron-left"></i>
                  </button>
                  
                  {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                    const pageNumber = i + 1 + Math.max(0, Math.min(pagination.totalPages - 5, pagination.page - 3));
                    return (
                      <button
                        key={pageNumber}
                        onClick={() => handlePageChange(pageNumber)}
                        className={`px-3 py-1 rounded-md ${
                          pagination.page === pageNumber
                            ? 'bg-indigo-600 text-white'
                            : 'text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {pageNumber}
                      </button>
                    );
                  })}
                  
                  <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page === pagination.totalPages}
                    className={`px-3 py-1 rounded-md ${
                      pagination.page === pagination.totalPages
                        ? 'text-gray-400 cursor-not-allowed'
                        : 'text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <i className="bi bi-chevron-right"></i>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <i className="bi bi-inbox text-5xl text-gray-300"></i>
          <p className="mt-4 text-gray-500">Không tìm thấy đơn hàng nào.</p>
        </div>
      )}
    </AdminLayout>
  );
};

export default Orders;