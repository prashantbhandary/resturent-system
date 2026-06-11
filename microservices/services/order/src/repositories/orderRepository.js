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
      quantity INTEGER NOT NULL
    );
  `);
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
  return order;
}

const list = () => all(`SELECT * FROM orders ORDER BY id DESC LIMIT 50`);
const updateStatus = (id, status) => run(`UPDATE orders SET status = ? WHERE id = ?`, [status, id]);

module.exports = { init, create, findById, list, updateStatus };
