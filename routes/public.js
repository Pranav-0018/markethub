const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const Category = require('../models/Category');
const Order = require('../models/Order');
const { protect } = require('../middleware/auth');

// ==========================================
// PUBLIC CATEGORY ROUTES
// ==========================================

// @route   GET /api/categories
// @desc    Fetch all product categories
// @access  Public
router.get('/categories', async (req, res, next) => {
  try {
    const categories = await Category.find().sort({ name: 1 });
    res.json({ success: true, count: categories.length, categories });
  } catch (error) {
    next(error);
  }
});

// ==========================================
// PUBLIC PRODUCT ROUTES
// ==========================================

// @route   GET /api/products
// @desc    Get products with search, category & price filters
// @access  Public
router.get('/products', async (req, res, next) => {
  try {
    const { search, category, minPrice, maxPrice } = req.query;

    const query = {};

    // 1. Text search by name or description
    if (search && search.trim() !== '') {
      query.$or = [
        { name: { $regex: search.trim(), $options: 'i' } },
        { description: { $regex: search.trim(), $options: 'i' } }
      ];
    }

    // 2. Filter by category ID
    if (category && category !== 'all' && category.trim() !== '') {
      query.category = category;
    }

    // 3. Filter by price range
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice && !isNaN(Number(minPrice))) {
        query.price.$gte = Number(minPrice);
      }
      if (maxPrice && !isNaN(Number(maxPrice))) {
        query.price.$lte = Number(maxPrice);
      }
    }

    // Populate category name and seller shop name / name
    const products = await Product.find(query)
      .populate('category', 'name')
      .populate('seller', 'name shopName status')
      .sort({ createdAt: -1 });

    // Optional safety filter: Only return products from approved sellers
    const visibleProducts = products.filter(
      (p) => p.seller && p.seller.status === 'approved'
    );

    res.json({
      success: true,
      count: visibleProducts.length,
      products: visibleProducts
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/products/:id
// @desc    Get single product details with reviews
// @access  Public
router.get('/products/:id', async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('category', 'name')
      .populate('seller', 'name shopName email status');

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    res.json({ success: true, product });
  } catch (error) {
    next(error);
  }
});

// ==========================================
// CUSTOMER PRODUCT REVIEW ROUTE
// ==========================================

// @route   POST /api/products/:id/reviews
// @desc    Add a review (Only if customer has purchased this product)
// @access  Private (Customer only)
router.post('/products/:id/reviews', protect, async (req, res, next) => {
  try {
    const { rating, comment } = req.body;
    const productId = req.params.id;

    if (!rating || !comment) {
      return res.status(400).json({ success: false, message: 'Please provide rating and comment' });
    }

    if (Number(rating) < 1 || Number(rating) > 5) {
      return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5 stars' });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Check if the current user has purchased this product in any order
    const hasPurchased = await Order.findOne({
      customer: req.user._id,
      'items.product': productId
    });

    if (!hasPurchased) {
      return res.status(403).json({
        success: false,
        message: 'Verified Purchase required: You can only review products you have ordered.'
      });
    }

    // Check if already reviewed: update existing review or push new one
    const existingIndex = product.reviews.findIndex(
      (r) => r.user.toString() === req.user._id.toString()
    );

    if (existingIndex !== -1) {
      product.reviews[existingIndex].rating = Number(rating);
      product.reviews[existingIndex].comment = comment.trim();
      product.reviews[existingIndex].createdAt = new Date();
    } else {
      product.reviews.push({
        user: req.user._id,
        userName: req.user.name,
        rating: Number(rating),
        comment: comment.trim(),
        createdAt: new Date()
      });
    }

    await product.save();

    res.status(201).json({
      success: true,
      message: 'Thank you! Your review has been submitted.',
      reviews: product.reviews
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
