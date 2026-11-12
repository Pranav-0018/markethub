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

    // ========================================================
    // 1. CREATE ADMIN
    // ========================================================
    const admin = await User.create({
      name: 'Super Admin',
      email: 'admin@shop.com',
      password: await hash('admin123'),
      role: 'admin',
      status: 'approved'
    });
    console.log('Created Admin:', admin.email);

    // ========================================================
    // 2. CREATE SELLERS (4 Approved + 1 Pending for Testing)
    // ========================================================
    const seller1 = await User.create({
      name: 'Rajesh Sharma',
      email: 'seller.tech@shop.com',
      password: await hash('seller123'),
      role: 'seller',
      shopName: 'Apex Electronics & Gear',
      status: 'approved'
    });

    const seller2 = await User.create({
      name: 'Priya Verma',
      email: 'seller.fashion@shop.com',
      password: await hash('seller123'),
      role: 'seller',
      shopName: 'Vogue Trendz & Beauty',
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

    const seller4 = await User.create({
      name: 'Karan Mehra',
      email: 'seller.books@shop.com',
      password: await hash('seller123'),
      role: 'seller',
      shopName: 'Horizon Books & Living',
      status: 'approved'
    });

    // 1 Pending Seller to test Admin approval workflow
    const pendingSeller = await User.create({
      name: 'Neha Kapoor',
      email: 'neha@greenery.com',
      password: await hash('seller123'),
      role: 'seller',
      shopName: 'Urban Bloom Nursery',
      status: 'pending'
    });
    console.log('Created 4 Approved Sellers + 1 Pending Seller');

    // ========================================================
    // 3. CREATE CUSTOMER
    // ========================================================
    const customer = await User.create({
      name: 'Rahul Customer',
      email: 'user@shop.com',
      password: await hash('user123'),
      role: 'customer',
      status: 'approved'
    });
    console.log('Created Customer:', customer.email);

    // ========================================================
    // 4. CREATE 7 CATEGORIES
    // ========================================================
    const catElectronics = await Category.create({ name: 'Electronics' });
    const catFashion = await Category.create({ name: 'Fashion' });
    const catGrocery = await Category.create({ name: 'Grocery' });
    const catHome = await Category.create({ name: 'Home & Living' });
    const catBooks = await Category.create({ name: 'Books & Stationery' });
    const catBeauty = await Category.create({ name: 'Beauty & Personal Care' });
    const catSports = await Category.create({ name: 'Sports & Fitness' });
    console.log('Created 7 Categories across various industries');

    // ========================================================
    // 5. CREATE PRODUCTS (Multiple Products inside each Category)
    // ========================================================
    const productsData = [
      // ----------------------------------------------------
      // CATEGORY: Electronics (Seller: Apex Electronics)
      // ----------------------------------------------------
      {
        name: 'Wireless Noise Cancelling Headphones',
        description: 'Immersive studio audio with 40-hour battery life, active hybrid noise cancellation, and ultra-plush memory foam cushions.',
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
            comment: 'Incredible sound clarity and punchy bass! Best headphones in this price range.',
            createdAt: new Date()
          }
        ]
      },
      {
        name: 'Smart Fitness Watch Ultra',
        description: 'Track heart rate, SpO2, sleep cycles, and 100+ workout modes on a vibrant 1.9-inch HD AMOLED display.',
        price: 2499,
        stock: 40,
        image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop',
        category: catElectronics._id,
        seller: seller1._id,
        reviews: []
      },
      {
        name: 'Mechanical Gaming Keyboard RGB',
        description: 'Tactile blue clicky switches, 16.8 million RGB per-key backlighting, and an aircraft-grade aluminum frame.',
        price: 3299,
        stock: 18,
        image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600&auto=format&fit=crop',
        category: catElectronics._id,
        seller: seller1._id,
        reviews: []
      },
      {
        name: '4K Ultra HD Waterproof Action Camera',
        description: 'Record stunning 4K/60fps video with 6-axis gyro stabilization, dual screens, and 30m waterproof casing.',
        price: 5999,
        stock: 15,
        image: 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=600&auto=format&fit=crop',
        category: catElectronics._id,
        seller: seller1._id,
        reviews: []
      },
      {
        name: 'Portable Bluetooth Speaker with Deep Bass',
        description: 'IPX7 waterproof rugged wireless speaker with 360-degree surround sound and 24-hour non-stop battery life.',
        price: 1499,
        stock: 35,
        image: 'https://images.unsplash.com/photo-1545454675-3531b543be5d?w=600&auto=format&fit=crop',
        category: catElectronics._id,
        seller: seller1._id,
        reviews: []
      },

      // ----------------------------------------------------
      // CATEGORY: Fashion (Seller: Vogue Trendz)
      // ----------------------------------------------------
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
            comment: 'Great vintage styling and sturdy denim. Fits perfectly.',
            createdAt: new Date()
          }
        ]
      },
      {
        name: 'Casual 100% Combed Cotton Oxford Shirt',
        description: 'Breathable combed cotton casual button-down shirt ideal for everyday office and weekend wear.',
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
      {
        name: 'Polarized Retro Aviator Sunglasses UV400',
        description: 'Classic lightweight metallic frame with anti-glare polarized lenses blocking 100% of UVA and UVB rays.',
        price: 799,
        stock: 45,
        image: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=600&auto=format&fit=crop',
        category: catFashion._id,
        seller: seller2._id,
        reviews: []
      },
      {
        name: 'Genuine Leather Slim Minimalist Wallet',
        description: 'RFID-blocking top-grain leather bifold wallet with 8 card slots and quick-access thumb notch.',
        price: 649,
        stock: 60,
        image: 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=600&auto=format&fit=crop',
        category: catFashion._id,
        seller: seller2._id,
        reviews: []
      },

      // ----------------------------------------------------
      // CATEGORY: Grocery (Seller: Organic Harvest Market)
      // ----------------------------------------------------
      {
        name: 'Cold-Pressed Extra Virgin Olive Oil (1 Litre)',
        description: '100% pure first cold-pressed Mediterranean olives. Rich in heart-healthy antioxidants and omega fats.',
        price: 850,
        stock: 35,
        image: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=600&auto=format&fit=crop',
        category: catGrocery._id,
        seller: seller3._id,
        reviews: []
      },
      {
        name: 'Raw Unprocessed Forest Honey (500g)',
        description: 'Pure wildflower forest honey directly harvested from natural hives without artificial heating or added syrup.',
        price: 450,
        stock: 60,
        image: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=600&auto=format&fit=crop',
        category: catGrocery._id,
        seller: seller3._id,
        reviews: []
      },
      {
        name: 'Premium Roasted California Almonds (500g)',
        description: 'Crispy lightly salted oven-roasted California almonds packed with plant protein and dietary fibre.',
        price: 599,
        stock: 45,
        image: 'https://images.unsplash.com/photo-1508061253366-f7da158b6d46?w=600&auto=format&fit=crop',
        category: catGrocery._id,
        seller: seller3._id,
        reviews: []
      },
      {
        name: 'Organic Raw Chia & Flax Seeds Blend (400g)',
        description: 'Nutrient-dense superfood seeds rich in Omega-3 fatty acids, calcium, and antioxidants for morning smoothies.',
        price: 299,
        stock: 50,
        image: 'https://images.unsplash.com/photo-1514733670139-4d87a1941d55?w=600&auto=format&fit=crop',
        category: catGrocery._id,
        seller: seller3._id,
        reviews: []
      },
      {
        name: 'Pure Whole-Leaf Darjeeling Green Tea (250g)',
        description: 'Hand-picked organic green tea leaves bursting with fresh grassy aroma, natural polyphenols, and detox benefits.',
        price: 349,
        stock: 40,
        image: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=600&auto=format&fit=crop',
        category: catGrocery._id,
        seller: seller3._id,
        reviews: []
      },

      // ----------------------------------------------------
      // CATEGORY: Home & Living (Seller: Horizon Books & Living)
      // ----------------------------------------------------
      {
        name: 'Handcrafted Minimalist Ceramic Flower Vase',
        description: 'Artisan matte ceramic vase with modern geometric silhouette. Perfect centerpiece for dining tables and dried flowers.',
        price: 699,
        stock: 28,
        image: 'https://images.unsplash.com/photo-1581783342308-f792dbdd27c5?w=600&auto=format&fit=crop',
        category: catHome._id,
        seller: seller4._id,
        reviews: []
      },
      {
        name: 'Ergonomic Memory Foam Contour Pillow',
        description: 'Orthopedic cervical neck support pillow with breathable bamboo cover for deep, pain-free spinal alignment sleep.',
        price: 1199,
        stock: 30,
        image: 'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?w=600&auto=format&fit=crop',
        category: catHome._id,
        seller: seller4._id,
        reviews: []
      },
      {
        name: 'Aromatherapy Scented Soy Candles (Set of 3)',
        description: '100% natural soy wax candles infused with French Lavender, Vanilla Bean, and Eucalyptus essential oils.',
        price: 499,
        stock: 40,
        image: 'https://images.unsplash.com/photo-1603006905003-be475563bc59?w=600&auto=format&fit=crop',
        category: catHome._id,
        seller: seller4._id,
        reviews: []
      },
      {
        name: 'Boho Cotton Woven Tassel Throw Blanket',
        description: 'Ultra-soft breathable cotton woven sofa throw blanket with fringed edges. Ideal for chilly evenings and cozy decor.',
        price: 899,
        stock: 20,
        image: 'https://images.unsplash.com/photo-1580301762395-21ce84d00bc6?w=600&auto=format&fit=crop',
        category: catHome._id,
        seller: seller4._id,
        reviews: []
      },

      // ----------------------------------------------------
      // CATEGORY: Books & Stationery (Seller: Horizon Books & Living)
      // ----------------------------------------------------
      {
        name: 'Atomic Habits by James Clear (Hardcover)',
        description: 'The definitive #1 global bestseller on building good habits, breaking bad ones, and mastering small 1% daily improvements.',
        price: 499,
        stock: 50,
        image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop',
        category: catBooks._id,
        seller: seller4._id,
        reviews: []
      },
      {
        name: 'The Psychology of Money by Morgan Housel',
        description: 'Timeless lessons on wealth, greed, and happiness. Explores how human behavior dictates financial success.',
        price: 399,
        stock: 65,
        image: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=600&auto=format&fit=crop',
        category: catBooks._id,
        seller: seller4._id,
        reviews: []
      },
      {
        name: 'Refillable Vintage Leather Journal Notebook',
        description: 'Handmade rustic distressed leather cover with 240 pages of bleed-resistant, thick unlined craft parchment paper.',
        price: 549,
        stock: 35,
        image: 'https://images.unsplash.com/photo-1531346878377-a5be20888e57?w=600&auto=format&fit=crop',
        category: catBooks._id,
        seller: seller4._id,
        reviews: []
      },
      {
        name: 'Luxury Brass Calligraphy Fountain Pen Gift Set',
        description: 'Smooth medium iridium nib with piston ink converter, replacement cartridges, and polished presentation wood box.',
        price: 799,
        stock: 25,
        image: 'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=600&auto=format&fit=crop',
        category: catBooks._id,
        seller: seller4._id,
        reviews: []
      },

      // ----------------------------------------------------
      // CATEGORY: Beauty & Personal Care (Seller: Vogue Trendz)
      // ----------------------------------------------------
      {
        name: 'Vitamin C 20% Brightening Face Serum (30ml)',
        description: 'Advanced formulation with Hyaluronic Acid and Ferulic Acid to fade dark spots, boost collagen, and enhance natural skin glow.',
        price: 599,
        stock: 45,
        image: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=600&auto=format&fit=crop',
        category: catBeauty._id,
        seller: seller2._id,
        reviews: []
      },
      {
        name: 'Tea Tree & Salicylic Acid Clarifying Face Wash (150ml)',
        description: 'Gentle soap-free foaming cleanser that unclogs pores, clears stubborn acne blemishes, and balances skin oil levels.',
        price: 299,
        stock: 55,
        image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600&auto=format&fit=crop',
        category: catBeauty._id,
        seller: seller2._id,
        reviews: []
      },
      {
        name: 'Invisible Matte Sunscreen Gel SPF 50 PA+++',
        description: 'Ultra-lightweight zero white-cast broad spectrum sunscreen offering non-sticky, water-resistant matte protection.',
        price: 449,
        stock: 60,
        image: 'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=600&auto=format&fit=crop',
        category: catBeauty._id,
        seller: seller2._id,
        reviews: []
      },

      // ----------------------------------------------------
      // CATEGORY: Sports & Fitness (Seller: Apex Electronics & Gear)
      // ----------------------------------------------------
      {
        name: 'Anti-Burst Exercise Yoga Gym Ball with Pump',
        description: 'Heavy-duty non-slip PVC core balance ball with rapid foot pump. Ideal for Pilates, core training, and office posture seating.',
        price: 699,
        stock: 30,
        image: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=600&auto=format&fit=crop',
        category: catSports._id,
        seller: seller1._id,
        reviews: []
      },
      {
        name: 'High-Speed Jump Rope with Ball Bearings',
        description: 'Tangle-free steel wire skipping rope with 360-degree smooth swivel bearings and non-slip aluminum alloy handles.',
        price: 299,
        stock: 75,
        image: 'https://images.unsplash.com/photo-1599058917212-d750089bc07e?w=600&auto=format&fit=crop',
        category: catSports._id,
        seller: seller1._id,
        reviews: []
      },
      {
        name: 'Double-Wall Insulated Stainless Steel Sports Bottle (1L)',
        description: 'Keeps beverages ice-cold for 24 hours or piping hot for 12 hours. Sweat-proof powder-coated finish with leakproof straw lid.',
        price: 549,
        stock: 45,
        image: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=600&auto=format&fit=crop',
        category: catSports._id,
        seller: seller1._id,
        reviews: []
      }
    ];

    const insertedProducts = await Product.insertMany(productsData);
    console.log(`Created ${insertedProducts.length} Sample Products across all 7 Categories.`);

    // ========================================================
    // 6. CREATE 1 SAMPLE MULTI-VENDOR ORDER (For Instant Demo Stats)
    // ========================================================
    const sampleItems = [
      {
        product: insertedProducts[0]._id, // Headphones (Apex Electronics)
        name: insertedProducts[0].name,
        price: insertedProducts[0].price,
        quantity: 1,
        seller: seller1._id
      },
      {
        product: insertedProducts[5]._id, // Denim Jacket (Vogue Trendz)
        name: insertedProducts[5].name,
        price: insertedProducts[5].price,
        quantity: 1,
        seller: seller2._id
      },
      {
        product: insertedProducts[18]._id, // Atomic Habits (Horizon Books)
        name: insertedProducts[18].name,
        price: insertedProducts[18].price,
        quantity: 1,
        seller: seller4._id
      }
    ];

    const totalAmount = 4999 + 1899 + 499; // 7397
    const commission = Math.round(totalAmount * 0.10); // 740 (10%)

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
    console.log(`Summary:`);
    console.log(`- Categories: 7 (Electronics, Fashion, Grocery, Home & Living, Books & Stationery, Beauty & Personal Care, Sports & Fitness)`);
    console.log(`- Products:   ${insertedProducts.length} high-quality items`);
    console.log(`- Sellers:    4 Approved + 1 Pending`);
    console.log(`--------------------------------------------------------`);
    console.log('DEMO LOGINS FOR VIVA / TESTING:');
    console.log('1. Admin:    admin@shop.com           | Password: admin123');
    console.log('2. Seller 1: seller.tech@shop.com    | Password: seller123  (Apex Electronics & Gear)');
    console.log('3. Seller 2: seller.fashion@shop.com | Password: seller123  (Vogue Trendz & Beauty)');
    console.log('4. Seller 3: seller.grocery@shop.com | Password: seller123  (Organic Harvest Market)');
    console.log('5. Seller 4: seller.books@shop.com   | Password: seller123  (Horizon Books & Living)');
    console.log('6. Customer: user@shop.com           | Password: user123');
    console.log('7. Pending:  neha@greenery.com        | Password: seller123  (Test approval in Admin portal)');
    console.log('========================================================');

    process.exit(0);
  } catch (err) {
    console.error('Seed script error:', err);
    process.exit(1);
  }
};

seedDatabase();
