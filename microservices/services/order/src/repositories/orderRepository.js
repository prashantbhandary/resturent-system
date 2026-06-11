// Repository layer: order-service's private database. Note there is NO menu
// table here and NO users table — those belong to other services.
const { openDatabase } = require('../../../../shared/sqlite');

const { run, get, all, exec } = openDatabase();

async function init() {
  await exec(`
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      table_number INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      total REAL NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      menu_item_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      price REAL NOT NULL,
      quantity INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending'
    );
  `);
}

// The monolith frontend reads order.table_id; we store table_number — expose both.
function shape(order) {
  if (!order) return order;
  return { ...order, table_id: order.table_number };
}

async function create({ table_number, total, items }) {
  const { lastID } = await run(`INSERT INTO orders (table_number, total) VALUES (?, ?)`, [table_number, total]);
  for (const it of items) {
    await run(
      `INSERT INTO order_items (order_id, menu_item_id, name, price, quantity) VALUES (?, ?, ?, ?, ?)`,
      [lastID, it.menu_item_id, it.name, it.price, it.quantity]
    );
  }
  return findById(lastID);
}

async function findById(id) {
  const order = await get(`SELECT * FROM orders WHERE id = ?`, [id]);
  if (!order) return null;
  order.items = await all(`SELECT * FROM order_items WHERE order_id = ?`, [id]);
  return shape(order);
}

async function listByTable(tableNumber) {
  const orders = await all(
    `SELECT * FROM orders WHERE table_number = ? ORDER BY id DESC LIMIT 20`,
    [tableNumber]
  );
  for (const o of orders) o.items = await all(`SELECT * FROM order_items WHERE order_id = ?`, [o.id]);
  return orders.map(shape);
}

// Kitchen view: everything not yet served/paid, oldest first.
async function listActive() {
  const orders = await all(
    `SELECT * FROM orders WHERE status NOT IN ('served','paid') ORDER BY id ASC LIMIT 50`
  );
  for (const o of orders) o.items = await all(`SELECT * FROM order_items WHERE order_id = ?`, [o.id]);
  return orders.map(shape);
}

const list = async () => (await all(`SELECT * FROM orders ORDER BY id DESC LIMIT 50`)).map(shape);
const updateStatus = (id, status) => run(`UPDATE orders SET status = ? WHERE id = ?`, [status, id]);
const updateItemStatus = (orderId, itemId, status) =>
  run(`UPDATE order_items SET status = ? WHERE id = ? AND order_id = ?`, [status, itemId, orderId]);

module.exports = { init, create, findById, list, listByTable, listActive, updateStatus, updateItemStatus };
