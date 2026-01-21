import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import ProductCard from '../components/ProductCard';
import Navbar from '../components/Navbar'; // Add this import

const Home = () => {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await api.get(`/products?search=${search}&category=${category}`);
        setProducts(res.data);
      } catch (err) {
        console.error('Failed to load products');
      }
    };
    fetchProducts();
  }, [search, category]);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Use the Navbar component here */}
      {/* <Navbar /> */}

      {/* Hero Section - changed from h-screen to h-96 */}
      <div className="relative h-96 bg-cover bg-center flex items-center" style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80)' }}>
        <div className="absolute inset-0 bg-gradient-to-r from-dark-900 to-dark-900 opacity-80"></div>
        <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold mb-6 font-display text-white">Welcome to ShopSphere</h1>
          <p className="text-lg md:text-xl text-gray-200 mb-8 leading-relaxed">
            Discover premium products at unbeatable prices. Curated collections for the modern lifestyle.
          </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link 
                    to="/products" 
                    className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white border border-white border-opacity-50 hover:border-opacity-100 px-6 py-3 rounded-lg font-medium transition-all duration-300 shadow-md hover:shadow-lg inline-flex items-center justify-center"
                >
                    Shop Now
                    <i className="fas fa-arrow-right ml-2"></i>
                </Link>
                <Link 
                    to="/products" 
                    className="bg-transparent hover:bg-white hover:bg-opacity-10 text-white border-2 border-white px-6 py-3 rounded-lg font-medium transition-all duration-300 shadow-md hover:shadow-lg inline-flex items-center justify-center"
                >
                    Explore Collections
                    <i className="fas fa-search ml-2"></i>
                </Link>
                </div>

        </div>
      </div>

      {/* Search & Filter */}
      <div className="max-w-7xl mx-auto px-6 py-10 -mt-16 relative z-20">
        <div className="bg-white rounded-xl shadow-xl p-8 flex flex-col md:flex-row gap-6 justify-between items-center">
          <div className="w-full md:w-2/3">
            <h2 className="text-3xl font-bold mb-4 font-display">Find Your Perfect Product</h2>
            <p className="text-gray-600 mb-6">Browse our curated collection of premium items</p>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-grow">
                <i className="fas fa-search absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                <input
                  type="text"
                  placeholder="Search products..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="border pl-12 pr-4 py-3 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="border p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">All Categories</option>
                <option value="Electronics">Electronics</option>
                <option value="Clothing">Clothing</option>
                <option value="Books">Books</option>
                <option value="Home & Garden">Home & Garden</option>
                <option value="Toys">Toys</option>
              </select>
            </div>
          </div>
          <div className="hidden md:block">
            <img 
              src="https://images.unsplash.com/photo-1523275335684-37898b6baf30?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80" 
              alt="Shopping" 
              className="w-40 h-40 object-cover rounded-lg"
            />
          </div>
        </div>
      </div>

      {/* Products Section */}
      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4 font-display">Featured Products</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Discover our handpicked selection of premium products that combine quality and style
          </p>
        </div>

        {products.length === 0 ? (
          <div className="text-center py-20">
            <i className="fas fa-search text-5xl text-gray-300 mb-4"></i>
            <p className="text-gray-500 text-lg">No products found. Try adjusting your search.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((product) => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>
        
        )}
      </div>

      {/* Features Section */}
      {/* Features Section */}
<div 
  className="bg-cover bg-center py-24 relative"
  style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1556740738-b6a63e27c4df?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80)' }}
>
  <div className="absolute inset-0 bg-dark-900 opacity-90"></div>
  <div className="relative z-10 max-w-7xl mx-auto px-6">
    <div className="text-center mb-16">
      <h2 className="text-4xl font-bold mb-4 font-display text-white">Why Choose ShopSphere?</h2>
      <p className="text-gray-300 max-w-2xl mx-auto">
        We're committed to providing an exceptional shopping experience
      </p>
    </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-gray-900 bg-opacity-80 rounded-xl p-8 shadow-lg hover:shadow-xl transition-shadow duration-300">
            <div className="text-primary-400 text-4xl mb-4">
            <i className="fas fa-truck-fast text-white"></i>
            </div>
            <h3 className="text-2xl font-bold mb-3 text-white">Fast Delivery</h3>
            <p className="text-gray-300">Get your products in 2-3 business days with our premium shipping.</p>
        </div>
        <div className="bg-gray-900 bg-opacity-80 rounded-xl p-8 shadow-lg hover:shadow-xl transition-shadow duration-300">
            <div className="text-primary-400 text-4xl mb-4">
            <i className="fas fa-lock text-white"></i>
            </div>
            <h3 className="text-2xl font-bold mb-3 text-white">Secure Payments</h3>
            <p className="text-gray-300">Shop with confidence using our bank-grade encrypted checkout.</p>
        </div>
        <div className="bg-gray-900 bg-opacity-80 rounded-xl p-8 shadow-lg hover:shadow-xl transition-shadow duration-300">
            <div className="text-primary-400 text-4xl mb-4">
            <i className="fas fa-headset text-white"></i>
            </div>
            <h3 className="text-2xl font-bold mb-3 text-white">24/7 Support</h3>
            <p className="text-gray-300">Our dedicated team is here to help whenever you need assistance.</p>
        </div>
        </div>
  </div>
</div>
      {/* <div 
        className="bg-cover bg-center py-24 relative"
        style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1556740738-b6a63e27c4df?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80)' }}
      >
        <div className="absolute inset-0 bg-dark-900 opacity-90"></div>
        <div className="relative z-10 max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 font-display text-white">Why Choose ShopSphere?</h2>
            <p className="text-gray-300 max-w-2xl mx-auto">
              We're committed to providing an exceptional shopping experience
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="feature-card">
              <div className="text-primary-600 text-4xl mb-4">
                <i className="fas fa-truck-fast"></i>
              </div>
              <h3 className="text-2xl font-bold mb-3">Fast Delivery</h3>
              <p className="text-gray-600">Get your products in 2-3 business days with our premium shipping.</p>
            </div>
            <div className="feature-card">
              <div className="text-primary-600 text-4xl mb-4">
                <i className="fas fa-lock"></i>
              </div>
              <h3 className="text-2xl font-bold mb-3">Secure Payments</h3>
              <p className="text-gray-600">Shop with confidence using our bank-grade encrypted checkout.</p>
            </div>
            <div className="feature-card">
              <div className="text-primary-600 text-4xl mb-4">
                <i className="fas fa-headset"></i>
              </div>
              <h3 className="text-2xl font-bold mb-3">24/7 Support</h3>
              <p className="text-gray-600">Our dedicated team is here to help whenever you need assistance.</p>
            </div>
          </div>
        </div>
      </div> */}

      {/* Newsletter */}
      <div className="bg-white py-16">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold mb-4 font-display">Stay Updated</h2>
          <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
            Subscribe to our newsletter for exclusive offers and new product announcements
          </p>
          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <input 
              type="email" 
              placeholder="Your email address" 
              className="border p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 flex-grow max-w-md"
            />
            <button className="btn-primary px-8">Subscribe</button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-dark-900 text-white pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
            <div>
              <h3 className="text-2xl font-bold mb-4 font-display">ShopSphere</h3>
              <p className="text-gray-400 mb-4">Premium e-commerce for modern shoppers.</p>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-400 hover:text-white"><i className="fab fa-facebook-f"></i></a>
                <a href="#" className="text-gray-400 hover:text-white"><i className="fab fa-twitter"></i></a>
                <a href="#" className="text-gray-400 hover:text-white"><i className="fab fa-instagram"></i></a>
                <a href="#" className="text-gray-400 hover:text-white"><i className="fab fa-pinterest"></i></a>
              </div>
            </div>
            <div>
              <h4 className="font-bold text-lg mb-4">Shop</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white">All Products</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white">Featured</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white">New Arrivals</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white">Sale</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-lg mb-4">About</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white">Our Story</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white">Blog</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white">Careers</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white">Press</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-lg mb-4">Help</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white">Contact Us</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white">FAQs</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white">Shipping</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white">Returns</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 mb-4 md:mb-0">&copy; 2025 ShopSphere. All rights reserved.</p>
            <div className="flex space-x-6">
              <a href="#" className="text-gray-400 hover:text-white">Privacy Policy</a>
              <a href="#" className="text-gray-400 hover:text-white">Terms of Service</a>
              <a href="#" className="text-gray-400 hover:text-white">Cookies</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;