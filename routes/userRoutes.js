const express = require('express');
const { body, param, validationResult } = require('express-validator');
const { protect } = require('../middleware/auth');
const { isAdmin } = require('../middleware/role');
const c = require('../controllers/userController');

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

const idRule = param('id').isMongoId().withMessage('Invalid user id');

const createRules = [
  body('name').trim().isLength({ min: 2, max: 80 }).withMessage('Name must be 2–80 characters'),
  body('email').trim().isEmail().withMessage('A valid email is required').normalizeEmail(),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('role').optional().isIn(['user', 'admin']).withMessage('Role must be user or admin'),
];

const updateRules = [
  body('name').optional().trim().isLength({ min: 2, max: 80 }).withMessage('Name must be 2–80 characters'),
  body('email').optional().trim().isEmail().withMessage('A valid email is required').normalizeEmail(),
  body('password').optional().isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('role').optional().isIn(['user', 'admin']).withMessage('Role must be user or admin'),
];

router.use(protect, isAdmin);

router.get('/', c.getUsers);
router.post('/', createRules, validate, c.createUser);
router.get('/:id', idRule, validate, c.getUser);
router.put('/:id', idRule, updateRules, validate, c.updateUser);
router.delete('/:id', idRule, validate, c.deleteUser);

module.exports = router;