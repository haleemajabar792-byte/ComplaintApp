const jwt = require('jsonwebtoken');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'default_secret_change_this';

const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ 
      message: 'No token provided',
      success: false 
    });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      console.error("JWT Verify Error:", err.message);
      return res.status(401).json({ 
        message: 'Invalid token',
        success: false 
      });
    }

    // Support both student and admin
    req.user = decoded;
    req.userId = decoded.userId || decoded.adminId || decoded.id;
    req.userType = decoded.userType || (decoded.role === 'admin' ? 'admin' : 'student');

    next();
  });
};

module.exports = { verifyToken };