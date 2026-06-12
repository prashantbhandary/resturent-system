// Repository layer (clean architecture): the ONLY place that touches the
// database. Upper layers depend on this interface, not on SQL — that's the
// Dependency Inversion Principle (the D in SOLID) applied in a basic way.
const { openDatabase } = require('../../../../shared/sqlite');

const { run, get, all, exec } = openDatabase();

async function init() {
  await exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'admin',
      active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
  // Older lab databases predate the active column — add it in place.
  const cols = await all(`PRAGMA table_info(users)`);
  if (!cols.some((c) => c.name === 'active')) {
    await exec(`ALTER TABLE users ADD COLUMN active INTEGER NOT NULL DEFAULT 1`);
  }
}

const PUBLIC_FIELDS = `id, email, name, role, active, created_at`;

const findByEmail = (email) => get(`SELECT * FROM users WHERE email = ?`, [email.toLowerCase()]);
const findById = (id) => get(`SELECT ${PUBLIC_FIELDS} FROM users WHERE id = ?`, [id]);
const listAll = () => all(`SELECT ${PUBLIC_FIELDS} FROM users ORDER BY created_at DESC`);
async function create({ email, password_hash, name, role }) {
  const { lastID } = await run(`INSERT INTO users (email, password_hash, name, role) VALUES (?, ?, ?, ?)`, [
    email.toLowerCase(), password_hash, name, role,
  ]);
  return findById(lastID);
}
const updateRole = (id, role) => run(`UPDATE users SET role = ? WHERE id = ?`, [role, id]);
const setActive = (id, active) => run(`UPDATE users SET active = ? WHERE id = ?`, [active ? 1 : 0, id]);
const remove = (id) => run(`DELETE FROM users WHERE id = ?`, [id]);

module.exports = { init, findByEmail, findById, listAll, create, updateRole, setActive, remove };
