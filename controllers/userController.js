const User = require('../models/User');
const Note = require('../models/Note');
const Post = require('../models/Post');
const { paginate, buildMeta } = require('../utils/pagination');

exports.getUsers = async (req, res, next) => {
  try {
    const { page, limit, skip } = paginate(req.query);
    const search = (req.query.search || '').trim();
    const role = (req.query.role || '').trim();

    const filter = {};
    if (search) {
      const safe = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const rx = new RegExp(safe, 'i');
      filter.$or = [{ name: rx }, { email: rx }];
    }
    if (role === 'admin' || role === 'user') {
      filter.role = role;
    }

    const [users, total] = await Promise.all([
      User.find(filter)
        .select('-password')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(filter),
    ]);

    res.json({ success: true, data: users, ...buildMeta(total, page, limit) });
  } catch (error) {
    next(error);
  }
};

exports.getUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password').lean();
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }
    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

exports.createUser = async (req, res, next) => {
  try {
    const { name, email, password, role, interests } = req.body;
    const normalizedEmail = String(email).trim().toLowerCase();

    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      res.status(409).json({ success: false, message: 'That email is already registered' });
      return;
    }

    const user = await User.create({
      name,
      email: normalizedEmail,
      password,
      role: role === 'admin' ? 'admin' : 'user',
      interests: Array.isArray(interests) ? interests : [],
    });

    res.status(201).json({ success: true, data: user.toPublic() });
  } catch (error) {
    next(error);
  }
};

exports.updateUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    const { name, email, password, role, interests } = req.body;

    if (typeof name === 'string' && name.trim()) user.name = name.trim();
    if (typeof email === 'string' && email.trim()) {
      const normalizedEmail = email.trim().toLowerCase();
      const existing = await User.findOne({
        email: normalizedEmail,
        _id: { $ne: user._id },
      });
      if (existing) {
        res.status(409).json({ success: false, message: 'That email is already registered' });
        return;
      }
      user.email = normalizedEmail;
    }
    if (role === 'admin' || role === 'user') user.role = role;
    if (Array.isArray(interests)) user.interests = interests;
    if (typeof password === 'string' && password) user.password = password;

    await user.save();

    res.json({ success: true, data: user.toPublic() });
  } catch (error) {
    next(error);
  }
};

exports.deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    // Prevent self-deletion.
    if (String(user._id) === String(req.user._id)) {
      res.status(400).json({ success: false, message: 'You cannot delete your own account' });
      return;
    }

    const [notesResult, postsResult] = await Promise.all([
      Note.deleteMany({ user: user._id }),
      Post.deleteMany({ user: user._id }),
    ]);

    await user.deleteOne();

    res.json({
      success: true,
      data: {
        id: req.params.id,
        deleted: true,
        cascade: { notes: notesResult.deletedCount || 0, posts: postsResult.deletedCount || 0 },
      },
    });
  } catch (error) {
    next(error);
  }
};