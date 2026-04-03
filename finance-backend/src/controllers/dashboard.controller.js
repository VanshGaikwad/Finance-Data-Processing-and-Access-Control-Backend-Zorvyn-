const db = require('../config/database');

const incomeSummaryStmt = db.prepare(
  `SELECT COALESCE(SUM(amount), 0) AS total
   FROM transactions
   WHERE type = 'income' AND is_deleted = 0`
);

const expenseSummaryStmt = db.prepare(
  `SELECT COALESCE(SUM(amount), 0) AS total
   FROM transactions
   WHERE type = 'expense' AND is_deleted = 0`
);

const categoryTotalsStmt = db.prepare(
  `SELECT category, type, COALESCE(SUM(amount), 0) AS total
   FROM transactions
   WHERE is_deleted = 0
   GROUP BY category, type
   ORDER BY total DESC`
);

const monthlyTrendsStmt = db.prepare(
  `SELECT
     strftime('%Y-%m', date) AS month,
     type,
     COALESCE(SUM(amount), 0) AS total
   FROM transactions
   WHERE is_deleted = 0
   GROUP BY month, type
   ORDER BY month ASC`
);

const recentActivityStmt = db.prepare(
  `SELECT t.id, t.amount, t.type, t.category, t.date, t.notes,
          u.name AS created_by
   FROM transactions t
   JOIN users u ON t.created_by = u.id
   WHERE t.is_deleted = 0
   ORDER BY t.created_at DESC
   LIMIT ?`
);

function toNumber(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
}

// GET /dashboard/summary — All roles
function getSummary(req, res) {
  const totalIncome = incomeSummaryStmt.get();
  const totalExpenses = expenseSummaryStmt.get();

  const netBalance = totalIncome.total - totalExpenses.total;

  return res.status(200).json({
    totalIncome: totalIncome.total,
    totalExpenses: totalExpenses.total,
    netBalance,
  });
}

// GET /dashboard/categories — All roles
function getCategoryTotals(req, res) {
  const totals = categoryTotalsStmt.all();

  return res.status(200).json({ categoryTotals: totals });
}

// GET /dashboard/trends — Analyst, Admin
function getMonthlyTrends(req, res) {
  const trends = monthlyTrendsStmt.all();

  return res.status(200).json({ monthlyTrends: trends });
}

// GET /dashboard/recent — All roles
function getRecentActivity(req, res) {
  const { limit = 5 } = req.query;
  const limitValue = toNumber(limit, 5);

  const recent = recentActivityStmt.all(limitValue);

  return res.status(200).json({ recentActivity: recent });
}

module.exports = {
  getSummary,
  getCategoryTotals,
  getMonthlyTrends,
  getRecentActivity,
};