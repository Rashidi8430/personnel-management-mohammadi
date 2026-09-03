/**
 * Middleware برای احراز هویت
 */

const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'توکن موجود نیست'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'توکن نامعتبر است'
    });
  }
};

// بررسی نقش کاربر
const checkRole = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'دسترسی غیرمجاز'
      });
    }
    next();
  };
};

module.exports = {
  verifyToken,
  checkRole
};