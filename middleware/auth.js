const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  const header = req.headers.authorization || '';
  if (header.startsWith('Bearer')) {
    token = header.split(' ')[1]?.trim();
  }

  if (!token) {
    res.status(401).json({ success: false, message: 'Not authorized — token missing' });
    return;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      res.status(401).json({ success: false, message: 'Not authorized — user no longer exists' });
      return;
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ success: false, message: 'Not authorized — token invalid or expired' });
  }
};

module.exports = { protect };