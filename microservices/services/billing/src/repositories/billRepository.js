// Repository layer: billing-service's private database.
const { openDatabase } = require('../../../../shared/sqlite');

const { run, get, all, exec } = openDatabase();

async function init() {
  await exec(`
    CREATE TABLE IF NOT EXISTS bills (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER UNIQUE NOT NULL,
      subtotal REAL NOT NULL,
      tax REAL NOT NULL,
      total REAL NOT NULL,
      status TEXT NOT NULL DEFAULT 'draft',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
}

const create = ({ order_id, subtotal, tax, total }) =>
  run(`INSERT OR IGNORE INTO bills (order_id, subtotal, tax, total) VALUES (?, ?, ?, ?)`, [
    order_id, subtotal, tax, total,
  ]);
const findByOrderId = (orderId) => get(`SELECT * FROM bills WHERE order_id = ?`, [orderId]);
const list = () => all(`SELECT * FROM bills ORDER BY id DESC LIMIT 50`);
const setStatus = (orderId, status) => run(`UPDATE bills SET status = ? WHERE order_id = ?`, [status, orderId]);

module.exports = { init, create, findByOrderId, list, setStatus };
