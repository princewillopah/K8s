
// backend/routes/productRoutes.js
import express from 'express';
import Product from '../models/Product.js';
import { protect, adminOnly } from '../middleware/auth.js';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Multer setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ storage });

const router = express.Router();

// GET /api/products
router.get('/', async (req, res) => {
  const { category, search } = req.query;
  let filter = {};
  if (category) filter.category = category;
  if (search) filter.name = { $regex: search, $options: 'i' };
  const products = await Product.find(filter);
  res.json(products);
});

// GET /api/products/:id
router.get('/:id', async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) return res.status(404).json({ message: 'Product not found' });
  res.json(product);
});

// POST /api/products (Create) - Admin Only
router.post('/', protect, adminOnly, upload.single('image'), async (req, res) => {
  const { name, description, price, category, stock } = req.body;
  const image = req.file ? `/uploads/${req.file.filename}` : '/uploads/placeholder.jpg';

  const product = new Product({
    name,
    description,
    price,
    category,
    image,
    stock: stock || 0
  });

  try {
    const saved = await product.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT /api/products/:id (Update) - Admin Only
router.put('/:id', protect, adminOnly, upload.single('image'), async (req, res) => {
  const { name, description, price, category, stock } = req.body;
  const product = await Product.findById(req.params.id);
  if (!product) return res.status(404).json({ message: 'Product not found' });

  const image = req.file ? `/uploads/${req.file.filename}` : product.image;

  Object.assign(product, { name, description, price, category, image, stock });
  await product.save();

  res.json(product);
});

// DELETE /api/products/:id
router.delete('/:id', protect, adminOnly, async (req, res) => {
  const product = await Product.findByIdAndDelete(req.params.id);
  if (!product) return res.status(404).json({ message: 'Product not found' });
  res.json({ message: 'Product deleted' });
});

export default router;



