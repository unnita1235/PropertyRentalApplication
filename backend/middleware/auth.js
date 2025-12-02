const jwt = require('jsonwebtoken');

// Verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Check if user is an Owner
const isOwner = (req, res, next) => {
  if (req.user.role !== 'Owner') {
    return res.status(403).json({ error: 'Access denied. Owner role required.' });
  }
  next();
};

// Check if user is a Customer
const isCustomer = (req, res, next) => {
  if (req.user.role !== 'Customer') {
    return res.status(403).json({ error: 'Access denied. Customer role required.' });
  }
  next();
};

module.exports = { authenticateToken, isOwner, isCustomer };