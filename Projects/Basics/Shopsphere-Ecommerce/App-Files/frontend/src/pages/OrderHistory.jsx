import React, { useState, useEffect } from 'react';
import api from '../services/api';

const OrderHistory = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await api.get('/orders/myorders', { withCredentials: true });
        setOrders(res.data);
      } catch (err) {
        alert('Failed to load orders');
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  if (loading) return <div className="text-center py-10">Loading orders...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Order History</h1>
      {orders.length === 0 ? (
        <p>You have no orders yet.</p>
      ) : (
        orders.map(order => (
          <div key={order._id} className="border p-4 mb-4 rounded">
            <p><strong>Order ID:</strong> {order._id}</p>
            <p><strong>Date:</strong> {new Date(order.createdAt).toLocaleDateString()}</p>
            <p><strong>Status:</strong> {order.status}</p>
            <p><strong>Total:</strong> ${order.totalAmount.toFixed(2)}</p>
            <h3 className="font-semibold mt-2">Items:</h3>
            <ul>
              {order.items.map(item => (
                <li key={item._id}>
                  {item.product.name} x {item.quantity} - ${item.price * item.quantity}
                </li>
              ))}
            </ul>
          </div>
        ))
      )}
    </div>
  );
};

export default OrderHistory;