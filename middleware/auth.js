const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware to verify JWT token and attach user to request object
const protect = async (req, res, next) => {
  let token;

  // Check if token exists in Authorization header: "Bearer <token>"
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized: No token provided' });
  }

  try {
    // Verify token with our secret key
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'supersecretkey_for_multivendor_jwt_auth_123');
    
    // Find user in database and exclude password field
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'User belonging to this token no longer exists' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Token is invalid or has expired' });
  }
};

// Middleware to restrict access to specific user roles (e.g., 'admin', 'seller')
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: User role '${req.user ? req.user.role : 'guest'}' is not allowed to access this resource`
      });
    }
    next();
  };
};

module.exports = { protect, authorizeRoles };
