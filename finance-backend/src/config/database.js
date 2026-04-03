const path = require('path');
const SQLite = require('better-sqlite3');

const DB_FILE = path.resolve(__dirname, '..', '..', 'finance.db');
const connection = new SQLite(DB_FILE);

function applyPragmas(db) {
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
}

function buildSchema(db) {
  const usersTable = `
    CREATE TABLE IF NOT EXISTS users (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      name       TEXT    NOT NULL,
      email      TEXT    UNIQUE NOT NULL,
      password   TEXT    NOT NULL,
      role       TEXT    NOT NULL DEFAULT 'viewer'
                 CHECK(role IN ('viewer', 'analyst', 'admin')),
      status     TEXT    NOT NULL DEFAULT 'active'
                 CHECK(status IN ('active', 'inactive')),
      created_at TEXT    DEFAULT (datetime('now'))
    );
  `;

  const transactionsTable = `
    CREATE TABLE IF NOT EXISTS transactions (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      amount     REAL    NOT NULL CHECK(amount > 0),
      type       TEXT    NOT NULL CHECK(type IN ('income', 'expense')),
      category   TEXT    NOT NULL,
      date       TEXT    NOT NULL,
      notes      TEXT,
      created_by INTEGER NOT NULL REFERENCES users(id),
      is_deleted INTEGER NOT NULL DEFAULT 0,
      created_at TEXT    DEFAULT (datetime('now')),
      updated_at TEXT    DEFAULT (datetime('now'))
    );
  `;

  db.exec(`${usersTable}\n${transactionsTable}`);
}

applyPragmas(connection);
buildSchema(connection);

module.exports = connection;