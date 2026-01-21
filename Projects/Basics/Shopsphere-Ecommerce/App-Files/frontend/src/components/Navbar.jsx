import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
        <Link to="/" className="text-2xl font-bold text-gray-800 font-display hover:text-primary-600 transition-colors">
          ShopSphere
        </Link>
        
        <div className="hidden md:flex items-center space-x-8">
          <Link to="/" className="nav-link">Home</Link>
          <Link to="/products" className="nav-link">Products</Link>
          
          {user ? (
            <>
              <Link to="/cart" className="nav-link flex items-center">
                <i className="fas fa-shopping-cart mr-2"></i> Cart
              </Link>
              <Link to="/orders" className="nav-link">Orders</Link>
              {user.isAdmin && <Link to="/admin" className="nav-link">Admin</Link>}
              <button
                onClick={() => { logout(); navigate('/'); }}
                className="nav-link text-red-600 hover:text-red-700"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="nav-link">Login</Link>
              <Link to="/register" className="btn-primary px-4 py-2 text-sm">
                Register
              </Link>
            </>
          )}
        </div>

        {/* Mobile menu button */}
        <button className="md:hidden text-gray-600">
          <i className="fas fa-bars text-xl"></i>
        </button>
      </div>
    </nav>
  );
};

export default Navbar;