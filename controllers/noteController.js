const Note = require('../models/Note');
const { paginate, buildMeta } = require('../utils/pagination');

exports.createNote = async (req, res, next) => {
  try {
    const { title, content } = req.body;

    const note = await Note.create({
      title,
      content,
      user: req.user._id, // the owner is ALWAYS the authenticated user
    });

    res.status(201).json({ success: true, data: note });
  } catch (error) {
    next(error);
  }
};

exports.getNotes = async (req, res, next) => {
  try {
    const { page, limit, skip } = paginate(req.query);
    const search = (req.query.search || '').trim();

    const filter = { user: req.user._id };
    if (search) {
      const safe = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const rx = new RegExp(safe, 'i');
      filter.$or = [{ title: rx }, { content: rx }];
    }

    const [notes, total] = await Promise.all([
      Note.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Note.countDocuments(filter),
    ]);

    res.json({ success: true, data: notes, ...buildMeta(total, page, limit) });
  } catch (error) {
    next(error);
  }
};

exports.getAllNotes = async (req, res, next) => {
  try {
    const { page, limit, skip } = paginate(req.query);
    const search = (req.query.search || '').trim();

    const filter = {};
    if (search) {
      const safe = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const rx = new RegExp(safe, 'i');
      filter.$or = [{ title: rx }, { content: rx }];
    }

    const [notes, total] = await Promise.all([
      Note.find(filter)
        .populate('user', 'name email role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Note.countDocuments(filter),
    ]);

    res.json({ success: true, data: notes, ...buildMeta(total, page, limit) });
  } catch (error) {
    next(error);
  }
};

exports.getNote = async (req, res, next) => {
  try {
    const note = await Note.findById(req.params.id).lean();
    if (!note) {
      res.status(404).json({ success: false, message: 'Note not found' });
      return;
    }

    const isOwner = String(note.user) === String(req.user._id);
    if (!isOwner && req.user.role !== 'admin') {
      res.status(403).json({ success: false, message: 'You do not have access to this note' });
      return;
    }

    res.json({ success: true, data: note });
  } catch (error) {
    next(error);
  }
};

exports.updateNote = async (req, res, next) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) {
      res.status(404).json({ success: false, message: 'Note not found' });
      return;
    }

    const isOwner = String(note.user) === String(req.user._id);
    if (!isOwner) {
      res.status(403).json({ success: false, message: 'You do not have access to this note' });
      return;
    }

    if (typeof req.body.title === 'string') note.title = req.body.title;
    if (typeof req.body.content === 'string') note.content = req.body.content;

    await note.save();

    res.json({ success: true, data: note });
  } catch (error) {
    next(error);
  }
};

exports.deleteNote = async (req, res, next) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) {
      res.status(404).json({ success: false, message: 'Note not found' });
      return;
    }

    const isOwner = String(note.user) === String(req.user._id);
    if (!isOwner) {
      res.status(403).json({ success: false, message: 'You do not have access to this note' });
      return;
    }

    await note.deleteOne();

    res.json({ success: true, data: { id: req.params.id, deleted: true } });
  } catch (error) {
    next(error);
  }
};