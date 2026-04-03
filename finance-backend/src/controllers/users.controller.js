const db = require('../config/database');

const VALID_ROLES = new Set(['viewer', 'analyst', 'admin']);
const VALID_STATUSES = new Set(['active', 'inactive']);

const selectAllUsersStmt = db.prepare(
  'SELECT id, name, email, role, status, created_at FROM users'
);
const selectUserByIdStmt = db.prepare(
  'SELECT id, name, email, role, status, created_at FROM users WHERE id = ?'
);
const userExistsStmt = db.prepare('SELECT id FROM users WHERE id = ?');
const updateRoleStmt = db.prepare('UPDATE users SET role = ? WHERE id = ?');
const updateStatusStmt = db.prepare('UPDATE users SET status = ? WHERE id = ?');
const deleteUserStmt = db.prepare('DELETE FROM users WHERE id = ?');

function parseRouteUserId(req) {
  return Number.parseInt(req.params.id, 10);
}

function sendNotFound(res) {
  return res.status(404).json({ error: 'User not found.' });
}

function ensureUserExists(userId) {
  return Boolean(userExistsStmt.get(userId));
}

function getAllUsers(req, res) {
  const users = selectAllUsersStmt.all();
  return res.status(200).json({ users });
}

function getUserById(req, res) {
  const userId = parseRouteUserId(req);
  const user = selectUserByIdStmt.get(userId);

  if (!user) {
    return sendNotFound(res);
  }

  return res.status(200).json({ user });
}

function updateUserRole(req, res) {
  const { role } = req.body;
  if (!VALID_ROLES.has(role)) {
    return res.status(400).json({ error: 'Invalid role.' });
  }

  const userId = parseRouteUserId(req);
  if (!ensureUserExists(userId)) {
    return sendNotFound(res);
  }

  updateRoleStmt.run(role, userId);
  return res.status(200).json({ message: 'Role updated successfully.' });
}

function updateUserStatus(req, res) {
  const { status } = req.body;
  if (!VALID_STATUSES.has(status)) {
    return res.status(400).json({ error: 'Invalid status.' });
  }

  const userId = parseRouteUserId(req);
  if (userId === req.user.id) {
    return res.status(400).json({ error: 'You cannot deactivate your own account.' });
  }

  if (!ensureUserExists(userId)) {
    return sendNotFound(res);
  }

  updateStatusStmt.run(status, userId);
  return res.status(200).json({ message: 'Status updated successfully.' });
}

function deleteUser(req, res) {
  const userId = parseRouteUserId(req);

  if (userId === req.user.id) {
    return res.status(400).json({ error: 'You cannot delete your own account.' });
  }

  if (!ensureUserExists(userId)) {
    return sendNotFound(res);
  }

  deleteUserStmt.run(userId);
  return res.status(200).json({ message: 'User deleted successfully.' });
}

module.exports = {
  getAllUsers,
  getUserById,
  updateUserRole,
  updateUserStatus,
  deleteUser,
};