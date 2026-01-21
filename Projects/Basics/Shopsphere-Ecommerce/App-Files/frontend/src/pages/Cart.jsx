import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import CartItem from '../components/CartItem';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const Cart = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [cart, setCart] = useState([]);

  useEffect(() => {
    setCart(JSON.parse(localStorage.getItem('cart') || '[]'));
  }, []);

  const updateItem = (updatedItem) => {
    const newCart = cart.map(item => item.product._id === updatedItem.product._id ? updatedItem : item);
    setCart(newCart);
    localStorage.setItem('cart', JSON.stringify(newCart));
  };

  const removeItem = (productId) => {
    const newCart = cart.filter(item => item.product._id !== productId);
    setCart(newCart);
    localStorage.setItem('cart', JSON.stringify(newCart));
  };

  const total = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);


  const handleCheckout = () => {
  if (cart.length === 0) return alert('Your cart is empty');
  if (!user) return navigate('/login');
  navigate('/checkout');
};

  if (cart.length === 0) {
    return <div className="text-center py-10">Your cart is empty.</div>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Shopping Cart</h1>
      {cart.map(item => (
        <CartItem
          key={item.product._id}
          item={item}
          onUpdate={updateItem}
          onRemove={removeItem}
        />
      ))}
      <div className="border-t pt-4 mt-6 text-right">
        <p className="text-xl font-bold">Total: ${total.toFixed(2)}</p>
        <button
          onClick={handleCheckout}
          className="mt-4 bg-indigo-600 text-white px-6 py-2 rounded hover:bg-indigo-700"
        >
          Proceed to Checkout
        </button>
      </div>
    </div>
  );
};

export default Cart;