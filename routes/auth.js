const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Helper function to create JWT token
const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role, email: user.email },
    process.env.JWT_SECRET || 'supersecretkey_for_multivendor_jwt_auth_123',
    { expiresIn: '7d' }
  );
};

// @route   POST /api/auth/register
// @desc    Register a new customer or seller
// @access  Public
router.post('/register', async (req, res, next) => {
  try {
    const { name, email, password, role, shopName } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide name, email, and password' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }

    // Role validation: only allow customer or seller to self-register (admin created via seed)
    const assignedRole = role === 'seller' ? 'seller' : 'customer';

    if (assignedRole === 'seller' && (!shopName || shopName.trim() === '')) {
      return res.status(400).json({ success: false, message: 'Shop name is required for sellers' });
    }

    // Check if email already registered
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'An account with this email already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user: status is 'pending' for sellers, 'approved' for customer
    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      role: assignedRole,
      shopName: assignedRole === 'seller' ? shopName.trim() : '',
      status: assignedRole === 'seller' ? 'pending' : 'approved'
    });

    // If registered as seller, do not log in immediately because admin approval is required
    if (assignedRole === 'seller') {
      return res.status(201).json({
        success: true,
        message: 'Seller account registered successfully! Please wait for Admin approval before logging in.',
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          shopName: user.shopName,
          status: user.status
        }
      });
    }

    // Customer logs in immediately
    const token = generateToken(user);

    return res.status(201).json({
      success: true,
      message: 'Registration successful! Welcome aboard.',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status
      }
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    // Find user with password included
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    // Check password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    // BLOCK sellers who are not "approved" with a clear message
    if (user.role === 'seller') {
      if (user.status === 'pending') {
        return res.status(403).json({
          success: false,
          message: 'Your seller account is pending admin approval. You will be able to log in once approved.'
        });
      }
      if (user.status === 'rejected') {
        return res.status(403).json({
          success: false,
          message: 'Your seller account has been rejected by the admin. Please contact support.'
        });
      }
    }

    // Generate JWT token
    const token = generateToken(user);

    return res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        shopName: user.shopName,
        status: user.status
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
