const { run, get, all } = require('../config/database');

async function create({ order_id, subtotal, tax, total }) {
  const res = await run(
    `INSERT INTO bills (order_id, subtotal, tax, total, status) VALUES (?, ?, ?, ?, 'pending')`,
    [order_id, subtotal, tax, total]
  );
  return findById(res.lastID);
}

function findById(id) {
  return get(
    `SELECT b.*, o.table_id, t.table_number
     FROM bills b
     JOIN orders o ON o.id = b.order_id
     JOIN tables t ON t.id = o.table_id
     WHERE b.id = ?`,
    [id]
  );
}

function findByOrder(order_id) {
  return get(`SELECT * FROM bills WHERE order_id = ?`, [order_id]);
}

function listPending() {
  return all(
    `SELECT b.*, t.table_number, o.items_count
     FROM bills b
     JOIN orders o ON o.id = b.order_id
     JOIN tables t ON t.id = o.table_id
     WHERE b.status = 'pending'
     ORDER BY b.created_at ASC`
  );
}

function markPaid(id, payment_method) {
  return run(
    `UPDATE bills SET status = 'paid', payment_method = ?, paid_at = datetime('now') WHERE id = ?`,
    [payment_method, id]
  );
}

async function dailySales() {
  const rows = await all(
    `SELECT date(paid_at, 'localtime') as day, COUNT(*) as orders, SUM(total) as revenue
     FROM bills WHERE status = 'paid'
     GROUP BY day ORDER BY day DESC LIMIT 30`
  );
  return rows;
}

async function weeklySales() {
  const rows = await all(
    `SELECT strftime('%Y-W%W', paid_at, 'localtime') as week, COUNT(*) as orders, SUM(total) as revenue
     FROM bills WHERE status = 'paid'
     GROUP BY week ORDER BY week DESC LIMIT 12`
  );
  return rows;
}

module.exports = { create, findById, findByOrder, listPending, markPaid, dailySales, weeklySales };
