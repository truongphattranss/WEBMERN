import React, { useEffect, useState, useCallback, useMemo } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { useNotification } from '../contexts/NotificationContext';
import { toast } from 'react-hot-toast';
import { useSelector } from 'react-redux';

const Cart = () => {
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processing, setProcessing] = useState(false);
  const { showNotification } = useNotification();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.user);

  const axiosInstance = useMemo(() => axios.create({
    baseURL: 'https://curvotech.onrender.com',
    withCredentials: true,
    headers: {
      'Content-Type': 'application/json',
    },
  }), []);

  const fetchCart = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await axiosInstance.get('/api/cart/cart');
      if (!res.data.cart || res.data.cart.length === 0) {
        setCart([]);
        return;
      }

      const cartWithDetails = await Promise.all(
        res.data.cart.map(async (item) => {
          try {
            const productRes = await axiosInstance.get(`/api/products/${item.productId}`);
            const product = productRes.data.product || {};
            return {
              _id: item.productId,
              quantity: item.quantity,
              name: product.name || 'Sản phẩm không xác định',
              price: product.price || 0,
              image: product.image || null,
            };
          } catch (err) {
            console.error(`Error fetching details for product ${item.productId}:`, err);
            return {
              _id: item.productId,
              quantity: item.quantity,
              name: 'Sản phẩm không tồn tại',
              price: 0,
              image: null,
            };
          }
        })
      );

      setCart(cartWithDetails);
    } catch (err) {
      setError(`Không thể tải giỏ hàng: ${err.message || err.toString()}`);
    } finally {
      setLoading(false);
    }
  }, [axiosInstance]);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  useEffect(() => {
    console.log('Current component state:', { loading, cart, error });
  }, [loading, cart, error]);

  const handleAction = async (action, id, name) => {
    setProcessing(true);

    let endpoint, message;
    switch (action) {
      case 'increment':
        endpoint = `/api/cart/cart/increment/${id}`;
        message = `Đã tăng số lượng ${name}`;
        break;
      case 'decrement':
        endpoint = `/api/cart/cart/decrement/${id}`;
        message = `Đã giảm số lượng ${name}`;
        break;
      case 'remove':
        endpoint = `/api/cart/cart/remove/${id}`;
        message = `Đã xóa ${name} khỏi giỏ hàng`;
        break;
      default:
        break;
    }

    try {
      await axiosInstance.post(endpoint);
      toast.success(message);
      fetchCart();  // Refresh the cart after the action
    } catch (error) {
      console.error(`Lỗi khi ${action === 'remove' ? 'xóa' : 'cập nhật'} sản phẩm:`, error);
      toast.error(`Không thể ${action === 'remove' ? 'xóa' : 'cập nhật'} sản phẩm. Vui lòng thử lại.`);
    } finally {
      setProcessing(false);
    }
  };

  const increment = (id, name) => handleAction('increment', id, name);
  const decrement = (id, name) => handleAction('decrement', id, name);
  const remove = (id, name) => handleAction('remove', id, name);

  const handleCheckout = () => {
    if (!user) {
      toast.error('Vui lòng đăng nhập để tiếp tục thanh toán', { duration: 4000, position: 'top-center' });
      navigate('/login', { state: { from: { pathname: '/checkout' } } });
      return;
    }

    if (cart.length === 0) {
      showNotification('Giỏ hàng trống, không thể thanh toán', 'error');
    } else {
      navigate('/checkout');
    }
  };

  const total = cart.reduce((sum, p) => sum + (p.price ? p.price * p.quantity : 0), 0);

  if (loading) {
    return (
      <div className="container mx-auto p-4 text-center">
        <h1 className="text-2xl font-bold mb-4">🛒 Giỏ hàng của bạn</h1>
        <div className="py-10">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2">Đang tải giỏ hàng...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4 text-center">
        <h1 className="text-2xl font-bold mb-4">🛒 Giỏ hàng của bạn</h1>
        <div className="py-10 text-red-500">
          <p>{error}</p>
          <button 
            onClick={fetchCart}
            className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-center mb-6">🛒 Giỏ hàng của bạn</h1>
      {cart.length === 0 ? (
        <div className="text-center py-8 bg-white p-4 rounded-lg shadow-md">
          <p className="mb-4 text-gray-600">Giỏ hàng của bạn đang trống!</p>
          <Link to="/products" className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 inline-block">
            Mua sắm ngay
          </Link>
        </div>
      ) : (
        <div className="space-y-4 max-w-4xl mx-auto">
          <div className="lg:grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4 mb-6 lg:mb-0">
              {cart.map((product) => (
                <div key={product._id} className="flex flex-col sm:flex-row items-center bg-white p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow">
                  <div className="w-24 h-24 flex-shrink-0">
                    {product.image ? (
                      <img 
                        src={product.image} 
                        alt={product.name} 
                        className="w-24 h-24 object-cover rounded-lg"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = '';
                        }}
                      />
                    ) : (
                      <div className="w-24 h-24 bg-gray-200 flex items-center justify-center rounded-lg">
                        <span className="text-gray-500 text-sm">No image</span>
                      </div>
                    )}
                  </div>
                  <div className="ml-0 sm:ml-4 flex-grow mt-4 sm:mt-0 text-center sm:text-left">
                    <h2 className="text-lg font-semibold">{product.name}</h2>
                    <p className="text-gray-700">
                      Giá: <span className="font-medium text-red-600">{product.price.toLocaleString()} VND</span>
                    </p>
                    <p className="text-gray-700">
                      Tổng: <span className="font-medium text-red-600">{(product.price * product.quantity).toLocaleString()} VND</span>
                    </p>
                    <div className="flex items-center mt-2 justify-center sm:justify-start">
                      <span className="mr-2">Số lượng:</span>
                      <div className="flex items-center border border-gray-300 rounded">
                        <button 
                          onClick={() => decrement(product._id, product.name)} 
                          disabled={processing}
                          className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-l"
                        >
                          -
                        </button>
                        <span className="px-3 py-1 border-l border-r border-gray-300">{product.quantity}</span>
                        <button 
                          onClick={() => increment(product._id, product.name)}
                          disabled={processing}
                          className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-r"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => remove(product._id, product.name)}
                    disabled={processing}
                    className="mt-4 sm:mt-0 sm:ml-4 bg-red-500 text-white px-3 py-2 rounded hover:bg-red-600 transition-colors flex items-center"
                  >
                    <i className="fas fa-trash-alt mr-2"></i> Xóa
                  </button>
                </div>
              ))}
            </div>

            <div className="lg:col-span-1">
              <div className="bg-white p-4 rounded-lg shadow-md sticky top-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg sm:text-xl font-bold">Thông tin đơn hàng</h3>
                  <span className="text-gray-600">{cart.length} sản phẩm</span>
                </div>
                <div className="border-t border-gray-200 pt-4">
                  <div className="flex justify-between mb-2">
                    <span>Tạm tính:</span>
                    <span>{total.toLocaleString()} VND</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg border-t border-gray-200 pt-2 mt-2">
                    <span>Tổng cộng:</span>
                    <span className="text-red-600">{total.toLocaleString()} VND</span>
                  </div>
                  <button 
                    onClick={handleCheckout}
                    disabled={processing || cart.length === 0}
                    className={`w-full mt-4 py-3 rounded-lg text-white font-medium text-center 
                      ${processing || cart.length === 0 ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-500 hover:bg-green-600'}` }
                  >
                    {processing ? 'Đang xử lý...' : 'Tiến hành thanh toán'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      <Link to="/products" className="block text-center mt-8 text-blue-500 hover:underline">
        ← Tiếp tục mua sắm
      </Link>
    </div>
  );
};

export default Cart;
