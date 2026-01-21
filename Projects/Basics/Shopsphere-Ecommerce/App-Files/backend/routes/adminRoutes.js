// backend/routes/adminRoutes.js
import express from 'express';
import User from '../models/User.js';
import Product from '../models/Product.js';
import Order from '../models/Order.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = express.Router();

// GET /api/admin/stats
router.get('/stats', protect, adminOnly, async (req, res) => {
  const totalUsers = await User.countDocuments();
  const totalProducts = await Product.countDocuments();
  const totalOrders = await Order.countDocuments();
  const totalRevenue = await Order.aggregate([{ $group: { _id: null, total: { $sum: '$totalAmount' } } }]);
  const revenue = totalRevenue.length > 0 ? totalRevenue[0].total : 0;

  res.json({ totalUsers, totalProducts, totalOrders, revenue });
});

// GET /api/admin/users
router.get('/users', protect, adminOnly, async (req, res) => {
  const users = await User.find({}, '-password');
  res.json(users);
});

// GET /api/admin/products
router.get('/products', protect, adminOnly, async (req, res) => {
  const products = await Product.find();
  res.json(products);
});

// DELETE /api/admin/users/:id
router.delete('/users/:id', protect, adminOnly, async (req, res) => {
  const { id } = req.params;

  // Find user
  const user = await User.findById(id);
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  // Prevent self-delete
  if (user._id.toString() === req.user._id.toString()) {
    return res.status(400).json({ message: 'You cannot delete yourself' });
  }

  // Prevent deleting another admin
  if (user.isAdmin) {
    return res.status(400).json({ message: 'Cannot delete another admin' });
  }

  // Delete the user
  await User.findByIdAndDelete(id);
  res.json({ message: 'User deleted successfully' });
});

export default router;