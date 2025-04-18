import React, { useState, useEffect, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getOrderById, cancelOrder } from '../services/orderService';
import { formatPrice, formatDate } from '../utils/formatters';
import Spinner from '../components/Spinner';

const OrderDetails = () => {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cancelling, setCancelling] = useState(false);

  const fetchOrderDetails = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      console.log(`Fetching order details for ID: ${id}`);
      
      const result = await getOrderById(id);
      console.log('Order details result:', result);
      
      if (result.success) {
        setOrder(processOrderData(result.order));
      } else {
        setError(result.message || 'Không thể tải thông tin đơn hàng');
      }
    } catch (err) {
      console.error('Error in fetchOrderDetails:', err);
      setError('Không thể tải thông tin đơn hàng. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchOrderDetails();
  }, [fetchOrderDetails]);

  // Hàm thử lại khi gặp lỗi
  const handleRetry = () => {
    fetchOrderDetails();
  };

  const handleCancelOrder = async () => {
    if (!window.confirm('Bạn có chắc chắn muốn hủy đơn hàng này không?')) {
      return;
    }

    try {
      setCancelling(true);
      console.log(`Cancelling order ID: ${id}`);
      
      const result = await cancelOrder(id);
      console.log('Cancel result:', result);
      
      if (result.success) {
        // Refresh order details
        fetchOrderDetails();
      } else {
        setError(result.message || 'Không thể hủy đơn hàng');
      }
    } catch (err) {
      console.error('Error in handleCancelOrder:', err);
      setError('Không thể hủy đơn hàng. Vui lòng thử lại sau.');
    } finally {
      setCancelling(false);
    }
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

  // Xử lý dữ liệu đơn hàng để phù hợp với cấu trúc giao diện
  const processOrderData = (orderData) => {
    if (!orderData) return null;

    return {
      ...orderData,
      // Tương thích với cấu trúc dữ liệu mới
      customerDetails: {
        name: orderData.name || '',
        email: orderData.email || '',
        phone: orderData.phone || '',
        address: orderData.address || '',
        city: orderData.city || '',
      },
      // Xử lý sản phẩm trong đơn hàng
      products: Array.isArray(orderData.products) ? orderData.products.map(item => ({
        ...item,
        product: item.productId || item.product || {},
        quantity: item.quantity || 1,
        price: item.price || (item.productId?.price || 0)
      })) : []
    };
  };

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
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 mr-4"
          >
            Thử lại
          </button>
          <Link to="/my-orders" className="text-primary hover:text-primary-dark">
            &larr; Quay lại danh sách đơn hàng
          </Link>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-8">
          <p className="text-gray-600 mb-4">Không tìm thấy thông tin đơn hàng.</p>
          <Link 
            to="/my-orders" 
            className="text-primary hover:text-primary-dark"
          >
            Quay lại danh sách đơn hàng
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {order.status === 'failed' && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-md">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Thanh toán đơn hàng thất bại
              </h3>
              <div className="mt-1 text-sm text-red-700">
                <p>Đơn hàng của bạn không thể hoàn tất thanh toán. Vui lòng liên hệ với chúng tôi hoặc thử thanh toán lại.</p>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Chi tiết đơn hàng</h1>
        <Link 
          to="/my-orders" 
          className="text-primary hover:text-primary-dark"
        >
          &larr; Quay lại danh sách đơn hàng
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
        <div className="p-6 border-b">
          <div className="flex flex-wrap justify-between items-center">
            <div>
              <p className="text-sm text-gray-500">Mã đơn hàng</p>
              <p className="font-medium">{order._id}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Ngày đặt hàng</p>
              <p className="font-medium">{formatDate(order.createdAt)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Trạng thái</p>
              <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClass(order.status)}`}>
                {getStatusText(order.status)}
              </span>
            </div>
            <div>
              {(order.status === 'pending' || order.status === 'processing') && (
                <button
                  onClick={handleCancelOrder}
                  disabled={cancelling}
                  className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 disabled:bg-red-300"
                >
                  {cancelling ? 'Đang hủy...' : 'Hủy đơn hàng'}
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold mb-4">Thông tin giao hàng</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Họ tên</p>
              <p className="font-medium">{order.customerDetails.name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Email</p>
              <p className="font-medium">{order.customerDetails.email}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Số điện thoại</p>
              <p className="font-medium">{order.customerDetails.phone}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Địa chỉ</p>
              <p className="font-medium">{order.customerDetails.address}</p>
            </div>
          </div>
        </div>

        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold mb-4">Phương thức thanh toán</h2>
          <p className="font-medium">
            {order.paymentMethod}
          </p>
          <div className="mt-2">
            <p className="text-sm text-gray-500">Trạng thái thanh toán</p>
            <p className={`font-medium ${order.status === 'failed' ? 'text-red-600' : order.status === 'paid' ? 'text-emerald-600' : 'text-gray-800'}`}>
              {order.status === 'paid' 
                ? 'Đã thanh toán' 
                : order.status === 'failed' 
                ? 'Thanh toán thất bại' 
                : 'Chưa thanh toán'}
            </p>
          </div>
          
          {order.status === 'paid' && order.paymentDetails && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <h3 className="text-sm font-semibold mb-2">Chi tiết thanh toán</h3>
              
              {order.paymentDetails.transactionId && (
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-500">Mã giao dịch:</span>
                  <span>{order.paymentDetails.transactionId}</span>
                </div>
              )}
              
              {order.paymentDetails.paidAt && (
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-500">Thời gian thanh toán:</span>
                  <span>{formatDate(order.paymentDetails.paidAt)}</span>
                </div>
              )}
              
              {order.paymentDetails.method && (
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-500">Phương thức:</span>
                  <span>{order.paymentDetails.method}</span>
                </div>
              )}
              
              {order.paymentDetails.bankId && (
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-500">Ngân hàng:</span>
                  <span>{order.paymentDetails.bankId}</span>
                </div>
              )}
            </div>
          )}
          
          {order.status === 'failed' && order.paymentDetails && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <h3 className="text-sm font-semibold text-red-600 mb-2">Thông tin lỗi thanh toán</h3>
              
              {order.paymentDetails.failedReason && (
                <div className="flex flex-col text-sm mb-2">
                  <span className="text-gray-500 mb-1">Lý do thất bại:</span>
                  <span className="text-red-600 bg-red-50 p-2 rounded">{order.paymentDetails.failedReason}</span>
                </div>
              )}
              
              {order.paymentDetails.failedAt && (
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-500">Thời gian:</span>
                  <span>{formatDate(order.paymentDetails.failedAt)}</span>
                </div>
              )}
              
              <div className="mt-3 text-sm">
                <p className="text-gray-600">Vui lòng thử lại hoặc chọn phương thức thanh toán khác.</p>
                <p className="text-gray-600 mt-1">Nếu bạn cho rằng đây là lỗi, vui lòng liên hệ với chúng tôi để được hỗ trợ.</p>
              </div>
            </div>
          )}
        </div>

        <div className="p-6">
          <h2 className="text-lg font-semibold mb-4">Sản phẩm</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sản phẩm
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Đơn giá
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Số lượng
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Thành tiền
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {order.products.map((item, index) => (
                  <tr key={index}>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {item.product.image && (
                          <img 
                            src={item.product.image} 
                            alt={item.product.name} 
                            className="h-10 w-10 object-cover mr-3"
                          />
                        )}
                        <div>
                          <p className="font-medium text-gray-900">{item.product.name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      {formatPrice(item.price)}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      {item.quantity}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap font-medium">
                      {formatPrice(item.price * item.quantity)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan="3" className="px-4 py-4 text-right font-medium">
                    Tổng cộng:
                  </td>
                  <td className="px-4 py-4 font-bold text-lg">
                    {formatPrice(order.totalAmount)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetails; 