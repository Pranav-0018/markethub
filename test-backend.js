/**
 * ===================================================================
 * BACKEND PRODUCT MANAGEMENT TEST SCRIPT (test-backend.js)
 * Run this directly from your VS Code terminal!
 * 
 * Usage:
 *   1. To ADD a product:
 *      node test-backend.js add
 * 
 *   2. To REMOVE a product:
 *      node test-backend.js remove <product_id>
 * 
 *   3. To LIST products:
 *      node test-backend.js list
 * ===================================================================
 */

const mongoose = require('mongoose');
require('dotenv').config();

const Product = require('./models/Product');
const Category = require('./models/Category');
const User = require('./models/User');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/multivendor';

async function main() {
  const action = process.argv[2] ? process.argv[2].toLowerCase() : 'demo';
  const targetId = process.argv[3];

  await mongoose.connect(MONGO_URI);
  console.log('✅ Connected to MongoDB\n');

  try {
    if (action === 'add') {
      // Find the first category and an approved seller
      const category = await Category.findOne();
      const seller = await User.findOne({ role: 'seller', status: 'approved' });

      if (!category || !seller) {
        console.error('❌ Error: Please ensure categories and sellers exist (run npm run seed first)');
        process.exit(1);
      }

      // Optional custom parameters: node test-backend.js add "Product Name" 1999 15
      const customName = process.argv[3] || 'Backend Drone 4K Pro';
      const customPrice = Number(process.argv[4]) || 7999;
      const customStock = Number(process.argv[5]) || 10;

      const newProduct = await Product.create({
        name: customName,
        description: `High quality ${customName} added directly from the backend command prompt.`,
        price: customPrice,
        stock: customStock,
        category: category._id,
        seller: seller._id,
        image: 'https://images.unsplash.com/photo-1527977966376-1c8408f9f108?w=500'
      });

      console.log('🎉 PRODUCT ADDED SUCCESSFULLY:');
      console.log('--------------------------------------------------');
      console.log(`Product ID   : ${newProduct._id}`);
      console.log(`Title        : ${newProduct.name}`);
      console.log(`Price        : ₹${newProduct.price}`);
      console.log(`Stock        : ${newProduct.stock}`);
      console.log(`Category     : ${category.name}`);
      console.log(`Seller       : ${seller.shopName || seller.name}`);
      console.log('--------------------------------------------------');
      console.log(`\n💡 To remove this product, run:\n   node test-backend.js remove ${newProduct._id}\n`);

    } else if (action === 'remove') {
      if (!targetId) {
        console.error('❌ Please specify the product ID to remove:');
        console.error('   node test-backend.js remove <product_id>');
        process.exit(1);
      }

      const deleted = await Product.findByIdAndDelete(targetId);
      if (!deleted) {
        console.log(`❌ Product with ID "${targetId}" not found in database.`);
      } else {
        console.log(`🗑️ Product "${deleted.name}" (ID: ${deleted._id}) DELETED SUCCESSFULLY!`);
      }

    } else if (action === 'list') {
      const products = await Product.find().populate('category', 'name').limit(10);
      console.log(`📦 Latest ${products.length} Products in Database:`);
      products.forEach((p, idx) => {
        console.log(`${idx + 1}. [${p._id}] ${p.name} - ₹${p.price} (${p.category?.name || 'General'})`);
      });

    } else {
      // Default: show help
      console.log('Available Commands:');
      console.log('  node test-backend.js add                  -> Add a test product');
      console.log('  node test-backend.js list                 -> List existing products');
      console.log('  node test-backend.js remove <product_id>  -> Remove a product by ID');
    }
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

main();
