const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Product = require('../models/Product');
const { protect } = require('../middleware/auth');

// All order endpoints require user to be authenticated
router.use(protect);

// ==========================================
// 1. PLACE A NEW ORDER
// ==========================================

// @route   POST /api/orders
// @desc    Place an order: validate stock, decrement stock, compute 10% commission
// @access  Private (Customer)
router.post('/', async (req, res, next) => {
  try {
    const { items, shippingAddress } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Your cart is empty. Please add items to order.' });
    }

    if (!shippingAddress || shippingAddress.trim() === '') {
      return res.status(400).json({ success: false, message: 'Please provide a valid shipping address' });
    }

    const orderItems = [];
    let totalAmount = 0;

    // Validate and process each item
    for (const item of items) {
      const product = await Product.findById(item.product);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: `Product with ID '${item.product}' no longer exists`
        });
      }

      const qty = Number(item.quantity);
      if (qty <= 0) {
        return res.status(400).json({
          success: false,
          message: `Invalid quantity for product '${product.name}'`
        });
      }

      // Check stock availability
      if (product.stock < qty) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for '${product.name}'. Available: ${product.stock}, requested: ${qty}`
        });
      }

      // Decrement stock
      product.stock -= qty;
      await product.save();

      const lineTotal = product.price * qty;
      totalAmount += lineTotal;

      orderItems.push({
        product: product._id,
        name: product.name,
        price: product.price,
        quantity: qty,
        seller: product.seller
      });
    }

    // Platform commission is exactly 10% of total
    const commission = Math.round(totalAmount * 0.10);

    const order = await Order.create({
      customer: req.user._id,
      items: orderItems,
      totalAmount,
      commission,
      paymentStatus: 'pending',
      deliveryStatus: 'placed',
      shippingAddress: shippingAddress.trim()
    });

    res.status(201).json({
      success: true,
      message: 'Order created successfully! Proceed to payment.',
      order
    });
  } catch (error) {
    next(error);
  }
});

// ==========================================
// 2. MOCK PAYMENT
// ==========================================

// @route   PUT /api/orders/:id/pay
// @desc    Simulate instant test payment ("Pay Now (Test)" button)
// @access  Private (Customer or Admin)
router.put('/:id/pay', async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Verify ownership (only the buyer or admin can trigger payment)
    if (order.customer.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Unauthorized access to this order' });
    }

    if (order.paymentStatus === 'paid') {
      return res.status(400).json({ success: false, message: 'Order is already marked as paid' });
    }

    // Mark as paid
    order.paymentStatus = 'paid';
    await order.save();

    res.json({
      success: true,
      message: `Test payment of ₹${order.totalAmount.toLocaleString()} completed successfully!`,
      order
    });
  } catch (error) {
    next(error);
  }
});

// ==========================================
// 3. CUSTOMER ORDER HISTORY
// ==========================================

// @route   GET /api/orders/my
// @desc    Get order history for logged-in customer
// @access  Private (Customer)
router.get('/my', async (req, res, next) => {
  try {
    const orders = await Order.find({ customer: req.user._id })
      .populate('items.product', 'image')
      .populate('items.seller', 'name shopName')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: orders.length, orders });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/orders/:id
// @desc    Get single order details
// @access  Private
router.get('/:id', async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('customer', 'name email')
      .populate('items.product', 'image')
      .populate('items.seller', 'name shopName');

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Permission check: customer must own order, or seller has item in it, or admin
    const isCustomer = order.customer._id.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';
    const isSeller = order.items.some(
      (item) => item.seller && item.seller._id.toString() === req.user._id.toString()
    );

    if (!isCustomer && !isAdmin && !isSeller) {
      return res.status(403).json({ success: false, message: 'Not authorized to view this order' });
    }

    res.json({ success: true, order });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
