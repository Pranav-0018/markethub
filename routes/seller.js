const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const Order = require('../models/Order');
const { protect, authorizeRoles } = require('../middleware/auth');
const { handleImageUpload } = require('../middleware/upload');

// All routes here require the user to be logged in and have the 'seller' role
router.use(protect, authorizeRoles('seller'));

// Additional check: Ensure seller is 'approved'
router.use((req, res, next) => {
  if (req.user.status !== 'approved') {
    return res.status(403).json({
      success: false,
      message: 'Access denied: Your seller account is not approved by admin yet'
    });
  }
  next();
});

// ==========================================
// SELLER PRODUCT MANAGEMENT
// ==========================================

// @route   GET /api/seller/products
// @desc    Get all products belonging to the logged-in seller
// @access  Private (Seller only)
router.get('/products', async (req, res, next) => {
  try {
    const products = await Product.find({ seller: req.user._id })
      .populate('category', 'name')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: products.length, products });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/seller/products
// @desc    Add a new product (supports image file upload or image URL)
// @access  Private (Seller only)
router.post('/products', handleImageUpload('image'), async (req, res, next) => {
  try {
    const { name, description, price, stock, category } = req.body;

    if (!name || !description || price === undefined || stock === undefined || !category) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: name, description, price, stock, and category'
      });
    }

    // Use uploaded file URL or body image/imageUrl or default fallback
    const image =
      req.uploadedImageUrl ||
      req.body.image ||
      req.body.imageUrl ||
      'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&auto=format&fit=crop';

    const product = await Product.create({
      name: name.trim(),
      description: description.trim(),
      price: Number(price),
      stock: Number(stock),
      image,
      category,
      seller: req.user._id
    });

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      product
    });
  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/seller/products/:id
// @desc    Update an existing product (only if owned by this seller)
// @access  Private (Seller only)
router.put('/products/:id', handleImageUpload('image'), async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Verify ownership
    if (product.seller.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: You can only edit your own products'
      });
    }

    const { name, description, price, stock, category } = req.body;

    if (name) product.name = name.trim();
    if (description) product.description = description.trim();
    if (price !== undefined) product.price = Number(price);
    if (stock !== undefined) product.stock = Number(stock);
    if (category) product.category = category;

    // Update image if a new one was provided
    if (req.uploadedImageUrl) {
      product.image = req.uploadedImageUrl;
    } else if (req.body.image || req.body.imageUrl) {
      product.image = req.body.image || req.body.imageUrl;
    }

    await product.save();

    res.json({
      success: true,
      message: 'Product updated successfully',
      product
    });
  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/seller/products/:id/stock
// @desc    Quickly update stock quantity for a product
// @access  Private (Seller only)
router.put('/products/:id/stock', async (req, res, next) => {
  try {
    const { stock } = req.body;

    if (stock === undefined || isNaN(Number(stock)) || Number(stock) < 0) {
      return res.status(400).json({ success: false, message: 'Please provide a valid stock number' });
    }

    const product = await Product.findOne({ _id: req.params.id, seller: req.user._id });
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found or not owned by you' });
    }

    product.stock = Number(stock);
    await product.save();

    res.json({
      success: true,
      message: `Stock updated to ${product.stock} units`,
      product
    });
  } catch (error) {
    next(error);
  }
});

// @route   DELETE /api/seller/products/:id
// @desc    Delete a product (only if owned by this seller)
// @access  Private (Seller only)
router.delete('/products/:id', async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    if (product.seller.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: You can only delete your own products'
      });
    }

    await Product.findByIdAndDelete(req.params.id);

    res.json({ success: true, message: 'Product deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// ==========================================
// SELLER ORDERS & STATS
// ==========================================

// @route   GET /api/seller/orders
// @desc    Get orders containing items sold by this seller (showing ONLY this seller's items)
// @access  Private (Seller only)
router.get('/orders', async (req, res, next) => {
  try {
    // Find all orders that have at least one item from this seller
    const orders = await Order.find({ 'items.seller': req.user._id })
      .populate('customer', 'name email')
      .sort({ createdAt: -1 });

    // Transform orders: filter out items belonging to OTHER sellers
    const sellerOrders = orders.map((order) => {
      // Keep only items that belong to this seller
      const myItems = order.items.filter(
        (item) => item.seller.toString() === req.user._id.toString()
      );

      // Calculate total and earnings for this seller's items
      // Platform commission is 10%
      const sellerSubtotal = myItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
      const commissionDeducted = Math.round(sellerSubtotal * 0.10);
      const sellerEarnings = sellerSubtotal - commissionDeducted;

      return {
        _id: order._id,
        createdAt: order.createdAt,
        customer: order.customer,
        shippingAddress: order.shippingAddress,
        paymentStatus: order.paymentStatus,
        deliveryStatus: order.deliveryStatus,
        items: myItems,
        sellerSubtotal,
        commissionDeducted,
        sellerEarnings
      };
    });

    res.json({ success: true, count: sellerOrders.length, orders: sellerOrders });
  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/seller/orders/:orderId/status
// @desc    Update delivery status for an order
// @access  Private (Seller only)
router.put('/orders/:orderId/status', async (req, res, next) => {
  try {
    const { deliveryStatus } = req.body;
    const allowed = ['placed', 'shipped', 'delivered'];

    if (!allowed.includes(deliveryStatus)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid delivery status. Must be: placed, shipped, or delivered'
      });
    }

    const order = await Order.findOne({
      _id: req.params.orderId,
      'items.seller': req.user._id
    });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found for your shop' });
    }

    order.deliveryStatus = deliveryStatus;
    await order.save();

    res.json({
      success: true,
      message: `Delivery status updated to '${deliveryStatus}'`,
      order
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/seller/stats
// @desc    Get seller analytics: total sales, earnings after 10% commission, order count
// @access  Private (Seller only)
router.get('/stats', async (req, res, next) => {
  try {
    const orders = await Order.find({ 'items.seller': req.user._id });

    let totalSales = 0;
    let totalCommission = 0;
    let totalEarnings = 0;

    orders.forEach((order) => {
      // Only count items for this seller
      order.items.forEach((item) => {
        if (item.seller.toString() === req.user._id.toString()) {
          const lineTotal = item.price * item.quantity;
          const comm = Math.round(lineTotal * 0.10);
          totalSales += lineTotal;
          totalCommission += comm;
          totalEarnings += (lineTotal - comm);
        }
      });
    });

    const productsCount = await Product.countDocuments({ seller: req.user._id });

    res.json({
      success: true,
      stats: {
        totalOrders: orders.length,
        totalSales,
        totalCommission,
        totalEarnings,
        productsCount,
        shopName: req.user.shopName || req.user.name
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
