const { run, get, all } = require('../config/database');

async function create({ email, password_hash, name, role = 'admin' }) {
  const res = await run(
    `INSERT INTO users (email, password_hash, name, role) VALUES (?, ?, ?, ?)`,
    [email.toLowerCase(), password_hash, name, role]
  );
  return findById(res.lastID);
}

function findById(id) {
  return get(`SELECT id, email, name, role, active, created_at FROM users WHERE id = ?`, [id]);
}

function findByEmail(email) {
  return get(`SELECT * FROM users WHERE email = ?`, [email.toLowerCase()]);
}

function listAll() {
  return all(`SELECT id, email, name, role, active, created_at FROM users ORDER BY created_at DESC`);
}

function setActive(id, active) {
  return run(`UPDATE users SET active = ? WHERE id = ?`, [active ? 1 : 0, id]);
}

function updateRole(id, role) {
  return run(`UPDATE users SET role = ? WHERE id = ?`, [role, id]);
}

function remove(id) {
  return run(`DELETE FROM users WHERE id = ?`, [id]);
}

module.exports = { create, findById, findByEmail, listAll, setActive, updateRole, remove };
