const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Category = require('../models/Category');
const Product = require('../models/Product');
const Order = require('../models/Order');
const { protect, authorizeRoles } = require('../middleware/auth');

// All routes here require the user to be logged in and have the 'admin' role
router.use(protect, authorizeRoles('admin'));

// ==========================================
// 1. USER & SELLER MANAGEMENT
// ==========================================

// @route   GET /api/admin/users?role=seller|customer
// @desc    List all users with optional role filtering
// @access  Private (Admin only)
router.get('/users', async (req, res, next) => {
  try {
    const { role } = req.query;
    const filter = {};

    if (role && ['seller', 'customer', 'admin'].includes(role)) {
      filter.role = role;
    }

    const users = await User.find(filter).select('-password').sort({ createdAt: -1 });
    res.json({ success: true, count: users.length, users });
  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/admin/sellers/:id/status
// @desc    Approve or reject a seller application
// @access  Private (Admin only)
router.put('/sellers/:id/status', async (req, res, next) => {
  try {
    const { status } = req.body;

    if (!['approved', 'rejected', 'pending'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status. Allowed values: 'approved', 'rejected', or 'pending'"
      });
    }

    const seller = await User.findOne({ _id: req.params.id, role: 'seller' });
    if (!seller) {
      return res.status(404).json({ success: false, message: 'Seller not found' });
    }

    seller.status = status;
    await seller.save();

    res.json({
      success: true,
      message: `Seller status updated to '${status}' successfully`,
      seller: {
        id: seller._id,
        name: seller.name,
        shopName: seller.shopName,
        email: seller.email,
        status: seller.status
      }
    });
  } catch (error) {
    next(error);
  }
});

// ==========================================
// 2. CATEGORY MANAGEMENT
// ==========================================

// @route   GET /api/admin/categories
// @desc    Get all categories
// @access  Private (Admin only)
router.get('/categories', async (req, res, next) => {
  try {
    const categories = await Category.find().sort({ name: 1 });
    res.json({ success: true, count: categories.length, categories });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/admin/categories
// @desc    Create a new product category
// @access  Private (Admin only)
router.post('/categories', async (req, res, next) => {
  try {
    const { name } = req.body;

    if (!name || name.trim() === '') {
      return res.status(400).json({ success: false, message: 'Category name is required' });
    }

    const existing = await Category.findOne({ name: { $regex: `^${name.trim()}$`, $options: 'i' } });
    if (existing) {
      return res.status(400).json({ success: false, message: 'A category with this name already exists' });
    }

    const category = await Category.create({ name: name.trim() });

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      category
    });
  } catch (error) {
    next(error);
  }
});

// @route   DELETE /api/admin/categories/:id
// @desc    Delete a category
// @access  Private (Admin only)
router.delete('/categories/:id', async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    // Check if products exist in this category
    const productsCount = await Product.countDocuments({ category: req.params.id });
    if (productsCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete category: ${productsCount} product(s) are currently linked to it`
      });
    }

    await Category.findByIdAndDelete(req.params.id);

    res.json({ success: true, message: 'Category deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// ==========================================
// 3. PRODUCT & ORDER MODERATION
// ==========================================

// @route   GET /api/admin/products
// @desc    List all products across all sellers
// @access  Private (Admin only)
router.get('/products', async (req, res, next) => {
  try {
    const products = await Product.find()
      .populate('category', 'name')
      .populate('seller', 'name shopName email status')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: products.length, products });
  } catch (error) {
    next(error);
  }
});

// @route   DELETE /api/admin/products/:id
// @desc    Delete any product (admin moderation)
// @access  Private (Admin only)
router.delete('/products/:id', async (req, res, next) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    res.json({ success: true, message: 'Product removed by admin' });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/admin/orders
// @desc    List all customer orders
// @access  Private (Admin only)
router.get('/orders', async (req, res, next) => {
  try {
    const orders = await Order.find()
      .populate('customer', 'name email')
      .populate('items.seller', 'name shopName')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: orders.length, orders });
  } catch (error) {
    next(error);
  }
});

// ==========================================
// 4. ADMIN FINANCIAL & SELLER REPORTS
// ==========================================

// @route   GET /api/admin/reports
// @desc    Comprehensive summary: total sales, total 10% commission, orders count, per-seller breakdown
// @access  Private (Admin only)
router.get('/reports', async (req, res, next) => {
  try {
    const orders = await Order.find().populate('items.seller', 'name shopName email');
    const sellers = await User.find({ role: 'seller' }).select('-password');

    let totalSales = 0;
    let totalCommission = 0;

    // Map to aggregate stats per seller
    const sellerMap = {};
    sellers.forEach((seller) => {
      sellerMap[seller._id.toString()] = {
        id: seller._id,
        name: seller.name,
        shopName: seller.shopName || seller.name,
        email: seller.email,
        status: seller.status,
        unitsSold: 0,
        totalSales: 0,
        commissionPaid: 0,
        netPayout: 0
      };
    });

    // Loop through all orders to compute platform and per-seller metrics
    orders.forEach((order) => {
      totalSales += order.totalAmount;
      totalCommission += order.commission;

      order.items.forEach((item) => {
        const sellerId = (item.seller?._id || item.seller).toString();
        const lineTotal = item.price * item.quantity;
        const lineCommission = Math.round(lineTotal * 0.10);
        const linePayout = lineTotal - lineCommission;

        if (sellerMap[sellerId]) {
          sellerMap[sellerId].unitsSold += item.quantity;
          sellerMap[sellerId].totalSales += lineTotal;
          sellerMap[sellerId].commissionPaid += lineCommission;
          sellerMap[sellerId].netPayout += linePayout;
        }
      });
    });

    const sellerReport = Object.values(sellerMap);

    res.json({
      success: true,
      summary: {
        totalOrders: orders.length,
        totalSales,
        totalCommission, // 10% platform revenue
        totalSellerPayout: totalSales - totalCommission,
        totalSellers: sellers.length
      },
      sellerReport
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
