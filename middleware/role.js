const isAdmin = (req, res, next) => {
  if (!req.user) {
    res.status(401).json({ success: false, message: 'Not authorized' });
    return;
  }

  if (req.user.role !== 'admin') {
    res.status(403).json({ success: false, message: 'Administrator access required' });
    return;
  }

  next();
};

module.exports = { isAdmin };