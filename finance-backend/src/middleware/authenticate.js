const jwt = require('jsonwebtoken');
const db = require('../config/database');

const readUserById = db.prepare(
  'SELECT id, name, email, role, status FROM users WHERE id = ?'
);

function extractBearerToken(authorization) {
  if (!authorization) return null;

  const [scheme, value] = authorization.split(' ');
  if (scheme !== 'Bearer' || !value) return null;

  return value;
}

function verifyJwt(token) {
  return jwt.verify(token, process.env.JWT_SECRET);
}

function authenticate(req, res, next) {
  const token = extractBearerToken(req.headers.authorization);

  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  try {
    const payload = verifyJwt(token);
    const account = readUserById.get(payload.id);

    if (!account) {
      return res.status(401).json({ error: 'User no longer exists.' });
    }

    if (account.status === 'inactive') {
      return res.status(403).json({ error: 'Your account has been deactivated.' });
    }

    req.user = account;
    return next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
}

module.exports = authenticate;