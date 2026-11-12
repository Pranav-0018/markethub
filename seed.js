const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('./models/User');
const Category = require('./models/Category');
const Product = require('./models/Product');
const Order = require('./models/Order');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/multivendor';

const seedDatabase = async () => {
  try {
    console.log('Connecting to database:', MONGO_URI);
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB. Starting database seed...');

    // Clear existing data
    await User.deleteMany({});
    await Category.deleteMany({});
    await Product.deleteMany({});
    await Order.deleteMany({});
    console.log('Cleared existing collections (User, Category, Product, Order).');

    // Password hashing helper
    const hash = async (pwd) => await bcrypt.hash(pwd, 10);

    // 1. Create Admin
    const admin = await User.create({
      name: 'Super Admin',
      email: 'admin@shop.com',
      password: await hash('admin123'),
      role: 'admin',
      status: 'approved'
    });
    console.log('Created Admin:', admin.email);

    // 2. Create 3 Approved Sellers
    const seller1 = await User.create({
      name: 'Rajesh Sharma',
      email: 'seller.tech@shop.com',
      password: await hash('seller123'),
      role: 'seller',
      shopName: 'Apex Electronics',
      status: 'approved'
    });

    const seller2 = await User.create({
      name: 'Priya Verma',
      email: 'seller.fashion@shop.com',
      password: await hash('seller123'),
      role: 'seller',
      shopName: 'Vogue Trendz',
      status: 'approved'
    });

    const seller3 = await User.create({
      name: 'Amit Patel',
      email: 'seller.grocery@shop.com',
      password: await hash('seller123'),
      role: 'seller',
      shopName: 'Organic Harvest Market',
      status: 'approved'
    });

    // Also create 1 pending seller to test the admin approval workflow easily
    const pendingSeller = await User.create({
      name: 'Karan Mehra',
      email: 'karan@newshop.com',
      password: await hash('seller123'),
      role: 'seller',
      shopName: 'Karan Book Depot',
      status: 'pending'
    });
    console.log('Created Sellers: 3 approved + 1 pending (for approval testing)');

    // 3. Create 1 Customer
    const customer = await User.create({
      name: 'Rahul Customer',
      email: 'user@shop.com',
      password: await hash('user123'),
      role: 'customer',
      status: 'approved'
    });
    console.log('Created Customer:', customer.email);

    // 4. Create 4 Categories
    const catElectronics = await Category.create({ name: 'Electronics' });
    const catFashion = await Category.create({ name: 'Fashion' });
    const catGrocery = await Category.create({ name: 'Grocery' });
    const catHome = await Category.create({ name: 'Home & Living' });
    console.log('Created 4 Categories');

    // 5. Create 9 Sample Products (3 per approved seller)
    const productsData = [
      // Seller 1: Apex Electronics
      {
        name: 'Wireless Noise Cancelling Headphones',
        description: 'Immersive sound with 40-hour battery life, active noise cancellation, and ultra-comfortable ear cushions.',
        price: 4999,
        stock: 25,
        image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop',
        category: catElectronics._id,
        seller: seller1._id,
        reviews: [
          {
            user: customer._id,
            userName: customer.name,
            rating: 5,
            comment: 'Incredible sound quality and deep bass! Best headphones in this price range.',
            createdAt: new Date()
          }
        ]
      },
      {
        name: 'Smart Fitness Watch Ultra',
        description: 'Track heart rate, SpO2, sleep stages, and 100+ workout modes with a vibrant HD AMOLED display.',
        price: 2499,
        stock: 40,
        image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop',
        category: catElectronics._id,
        seller: seller1._id,
        reviews: []
      },
      {
        name: 'Mechanical Gaming Keyboard RGB',
        description: 'Tactile blue switches, customizable RGB per-key backlighting, and heavy-duty aircraft-grade aluminum frame.',
        price: 3299,
        stock: 18,
        image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600&auto=format&fit=crop',
        category: catElectronics._id,
        seller: seller1._id,
        reviews: []
      },

      // Seller 2: Vogue Trendz
      {
        name: 'Classic Vintage Denim Jacket',
        description: 'Premium heavyweight washed denim with a timeless relaxed cut and durable brass metal buttons.',
        price: 1899,
        stock: 30,
        image: 'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=600&auto=format&fit=crop',
        category: catFashion._id,
        seller: seller2._id,
        reviews: [
          {
            user: customer._id,
            userName: customer.name,
            rating: 4,
            comment: 'Great fit and vintage look. Heavy quality cloth.',
            createdAt: new Date()
          }
        ]
      },
      {
        name: 'Casual 100% Cotton Oxford Shirt',
        description: 'Breathable combed cotton casual button-down shirt ideal for everyday work and weekend wear.',
        price: 999,
        stock: 50,
        image: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=600&auto=format&fit=crop',
        category: catFashion._id,
        seller: seller2._id,
        reviews: []
      },
      {
        name: 'Lightweight Breathable Running Sneakers',
        description: 'Shock-absorbing air cushioning sole with engineered mesh upper for maximum daily sprint comfort.',
        price: 2199,
        stock: 22,
        image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&auto=format&fit=crop',
        category: catFashion._id,
        seller: seller2._id,
        reviews: []
      },

      // Seller 3: Organic Harvest Market
      {
        name: 'Cold-Pressed Extra Virgin Olive Oil (1 Litre)',
        description: '100% pure first cold-pressed Mediterranean olives. Rich in antioxidants and healthy omega fats.',
        price: 850,
        stock: 35,
        image: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=600&auto=format&fit=crop',
        category: catGrocery._id,
        seller: seller3._id,
        reviews: []
      },
      {
        name: 'Raw Unprocessed Forest Honey (500g)',
        description: 'Pure wildflower forest honey directly harvested from natural hives without artificial heating or syrup.',
        price: 450,
        stock: 60,
        image: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=600&auto=format&fit=crop',
        category: catGrocery._id,
        seller: seller3._id,
        reviews: []
      },
      {
        name: 'Premium Roasted California Almonds (500g)',
        description: 'Crispy lightly salted oven-roasted California almonds packed with protein and dietary fibre.',
        price: 599,
        stock: 45,
        image: 'https://images.unsplash.com/photo-1508061253366-f7da158b6d46?w=600&auto=format&fit=crop',
        category: catGrocery._id,
        seller: seller3._id,
        reviews: []
      }
    ];

    const insertedProducts = await Product.insertMany(productsData);
    console.log(`Created ${insertedProducts.length} Sample Products (3 per seller).`);

    // 6. Create 1 Sample Seed Order (so reports and orders show immediately)
    const sampleItems = [
      {
        product: insertedProducts[0]._id, // Headphones (Seller 1)
        name: insertedProducts[0].name,
        price: insertedProducts[0].price,
        quantity: 1,
        seller: seller1._id
      },
      {
        product: insertedProducts[3]._id, // Denim Jacket (Seller 2)
        name: insertedProducts[3].name,
        price: insertedProducts[3].price,
        quantity: 1,
        seller: seller2._id
      }
    ];

    const totalAmount = 4999 + 1899; // 6898
    const commission = Math.round(totalAmount * 0.10); // 690 (10%)

    await Order.create({
      customer: customer._id,
      items: sampleItems,
      totalAmount,
      commission,
      paymentStatus: 'paid',
      deliveryStatus: 'delivered',
      shippingAddress: 'Flat 402, Green Avenue, MG Road, Bengaluru, Karnataka 560001'
    });
    console.log('Created 1 Sample Multi-Vendor Order (Paid & Delivered).');

    console.log('========================================================');
    console.log(' DATABASE SEEDED SUCCESSFULLY!');
    console.log('========================================================');
    console.log('DEMO LOGINS FOR VIVA / TESTING:');
    console.log('1. Admin:    admin@shop.com           | Password: admin123');
    console.log('2. Seller 1: seller.tech@shop.com    | Password: seller123  (Apex Electronics)');
    console.log('3. Seller 2: seller.fashion@shop.com | Password: seller123  (Vogue Trendz)');
    console.log('4. Seller 3: seller.grocery@shop.com | Password: seller123  (Organic Harvest)');
    console.log('5. Customer: user@shop.com           | Password: user123');
    console.log('6. Pending:  karan@newshop.com        | Password: seller123  (Test approval in Admin panel)');
    console.log('========================================================');

    process.exit(0);
  } catch (err) {
    console.error('Seed script error:', err);
    process.exit(1);
  }
};

seedDatabase();
