const express = require('express');
const {
  body,
  param,
  query,
  validationResult,
} = require('express-validator');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const {
  getAllTransactions,
  getTransactionById,
  createTransaction,
  updateTransaction,
  deleteTransaction,
} = require('../controllers/transactions.controllers');

const router = express.Router();

function validateRequest(req, res, next) {
  const errors = validationResult(req);

  if (errors.isEmpty()) {
    return next();
  }

  return res.status(400).json({ errors: errors.array() });
}

function requireUpdatePayload(req, res, next) {
  const hasField = ['amount', 'type', 'category', 'date', 'notes'].some(
    (field) => req.body[field] !== undefined
  );

  if (!hasField) {
    return res.status(400).json({ error: 'At least one transaction field must be provided.' });
  }

  return next();
}

const listValidators = [
  query('type').optional().isIn(['income', 'expense']).withMessage('Invalid transaction type.'),
  query('category').optional().trim().notEmpty().withMessage('Category cannot be empty.'),
  query('from').optional().isISO8601({ strict: true }).withMessage('from must be a valid ISO date.'),
  query('to').optional().isISO8601({ strict: true }).withMessage('to must be a valid ISO date.'),
  query('page').optional().isInt({ min: 1 }).withMessage('page must be a positive integer.').toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('limit must be between 1 and 100.').toInt(),
];

const idValidator = param('id').isInt({ min: 1 }).withMessage('Transaction id must be a positive integer.').toInt();

const createValidators = [
  body('amount').isFloat({ gt: 0 }).withMessage('Amount must be greater than 0.').toFloat(),
  body('type').isIn(['income', 'expense']).withMessage('Invalid transaction type.'),
  body('category').trim().notEmpty().withMessage('Category is required.'),
  body('date').isISO8601({ strict: true }).withMessage('Date must be a valid ISO date.'),
  body('notes').optional({ nullable: true, checkFalsy: true }).isString().withMessage('Notes must be a string.'),
];

const updateValidators = [
  body('amount').optional({ checkFalsy: false }).isFloat({ gt: 0 }).withMessage('Amount must be greater than 0.').toFloat(),
  body('type').optional().isIn(['income', 'expense']).withMessage('Invalid transaction type.'),
  body('category').optional().trim().notEmpty().withMessage('Category cannot be empty.'),
  body('date').optional().isISO8601({ strict: true }).withMessage('Date must be a valid ISO date.'),
  body('notes').optional({ nullable: true, checkFalsy: false }).isString().withMessage('Notes must be a string.'),
];

router.use(authenticate);

router.get('/', authorize('viewer', 'analyst', 'admin'), listValidators, validateRequest, getAllTransactions);
router.get('/:id', authorize('viewer', 'analyst', 'admin'), idValidator, validateRequest, getTransactionById);
router.post('/', authorize('analyst', 'admin'), createValidators, validateRequest, createTransaction);
router.put('/:id', authorize('analyst', 'admin'), idValidator, updateValidators, requireUpdatePayload, validateRequest, updateTransaction);
router.delete('/:id', authorize('analyst', 'admin'), idValidator, validateRequest, deleteTransaction);

module.exports = router;