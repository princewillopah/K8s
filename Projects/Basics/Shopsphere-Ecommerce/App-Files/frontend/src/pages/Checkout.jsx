import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const Checkout = () => {
  const navigate = useNavigate();
  const [shippingAddress, setShippingAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Credit Card');
  const [loading, setLoading] = useState(false);

  const cart = JSON.parse(localStorage.getItem('cart') || '[]');
  const total = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);


  const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);

  try {
    // Format cart items for backend
    const orderItems = cart.map(item => ({
      product: item.product._id,
      quantity: item.quantity,
      price: item.product.price  // ← Add price at top level
    }));

    await api.post('/orders', {
      items: orderItems,
      totalAmount: total,
      shippingAddress,
      paymentMethod
    }, { withCredentials: true });

    // Clear cart
    localStorage.removeItem('cart');
    alert('Order placed successfully!');
    navigate('/orders');
  } catch (err) {
    // alert('Order failed: ' + (err.response?.data?.message || 'Unknown error'));
    const errorMsg = err.response?.data?.message || err.message || 'Failed to connect to server';
    alert('Order failed: ' + errorMsg);
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="max-w-lg mx-auto mt-10 bg-white p-8 rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-6">Checkout</h2>
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-gray-700">Shipping Address</label>
          <textarea
            value={shippingAddress}
            onChange={(e) => setShippingAddress(e.target.value)}
            required
            className="w-full border p-2 rounded"
            rows="3"
          ></textarea>
        </div>
        <div className="mb-6">
          <label className="block text-gray-700">Payment Method</label>
          <select
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            className="w-full border p-2 rounded"
          >
            <option value="Credit Card">Credit Card</option>
            <option value="PayPal">PayPal</option>
            <option value="Bank Transfer">Bank Transfer</option>
          </select>
        </div>
        <p className="font-bold mb-4">Total: ${total.toFixed(2)}</p>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700 disabled:bg-gray-400"
        >
          {loading ? 'Processing...' : 'Place Order'}
        </button>
      </form>
    </div>
  );
};

export default Checkout;