const express = require('express');
const { body, param, validationResult } = require('express-validator');
const { protect } = require('../middleware/auth');
const { isAdmin } = require('../middleware/role');
const c = require('../controllers/noteController');

const router = express.Router();

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({
      success: false,
      message: errors.array()[0]?.msg || 'Validation failed',
      errors: errors.array(),
    });
    return;
  }
  next();
};

const idRule = param('id').isMongoId().withMessage('Invalid note id');

const noteRules = [
  body('title').trim().isLength({ min: 1, max: 160 }).withMessage('Title is required (max 160 characters)'),
  body('content').trim().isLength({ min: 1 }).withMessage('Content is required'),
];

// Keep /all before /:id.
router.get('/all', protect, isAdmin, c.getAllNotes);

router.post('/', protect, noteRules, validate, c.createNote);
router.get('/', protect, c.getNotes);
router.get('/:id', protect, idRule, validate, c.getNote);
router.put('/:id', protect, idRule, validate, c.updateNote);
router.delete('/:id', protect, idRule, validate, c.deleteNote);

module.exports = router;