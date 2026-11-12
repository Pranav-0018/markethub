const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// User Schema: handles Customers, Sellers, and Admin
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a name'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Please provide an email address'],
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: [true, 'Please provide a password']
  },
  role: {
    type: String,
    enum: ['admin', 'seller', 'customer'],
    default: 'customer'
  },
  // Only applicable for sellers
  shopName: {
    type: String,
    trim: true,
    default: ''
  },
  // Approval status: default 'pending' for sellers, 'approved' for customer/admin
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: function () {
      return this.role === 'seller' ? 'pending' : 'approved';
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Helper method: Compare entered password with hashed password in database
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
