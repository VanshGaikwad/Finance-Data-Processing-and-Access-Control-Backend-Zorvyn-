require('dotenv').config();

const bcrypt = require('bcryptjs');
const db = require('./config/database');

const hashedPassword = (password) => bcrypt.hashSync(password, 10);

const seedDatabase = db.transaction(() => {
  db.prepare('DELETE FROM transactions').run();
  db.prepare('DELETE FROM users').run();
  db.prepare("DELETE FROM sqlite_sequence WHERE name IN ('users', 'transactions')").run();

  const users = [
    {
      name: 'Aarav Mehta',
      email: 'admin@zorvyn.com',
      password: hashedPassword('Admin@123'),
      role: 'admin',
    },
    {
      name: 'Riya Kapoor',
      email: 'analyst@zorvyn.com',
      password: hashedPassword('Analyst@123'),
      role: 'analyst',
    },
    {
      name: 'Neel Joshi',
      email: 'viewer@zorvyn.com',
      password: hashedPassword('Viewer@123'),
      role: 'viewer',
    },
  ];

  const insertedUsers = users.map((user) => {
    const result = db
      .prepare('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)')
      .run(user.name, user.email, user.password, user.role);

    return {
      ...user,
      id: Number(result.lastInsertRowid),
    };
  });

  const userIds = {
    admin: insertedUsers[0].id,
    analyst: insertedUsers[1].id,
    viewer: insertedUsers[2].id,
  };

  const transactions = [
    { amount: 6200, type: 'income', category: 'Retainer', date: '2026-01-04', notes: 'Agency retainer for January', created_by: userIds.admin },
    { amount: 845, type: 'expense', category: 'Internet', date: '2026-01-15', notes: 'Office connectivity bill', created_by: userIds.viewer },
    { amount: 910, type: 'income', category: 'Consulting', date: '2026-02-03', notes: 'Strategy review engagement', created_by: userIds.analyst },
    { amount: 275, type: 'expense', category: 'Utilities', date: '2026-02-11', notes: 'Power and water charges', created_by: userIds.viewer },
    { amount: 1350, type: 'income', category: 'Incentive', date: '2026-02-26', notes: 'Quarterly performance incentive', created_by: userIds.admin },
    { amount: 190, type: 'expense', category: 'Software', date: '2026-03-04', notes: 'Team productivity tools', created_by: userIds.admin },
    { amount: 410, type: 'expense', category: 'Travel', date: '2026-03-12', notes: 'Site visit and local transit', created_by: userIds.analyst },
    { amount: 560, type: 'income', category: 'Freelance', date: '2026-03-20', notes: 'Short-term design work', created_by: userIds.analyst },
    { amount: 225, type: 'expense', category: 'Marketing', date: '2026-04-01', notes: 'Campaign ads and creatives', created_by: userIds.viewer },
    { amount: 1525, type: 'income', category: 'Investments', date: '2026-04-05', notes: 'Portfolio dividend payout', created_by: userIds.admin },
  ];

  const insertTransactionStmt = db.prepare(
    `INSERT INTO transactions (amount, type, category, date, notes, created_by)
     VALUES (?, ?, ?, ?, ?, ?)`
  );

  transactions.forEach((transaction) => {
    insertTransactionStmt.run(
      transaction.amount,
      transaction.type,
      transaction.category,
      transaction.date,
      transaction.notes,
      transaction.created_by
    );
  });
});

try {
  seedDatabase();
  console.log('Database seeded successfully.');
} catch (error) {
  console.error('Seed failed:', error.message);
  process.exitCode = 1;
}