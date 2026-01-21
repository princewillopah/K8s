
import React from 'react';
import { Link } from 'react-router-dom';
import StarRating from './StarRating';

const ProductCard = ({ product }) => {
  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-shadow duration-300 w-full h-full flex flex-col">
      {/* Image Container - Reduced height */}
      <div className="relative pt-[70%] bg-gray-100"> {/* Changed from pb-[120%] to pt-[70%] */}
        {/* <img
          src={`http://localhost:5000${product.image}`}
          alt={product.name}
          className="absolute top-0 left-0 w-full h-full object-cover"
          onError={(e) => {
            e.target.src = 'http://localhost:5000/uploads/placeholder.jpg';
          }}
        /> */}
        <img
          src={product.image} // ✅ e.g. "/uploads/xyz.jpg"
          alt={product.name}
          className="absolute top-0 left-0 w-full h-full object-cover"
          onError={(e) => {
            e.target.src = '/uploads/placeholder.jpg'; // ✅ relative path
          }}
        />
      </div>
      
      {/* Content Area - Balanced spacing */}
      <div className="p-5 flex-grow flex flex-col"> {/* Changed from p-6 to p-5 */}
        <div className="flex justify-between items-start mb-3">
          <h3 className="font-bold text-lg text-gray-800 line-clamp-2">{product.name}</h3>
          <span className="bg-primary-100 text-primary-600 text-xs font-semibold px-2 py-1 rounded-full ml-2 whitespace-nowrap">
            {product.category}
          </span>
        </div>
        
        <div className="mt-auto">
          <div className="flex items-center justify-between mb-3">
            <p className="text-indigo-600 font-semibold text-lg">${product.price}</p>
            <StarRating rating={product.rating} />
          </div>
          
          <Link
            to={`/product/${product._id}`}
            className="block w-full bg-indigo-600 hover:bg-indigo-700 text-white text-center py-2 px-4 rounded-lg font-medium transition-colors duration-300"
          >
            View Details
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;


