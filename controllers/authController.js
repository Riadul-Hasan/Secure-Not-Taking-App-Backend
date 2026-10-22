const User = require('../models/User');
const generateToken = require('../utils/generateToken');

exports.register = async (req, res, next) => {
  try {
    const { name, email, password, interests } = req.body;
    const existing = await User.findOne({ email: String(email).toLowerCase() });

    if (existing) {
      res.status(409).json({ success: false, message: 'That email is already registered' });
      return;
    }

    const user = await User.create({
      name,
      email,
      password,
      interests: Array.isArray(interests) ? interests : [],
      role: 'user',
    });

    res.status(201).json({
      success: true,
      data: { ...user.toPublic(), token: generateToken(user._id) },
    });
  } catch (error) {
    next(error);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: String(email).toLowerCase() }).select('+password');

    if (!user || !(await user.matchPassword(password))) {
      res.status(401).json({ success: false, message: 'Invalid email or password' });
      return;
    }

    res.json({
      success: true,
      data: { ...user.toPublic(), token: generateToken(user._id) },
    });
  } catch (error) {
    next(error);
  }
};

exports.me = async (req, res, next) => {
  try {
    res.json({ success: true, data: req.user.toPublic() });
  } catch (error) {
    next(error);
  }
};

exports.updateMe = async (req, res, next) => {
  try {
    const { name, interests, password } = req.body;
    const user = req.user;

    if (typeof name === 'string' && name.trim()) user.name = name.trim();
    if (Array.isArray(interests)) user.interests = interests;
    if (typeof password === 'string' && password) user.password = password;

    await user.save();

    res.json({ success: true, data: user.toPublic() });
  } catch (error) {
    next(error);
  }
};
