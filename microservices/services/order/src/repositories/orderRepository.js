// Repository layer: order-service's private database. Note there is NO menu
// table here and NO users table — those belong to other services. The table
// number is denormalized from menu-service at order time (snapshot), and item
// rows carry name_snapshot/price_at_time exactly like the monolith schema so
// API responses match the frontend's expectations field-for-field.
const { openDatabase } = require('../../../../shared/sqlite');

const { run, get, all, exec } = openDatabase();

async function init() {
  await exec(`
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      table_id INTEGER NOT NULL,
      table_number INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      total REAL NOT NULL,
      items_count INTEGER NOT NULL DEFAULT 0,
      notes TEXT DEFAULT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      item_id INTEGER NOT NULL,
      name_snapshot TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      price_at_time REAL NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending'
    );
  `);
}

async function create({ table_id, table_number, items, notes = null }) {
  const total = items.reduce((s, it) => s + it.price * it.quantity, 0);
  const count = items.reduce((s, it) => s + it.quantity, 0);
  const { lastID } = await run(
    `INSERT INTO orders (table_id, table_number, total, items_count, notes) VALUES (?, ?, ?, ?, ?)`,
    [table_id, table_number, total, count, notes]
  );
  for (const it of items) {
    await run(
      `INSERT INTO order_items (order_id, item_id, name_snapshot, quantity, price_at_time) VALUES (?, ?, ?, ?, ?)`,
      [lastID, it.item_id, it.name, it.quantity, it.price]
    );
  }
  return findById(lastID);
}

const findItems = (orderId) => all(`SELECT * FROM order_items WHERE order_id = ? ORDER BY id ASC`, [orderId]);

async function findById(id) {
  const order = await get(`SELECT * FROM orders WHERE id = ?`, [id]);
  if (!order) return null;
  order.items = await findItems(id);
  return order;
}

async function withItems(orders) {
  for (const o of orders) o.items = await findItems(o.id);
  return orders;
}

// Customer order-status page: active + served orders for one table (same
// status filter as the monolith, so paid history doesn't reappear).
async function listByTable(tableId) {
  return withItems(
    await all(
      `SELECT * FROM orders WHERE table_id = ?
       AND status IN ('pending','accepted','preparing','ready','served')
       ORDER BY created_at DESC`,
      [tableId]
    )
  );
}

// Kitchen view: everything not yet served/paid/cancelled, oldest first.
async function listActive() {
  return withItems(
    await all(
      `SELECT * FROM orders WHERE status IN ('pending','accepted','preparing','ready') ORDER BY created_at ASC`
    )
  );
}

const list = async () => withItems(await all(`SELECT * FROM orders ORDER BY id DESC LIMIT 50`));

const updateStatus = (id, status) =>
  run(`UPDATE orders SET status = ?, updated_at = datetime('now') WHERE id = ?`, [status, id]);

const updateItemStatus = (orderId, itemId, status) =>
  run(`UPDATE order_items SET status = ? WHERE id = ? AND order_id = ?`, [status, itemId, orderId]);

// --- dashboard stats (the order-service's share of /api/admin/dashboard) ---
async function countToday() {
  return (await get(`SELECT COUNT(*) AS c FROM orders WHERE date(created_at) = date('now', 'localtime')`)).c || 0;
}
async function activeTables() {
  return (
    (await get(
      `SELECT COUNT(DISTINCT table_id) AS c FROM orders WHERE status IN ('pending','accepted','preparing','ready')`
    )).c || 0
  );
}
async function pendingCount() {
  return (await get(`SELECT COUNT(*) AS c FROM orders WHERE status = 'pending'`)).c || 0;
}

module.exports = {
  init, create, findById, findItems, list, listByTable, listActive,
  updateStatus, updateItemStatus, countToday, activeTables, pendingCount,
};
