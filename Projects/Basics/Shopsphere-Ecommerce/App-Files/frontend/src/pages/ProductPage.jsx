// frontend/src/pages/ProductPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import StarRating from '../components/StarRating';
import { useAuth } from '../context/AuthContext';

const ProductPage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [hasReviewed, setHasReviewed] = useState(false);
  const [error, setError] = useState('');

  // Fetch product and reviews
  useEffect(() => {
    const fetchData = async () => {
      try {
        const prodRes = await api.get(`/products/${id}`);
        setProduct(prodRes.data);

        const revRes = await api.get(`/reviews/product/${id}`);
        setReviews(revRes.data);
      } catch (err) {
        setError('Product not found');
      }
    };
    fetchData();
  }, [id]);

  // Check if current user has already reviewed this product
  useEffect(() => {
    if (user && reviews.length > 0) {
      const userHasReviewed = reviews.some((review) => review.user._id === user._id);
      setHasReviewed(userHasReviewed);
    } else {
      setHasReviewed(false);
    }
  }, [user, reviews]);

  // Add to cart
  const handleAddToCart = () => {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const existing = cart.find((item) => item.product._id === product._id);
    if (existing) {
      existing.quantity += 1;
    } else {
      cart.push({ product, quantity: 1 });
    }
    localStorage.setItem('cart', JSON.stringify(cart));
    alert('Added to cart!');
  };

  // Submit review
  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!user) return alert('Please log in to leave a review');

    try {
      await api.post(`/reviews/${id}`, { rating, comment }, { withCredentials: true });
      const revRes = await api.get(`/reviews/product/${id}`);
      setReviews(revRes.data);
      setComment('');
      setRating(5);
      alert('Thank you for your review!');
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to submit review';
      if (msg.toLowerCase().includes('already reviewed')) {
        alert('You already reviewed this product.');
      } else {
        alert('Error: ' + msg);
      }
    }
  };

  // Show error or loading
  if (error) return <div className="text-center py-10 text-red-500">{error}</div>;
  if (!product) return <div className="text-center py-10">Loading...</div>;

  return (
    <div className="max-w-4xl mx-auto p-4">
      {/* Product Info */}
      <div className="flex flex-col md:flex-row gap-8">
        <img
          src={product.image || '/uploads/placeholder.jpg'}
          alt={product.name}
          className="w-full md:w-1/2 h-64 object-cover rounded"
          onError={(e) => {
            // e.target.src = 'http://localhost:5000/uploads/placeholder.jpg';
             e.target.src = '/uploads/placeholder.jpg'; // Relative path
          }}
        />
        <div>
          <h1 className="text-2xl font-bold">{product.name}</h1>
          <p className="text-gray-600 mt-2">{product.description}</p>
          <p className="text-2xl font-bold text-indigo-600 mt-4">${product.price}</p>
          <StarRating rating={product.rating} />
          <p className="mt-2">
            Category: <span className="font-medium">{product.category}</span>
          </p>
          <button
            onClick={handleAddToCart}
            className="mt-6 bg-indigo-600 text-white px-6 py-2 rounded hover:bg-indigo-700"
          >
            Add to Cart
          </button>
        </div>
      </div>

      {/* Reviews Section */}
      <div className="mt-12">
        <h2 className="text-xl font-bold mb-4">Customer Reviews</h2>

        {/* Review Form */}
        {user ? (
          hasReviewed ? (
            <p className="text-green-600 mb-6 font-medium">You have already reviewed this product.</p>
          ) : (
            <form onSubmit={handleSubmitReview} className="mb-6 border p-4 rounded bg-white shadow-sm">
              <h3 className="font-semibold mb-2">Write a Review</h3>
              <div className="mb-2">
                <label className="block mb-1">Rating:</label>
                <select
                  value={rating}
                  onChange={(e) => setRating(e.target.value)}
                  className="border p-2 rounded w-full"
                >
                  {[1, 2, 3, 4, 5].map((star) => (
                    <option key={star} value={star}>
                      {star} Star{star > 1 ? 's' : ''}
                    </option>
                  ))}
                </select>
              </div>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share your thoughts..."
                required
                className="w-full border p-2 rounded mb-2"
                rows="3"
              ></textarea>
              <button
                type="submit"
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
              >
                Submit Review
              </button>
            </form>
          )
        ) : (
          <p className="text-gray-500 mb-6">
            Please{' '}
            <span
              className="text-indigo-600 hover:underline cursor-pointer"
              onClick={() => navigate('/login')}
            >
              log in
            </span>{' '}
            to leave a review.
          </p>
        )}

        {/* Display Reviews */}
        {reviews.length === 0 ? (
          <p className="text-gray-500">No reviews yet. Be the first to review!</p>
        ) : (
          reviews.map((r) => (
            <div key={r._id} className="border-b pb-4 mb-4">
              <div className="flex justify-between items-start">
                <strong className="text-gray-800">{r.user.name}</strong>
                <StarRating rating={r.rating} />
              </div>
              <p className="text-gray-700 mt-1">{r.comment}</p>
              <small className="text-gray-500">
                {new Date(r.createdAt).toLocaleDateString()}
              </small>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ProductPage;