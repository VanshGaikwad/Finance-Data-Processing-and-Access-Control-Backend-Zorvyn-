const express = require('express');
const { body, param, validationResult } = require('express-validator');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const {
  getAllUsers,
  getUserById,
  updateUserRole,
  updateUserStatus,
  deleteUser,
} = require('../controllers/users.controller');

const router = express.Router();

function validateRequest(req, res, next) {
  const errors = validationResult(req);

  if (errors.isEmpty()) {
    return next();
  }

  return res.status(400).json({ errors: errors.array() });
}

const idValidator = param('id').isInt({ min: 1 }).withMessage('User id must be a positive integer.').toInt();
const roleValidator = body('role').isIn(['viewer', 'analyst', 'admin']).withMessage('Invalid role.');
const statusValidator = body('status').isIn(['active', 'inactive']).withMessage('Invalid status.');

router.use(authenticate, authorize('admin'));

router.get('/', getAllUsers);
router.get('/:id', idValidator, validateRequest, getUserById);
router.patch('/:id/role', idValidator, roleValidator, validateRequest, updateUserRole);
router.patch('/:id/status', idValidator, statusValidator, validateRequest, updateUserStatus);
router.delete('/:id', idValidator, validateRequest, deleteUser);

module.exports = router;