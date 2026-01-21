// backend/routes/orderRoutes.js
import express from 'express';
import Order from '../models/Order.js';
import Product from '../models/Product.js';  
import { protect } from '../middleware/auth.js';



const router = express.Router();

// POST /api/orders
router.post('/', protect, async (req, res) => {
  const { items, totalAmount, shippingAddress, paymentMethod } = req.body;

  if (!items || items.length === 0) {
    return res.status(400).json({ message: 'No items in cart' });
  }

  // Ensure each item has price (fallback to product price)
  const processedItems = await Promise.all(items.map(async (item) => {
    // const product = await Product.findById(item.product);
    const product = await Product.findById(item.product._id || item.product);
    if (!product) throw new Error(`Product ${item.product} not found`);

    return {
      product: item.product,
      quantity: item.quantity,
      price: item.price || product.price  // ← Fallback
    };
  }));

  const order = new Order({
    user: req.user._id,
    items: processedItems,
    totalAmount,
    shippingAddress,
    paymentMethod
  });

  await order.save();
  res.status(201).json(order);
});




// GET /api/orders/myorders
router.get('/myorders', protect, async (req, res) => {
  const orders = await Order.find({ user: req.user._id }).populate('items.product');
  res.json(orders);
});

export default router;