const { validationResult } = require('express-validator');
const db = require('../config/database');

// GET /transactions — Viewer, Analyst, Admin
function getAllTransactions(req, res) {
  const { type, category, from, to, page = 1, limit = 10 } = req.query;

  let query = 'SELECT * FROM transactions WHERE is_deleted = 0';
  const params = [];

  // Filters
  if (type) {
    query += ' AND type = ?';
    params.push(type);
  }
  if (category) {
    query += ' AND category = ?';
    params.push(category);
  }
  if (from) {
    query += ' AND date >= ?';
    params.push(from);
  }
  if (to) {
    query += ' AND date <= ?';
    params.push(to);
  }

  // Pagination
  const offset = (parseInt(page) - 1) * parseInt(limit);
  query += ' ORDER BY date DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), offset);

  const transactions = db.prepare(query).all(...params);

  return res.status(200).json({ page: parseInt(page), limit: parseInt(limit), transactions });
}

// GET /transactions/:id — Viewer, Analyst, Admin
function getTransactionById(req, res) {
  const transaction = db
    .prepare('SELECT * FROM transactions WHERE id = ? AND is_deleted = 0')
    .get(req.params.id);

  if (!transaction) {
    return res.status(404).json({ error: 'Transaction not found.' });
  }

  return res.status(200).json({ transaction });
}

// POST /transactions — Analyst, Admin
function createTransaction(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { amount, type, category, date, notes } = req.body;

  const result = db
    .prepare(
      `INSERT INTO transactions (amount, type, category, date, notes, created_by)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
    .run(amount, type, category, date, notes || null, req.user.id);

  return res.status(201).json({
    message: 'Transaction created successfully.',
    transactionId: result.lastInsertRowid,
  });
}

// PUT /transactions/:id — Analyst, Admin
function updateTransaction(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const transaction = db
    .prepare('SELECT * FROM transactions WHERE id = ? AND is_deleted = 0')
    .get(req.params.id);

  if (!transaction) {
    return res.status(404).json({ error: 'Transaction not found.' });
  }

  // Analysts can only edit their own transactions
  if (req.user.role === 'analyst' && transaction.created_by !== req.user.id) {
    return res.status(403).json({ error: 'You can only edit your own transactions.' });
  }

  const { amount, type, category, date, notes } = req.body;

  db.prepare(
    `UPDATE transactions
     SET amount = ?, type = ?, category = ?, date = ?, notes = ?, updated_at = datetime('now')
     WHERE id = ?`
  ).run(
    amount ?? transaction.amount,
    type ?? transaction.type,
    category ?? transaction.category,
    date ?? transaction.date,
    notes ?? transaction.notes,
    req.params.id
  );

  return res.status(200).json({ message: 'Transaction updated successfully.' });
}

// DELETE /transactions/:id — Analyst (own), Admin (any)
function deleteTransaction(req, res) {
  const transaction = db
    .prepare('SELECT * FROM transactions WHERE id = ? AND is_deleted = 0')
    .get(req.params.id);

  if (!transaction) {
    return res.status(404).json({ error: 'Transaction not found.' });
  }

  // Analysts can only delete their own transactions
  if (req.user.role === 'analyst' && transaction.created_by !== req.user.id) {
    return res.status(403).json({ error: 'You can only delete your own transactions.' });
  }

  // Soft delete — never truly removed from DB
  db.prepare(
    `UPDATE transactions SET is_deleted = 1, updated_at = datetime('now') WHERE id = ?`
  ).run(req.params.id);

  return res.status(200).json({ message: 'Transaction deleted successfully.' });
}

module.exports = {
  getAllTransactions,
  getTransactionById,
  createTransaction,
  updateTransaction,
  deleteTransaction,
};