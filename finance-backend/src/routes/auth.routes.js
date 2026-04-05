const express = require('express');
const { body, validationResult } = require('express-validator');
const { register, login } = require('../controllers/auth.controller');

const router = express.Router();

function validateRequest(req, res, next) {
  const errors = validationResult(req);

  if (errors.isEmpty()) {
    return next();
  }

  return res.status(400).json({ errors: errors.array() });
}

const registerValidators = [
  body('name').trim().notEmpty().withMessage('Name is required.'),
  body('email').trim().isEmail().withMessage('A valid email is required.').normalizeEmail(),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters long.'),
  body('role').optional().equals('viewer').withMessage('Only viewer role can be assigned during registration.'),
];

const loginValidators = [
  body('email').trim().isEmail().withMessage('A valid email is required.').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required.'),
];

router.post('/register', registerValidators, validateRequest, register);
router.post('/login', loginValidators, validateRequest, login);

module.exports = router;