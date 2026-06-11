// Repository layer (clean architecture): the ONLY place that touches the
// database. Upper layers depend on this interface, not on SQL — that's the
// Dependency Inversion Principle (the D in SOLID) applied in a basic way.
const { openDatabase } = require('../../../../shared/sqlite');

const { run, get, exec } = openDatabase();

async function init() {
  await exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'admin',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
}

const findByEmail = (email) => get(`SELECT * FROM users WHERE email = ?`, [email.toLowerCase()]);
const findById = (id) => get(`SELECT id, email, name, role FROM users WHERE id = ?`, [id]);
const create = ({ email, password_hash, name, role }) =>
  run(`INSERT INTO users (email, password_hash, name, role) VALUES (?, ?, ?, ?)`, [
    email.toLowerCase(), password_hash, name, role,
  ]);

module.exports = { init, findByEmail, findById, create };
