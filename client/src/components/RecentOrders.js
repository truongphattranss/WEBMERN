import React, { useState, useEffect } from 'react';
import { Table, Tag, Space } from 'antd';
import { getRecentOrders } from '../services/orderService';

const RecentOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await getRecentOrders();
        setOrders(response.data);
      } catch (error) {
        console.error('Error fetching recent orders:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const columns = [
    {
      title: 'Mã đơn hàng',
      dataIndex: 'orderId',
      key: 'orderId',
    },
    {
      title: 'Ngày đặt',
      dataIndex: 'orderDate',
      key: 'orderDate',
      render: (date) => new Date(date).toLocaleDateString(),
    },
    {
      title: 'Tổng tiền',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      render: (amount) => `${amount.toLocaleString()} VNĐ`,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        let color;
        switch(status) {
          case 'delivered':
            color = 'green';
            break;
          case 'shipped':
            color = 'blue';
            break;
          case 'processing':
            color = 'geekblue';
            break;
          case 'pending':
            color = 'orange';
            break;
          case 'paid':
            color = 'cyan';
            break;
          case 'failed':
            color = 'volcano';
            break;
          case 'cancelled':
            color = 'red';
            break;
          default:
            color = 'default';
        }
        
        return (
          <Tag color={color}>
            {status === 'delivered' ? 'Đã giao hàng' :
             status === 'shipped' ? 'Đang giao hàng' :
             status === 'processing' ? 'Đang xử lý' :
             status === 'pending' ? 'Chờ xác nhận' :
             status === 'paid' ? 'Đã thanh toán' :
             status === 'failed' ? 'Thanh toán thất bại' :
             status === 'cancelled' ? 'Đã hủy' : 
             'Không xác định'}
          </Tag>
        );
      },
    },
  ];

  return (
    <div className="recent-orders">
      <h2>Đơn hàng gần đây</h2>
      <Table
        columns={columns}
        dataSource={orders}
        loading={loading}
        rowKey="orderId"
        pagination={{ pageSize: 5 }}
      />
    </div>
  );
};

export default RecentOrders; 