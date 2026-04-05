require('dotenv').config();

const express = require('express');
const authRoutes = require('./routes/auth.routes');
const usersRoutes = require('./routes/users.routes');
const transactionsRoutes = require('./routes/transactions.routes');
const dashboardRoutes = require('./routes/dashboard.routes');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use('/auth', authRoutes);
app.use('/users', usersRoutes);
app.use('/transactions', transactionsRoutes);
app.use('/dashboard', dashboardRoutes);

app.use((req, res) => {
  return res.status(404).json({ error: 'Route not found.' });
});

app.use((err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  const statusCode = err.status || 500;
  const message = err.message || 'Internal server error.';

  return res.status(statusCode).json({ error: message });
});

const PORT = process.env.PORT || 3000;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Finance backend listening on port ${PORT}`);
  });
}

module.exports = app;