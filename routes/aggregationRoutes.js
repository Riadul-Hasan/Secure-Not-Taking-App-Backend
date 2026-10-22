const express = require('express');
const { param, validationResult } = require('express-validator');
const { protect } = require('../middleware/auth');
const { isAdmin } = require('../middleware/role');
const c = require('../controllers/aggregationController');

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

router.get('/group-by-interests', protect, isAdmin, c.groupByInterests);
router.get(
  '/user-posts/:userId',
  protect,
  isAdmin,
  param('userId').isMongoId().withMessage('Invalid user id'),
  validate,
  c.userPosts
);

module.exports = router;