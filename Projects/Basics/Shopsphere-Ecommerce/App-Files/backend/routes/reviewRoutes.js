// backend/routes/reviewRoutes.js
import express from 'express';
import Review from '../models/Review.js';
import Product from '../models/Product.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// POST /api/reviews/:productId
router.post('/:productId', protect, async (req, res) => {
  const { rating, comment } = req.body;
  const { productId } = req.params;

  const reviewExists = await Review.findOne({ product: productId, user: req.user._id });
  if (reviewExists) {
    return res.status(400).json({ message: 'You already reviewed this product' });
  }

  const review = new Review({
    user: req.user._id,
    product: productId,
    rating,
    comment
  });

  await review.save();

  // Update product rating
  const reviews = await Review.find({ product: productId });
  const product = await Product.findById(productId);
  product.rating = reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length;
  product.numReviews = reviews.length;
  await product.save();

  res.status(201).json(review);
});

// GET /api/reviews/product/:productId
router.get('/product/:productId', async (req, res) => {
  const reviews = await Review.find({ product: req.params.productId }).populate('user', 'name');
  res.json(reviews);
});

export default router;