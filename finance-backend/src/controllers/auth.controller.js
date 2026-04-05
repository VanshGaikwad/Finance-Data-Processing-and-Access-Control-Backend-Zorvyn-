const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const db = require('../config/database');

const findUserIdByEmail = db.prepare('SELECT id FROM users WHERE email = ?');
const insertUser = db.prepare(
  'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)'
);
const findUserByEmail = db.prepare('SELECT * FROM users WHERE email = ?');

function sendValidationErrors(req, res) {
  const result = validationResult(req);
  if (result.isEmpty()) return false;

  res.status(400).json({ errors: result.array() });
  return true;
}

function toPublicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };
}

function createAccessToken(user) {
  return jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );
}

function register(req, res) {
  if (sendValidationErrors(req, res)) return;

  const { name, email, password } = req.body;
  const role = 'viewer';
  const alreadyPresent = findUserIdByEmail.get(email);

  if (alreadyPresent) {
    return res.status(409).json({ error: 'Email already registered.' });
  }

  const securePassword = bcrypt.hashSync(password, 10);
  const inserted = insertUser.run(name, email, securePassword, role);

  return res.status(201).json({
    message: 'User registered successfully.',
    userId: inserted.lastInsertRowid,
  });
}

function login(req, res) {
  if (sendValidationErrors(req, res)) return;

  const { email, password } = req.body;
  const userRecord = findUserByEmail.get(email);

  if (!userRecord) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  if (userRecord.status === 'inactive') {
    return res.status(403).json({ error: 'Your account has been deactivated.' });
  }

  const validPassword = bcrypt.compareSync(password, userRecord.password);
  if (!validPassword) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  const token = createAccessToken(userRecord);

  return res.status(200).json({
    message: 'Login successful.',
    token,
    user: toPublicUser(userRecord),
  });
}

module.exports = { register, login };