const express = require('express');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const {
  getSummary,
  getCategoryTotals,
  getMonthlyTrends,
  getRecentActivity,
} = require('../controllers/dashboard.controller');

const router = express.Router();

router.use(authenticate);

router.get('/summary', authorize('viewer', 'analyst', 'admin'), getSummary);
router.get('/categories', authorize('viewer', 'analyst', 'admin'), getCategoryTotals);
router.get('/trends', authorize('analyst', 'admin'), getMonthlyTrends);
router.get('/recent', authorize('viewer', 'analyst', 'admin'), getRecentActivity);

module.exports = router;