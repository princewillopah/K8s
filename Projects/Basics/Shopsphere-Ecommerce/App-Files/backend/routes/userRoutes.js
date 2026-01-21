// backend/routes/userRoutes.js
import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// POST /api/users/signup
router.post('/signup', async (req, res) => {
  const { name, email, password } = req.body;

  const userExists = await User.findOne({ email });
  if (userExists) {
    return res.status(400).json({ message: 'User already exists' });
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  const user = new User({ name, email, password: hashedPassword });
  await user.save();

  const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

  res.cookie('jwt', token, { httpOnly: true, secure: false, maxAge: 7 * 24 * 60 * 60 * 1000 });
  res.status(201).json({ _id: user._id, name: user.name, email: user.email, isAdmin: user.isAdmin });
});

// POST /api/users/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user) return res.status(401).json({ message: 'Invalid credentials' });

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

  const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

  res.cookie('jwt', token, { httpOnly: true, secure: false, maxAge: 7 * 24 * 60 * 60 * 1000 });
  res.json({ _id: user._id, name: user.name, email: user.email, isAdmin: user.isAdmin });
});

// GET /api/users/profile
router.get('/profile', protect, (req, res) => {
  res.json(req.user);
});

// POST /api/users/logout
router.post('/logout', (req, res) => {
  res.clearCookie('jwt');
  res.json({ message: 'Logged out' });
});

export default router;