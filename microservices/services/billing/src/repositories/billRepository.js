// Repository layer: billing-service's private database. Bills carry a
// snapshot of the order facts they need (table_number, items_count) taken
// from the order.created event — no JOIN across services is possible, so
// denormalization at event time replaces the monolith's SQL JOIN.
const { openDatabase } = require('../../../../shared/sqlite');

const { run, get, all, exec } = openDatabase();

async function init() {
  await exec(`
    CREATE TABLE IF NOT EXISTS bills (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER UNIQUE NOT NULL,
      table_id INTEGER,
      table_number INTEGER,
      items_count INTEGER NOT NULL DEFAULT 0,
      subtotal REAL NOT NULL,
      tax REAL NOT NULL,
      total REAL NOT NULL,
      status TEXT NOT NULL DEFAULT 'draft',
      payment_method TEXT DEFAULT NULL,
      paid_at TEXT DEFAULT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
}

async function create({ order_id, table_id, table_number, items_count, subtotal, tax, total, status = 'draft' }) {
  const { lastID } = await run(
    `INSERT INTO bills (order_id, table_id, table_number, items_count, subtotal, tax, total, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [order_id, table_id, table_number, items_count, subtotal, tax, total, status]
  );
  return findById(lastID);
}

const findById = (id) => get(`SELECT * FROM bills WHERE id = ?`, [id]);
const findByOrder = (order_id) => get(`SELECT * FROM bills WHERE order_id = ?`, [order_id]);
const listPending = () => all(`SELECT * FROM bills WHERE status = 'pending' ORDER BY created_at ASC`);
const list = () => all(`SELECT * FROM bills ORDER BY id DESC LIMIT 100`);

const setStatus = (id, status) => run(`UPDATE bills SET status = ? WHERE id = ?`, [status, id]);
const setStatusByOrder = (order_id, status) => run(`UPDATE bills SET status = ? WHERE order_id = ?`, [status, order_id]);
const markPaid = (id, payment_method) =>
  run(`UPDATE bills SET status = 'paid', payment_method = ?, paid_at = datetime('now') WHERE id = ?`, [
    payment_method, id,
  ]);

// --- sales reports + dashboard revenue ---
const dailySales = () =>
  all(
    `SELECT date(paid_at, 'localtime') as day, COUNT(*) as orders, SUM(total) as revenue
     FROM bills WHERE status = 'paid' GROUP BY day ORDER BY day DESC LIMIT 30`
  );
const weeklySales = () =>
  all(
    `SELECT strftime('%Y-W%W', paid_at, 'localtime') as week, COUNT(*) as orders, SUM(total) as revenue
     FROM bills WHERE status = 'paid' GROUP BY week ORDER BY week DESC LIMIT 12`
  );
async function revenueToday() {
  const row = await get(
    `SELECT SUM(total) AS r FROM bills WHERE status = 'paid' AND date(paid_at, 'localtime') = date('now', 'localtime')`
  );
  return row.r || 0;
}

module.exports = {
  init, create, findById, findByOrder, listPending, list,
  setStatus, setStatusByOrder, markPaid, dailySales, weeklySales, revenueToday,
};
