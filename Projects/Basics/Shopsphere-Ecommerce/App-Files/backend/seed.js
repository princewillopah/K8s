// backend/seeds.js
import connectDB from './config/db.js';
import Product from './models/Product.js';
import User from './models/User.js';

connectDB();

const seedData = async () => {
  try {
    // Clear existing data
    await Product.deleteMany();
    await User.deleteMany();

    // Create admin
    const admin = await User.create({
      name: 'Admin',
      email: 'popo@gmail.com',
      password: '$2a$10$m6T4OxO.NB0hJrnladvESOfj/sZLuMVk2qRGk9J.B1HagKvcoWbRu', // '123456' hashed
      isAdmin: true
    });

    // Products
    const products = [
      {
        name: 'iPhone 15',
        description: 'Latest Apple smartphone',
        price: 999,
        category: 'Electronics',
        image: '/uploads/iphone.jpg', // Must exist or use placeholder
        stock: 50
      },
      {
        name: 'Samsung Galaxy S24',
        description: 'Powerful Android flagship',
        price: 899,
        category: 'Electronics',
        image: '/uploads/samsung.jpg',
        stock: 30
      },
      {
        name: 'Blue T-Shirt',
        description: 'Comfortable cotton t-shirt',
        price: 29.99,
        category: 'Clothing',
        image: '/uploads/tshirt.jpg',
        stock: 100
      }
    ];

    await Product.insertMany(products);
    console.log('✅ Data seeded successfully!');
  } catch (error) {
    console.error('❌ Seed failed:', error.message);
    process.exit(1);
  } finally {
    process.exit();
  }
};

// Only run if called directly: `node seeds.js`
if (import.meta.url === `file://${process.argv[1]}`) {
  seedData();
}


