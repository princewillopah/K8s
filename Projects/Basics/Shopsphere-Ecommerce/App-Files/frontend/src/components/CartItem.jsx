import React from 'react';
import api from '../services/api';

const CartItem = ({ item, onUpdate, onRemove }) => {
  const handleUpdate = async (newQty) => {
    if (newQty < 1) return;
    const updated = { ...item, quantity: newQty };
    onUpdate(updated);
  };

  const handleRemove = async () => {
    onRemove(item.product._id);
  };

  return (
    <div className="flex border-b py-4">
      <img src={item.product.image} alt={item.product.name} className="w-20 h-20 object-cover rounded" />
      <div className="ml-4 flex-1">
        <h3 className="font-semibold">{item.product.name}</h3>
        <p className="text-indigo-600">${item.product.price} x {item.quantity}</p>
        <p className="font-bold">${(item.product.price * item.quantity).toFixed(2)}</p>
      </div>
      <div className="flex items-center space-x-2">
        <button
          onClick={() => handleUpdate(item.quantity - 1)}
          className="px-2 bg-gray-200 hover:bg-gray-300 rounded"
        >
          -
        </button>
        <span>{item.quantity}</span>
        <button
          onClick={() => handleUpdate(item.quantity + 1)}
          className="px-2 bg-gray-200 hover:bg-gray-300 rounded"
        >
          +
        </button>
        <button
          onClick={handleRemove}
          className="ml-4 text-red-500 hover:text-red-700"
        >
          🗑
        </button>
      </div>
    </div>
  );
};

export default CartItem;