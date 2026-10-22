const jwt = require('jsonwebtoken');

const generateToken = (userId) =>
  jwt.sign({ id: userId.toString() }, process.env.JWT_SECRET, { expiresIn: '7d' });

module.exports = generateToken;