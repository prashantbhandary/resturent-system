const { run, get, all, db } = require('../config/database');

function createWithItems({ table_id, items, notes = null }) {
  // items: [{ item_id, name, price, quantity }]
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run('BEGIN TRANSACTION');
      const total = items.reduce((sum, it) => sum + it.price * it.quantity, 0);
      const count = items.reduce((sum, it) => sum + it.quantity, 0);

      db.run(
        `INSERT INTO orders (table_id, status, total, items_count, notes) VALUES (?, 'pending', ?, ?, ?)`,
        [table_id, total, count, notes],
        function (err) {
          if (err) {
            db.run('ROLLBACK');
            return reject(err);
          }
          const orderId = this.lastID;
          const stmt = db.prepare(
            `INSERT INTO order_items (order_id, item_id, name_snapshot, quantity, price_at_time, status)
             VALUES (?, ?, ?, ?, ?, 'pending')`
          );
          let pending = items.length;
          let errored = false;
          if (pending === 0) {
            stmt.finalize();
            db.run('COMMIT', (e) => (e ? reject(e) : resolve(orderId)));
            return;
          }
          items.forEach((it) => {
            stmt.run(
              [orderId, it.item_id, it.name, it.quantity, it.price],
              (err2) => {
                if (err2 && !errored) {
                  errored = true;
                  db.run('ROLLBACK');
                  return reject(err2);
                }
                pending -= 1;
                if (pending === 0 && !errored) {
                  stmt.finalize();
                  db.run('COMMIT', (e) => (e ? reject(e) : resolve(orderId)));
                }
              }
            );
          });
        }
      );
    });
  });
}

function findById(id) {
  return get(`SELECT o.*, t.table_number FROM orders o
              JOIN tables t ON t.id = o.table_id
              WHERE o.id = ?`, [id]);
}

function findItems(order_id) {
  return all(`SELECT * FROM order_items WHERE order_id = ? ORDER BY id ASC`, [order_id]);
}

async function findWithItems(id) {
  const order = await findById(id);
  if (!order) return null;
  order.items = await findItems(id);
  return order;
}

function listByStatus(statuses) {
  const placeholders = statuses.map(() => '?').join(',');
  return all(
    `SELECT o.*, t.table_number FROM orders o
     JOIN tables t ON t.id = o.table_id
     WHERE o.status IN (${placeholders})
     ORDER BY o.created_at ASC`,
    statuses
  );
}

async function listActiveWithItems() {
  const orders = await listByStatus(['pending', 'accepted', 'preparing', 'ready']);
  for (const o of orders) {
    o.items = await findItems(o.id);
  }
  return orders;
}

function listByTable(table_id, statuses = null) {
  if (statuses) {
    const placeholders = statuses.map(() => '?').join(',');
    return all(
      `SELECT * FROM orders WHERE table_id = ? AND status IN (${placeholders}) ORDER BY created_at DESC`,
      [table_id, ...statuses]
    );
  }
  return all(`SELECT * FROM orders WHERE table_id = ? ORDER BY created_at DESC`, [table_id]);
}

function updateStatus(id, status) {
  return run(
    `UPDATE orders SET status = ?, updated_at = datetime('now') WHERE id = ?`,
    [status, id]
  );
}

function updateItemStatus(item_id, status) {
  return run(`UPDATE order_items SET status = ? WHERE id = ?`, [status, item_id]);
}

async function countToday() {
  const row = await get(
    `SELECT COUNT(*) as c FROM orders WHERE date(created_at) = date('now', 'localtime')`
  );
  return row.c || 0;
}

async function revenueToday() {
  const row = await get(
    `SELECT COALESCE(SUM(b.total), 0) as total FROM bills b
     WHERE b.status = 'paid' AND date(b.paid_at) = date('now', 'localtime')`
  );
  return row.total || 0;
}

async function activeTables() {
  const row = await get(
    `SELECT COUNT(DISTINCT table_id) as c FROM orders WHERE status NOT IN ('paid', 'cancelled')`
  );
  return row.c || 0;
}

async function pendingCount() {
  const row = await get(
    `SELECT COUNT(*) as c FROM orders WHERE status IN ('pending', 'accepted', 'preparing')`
  );
  return row.c || 0;
}

module.exports = {
  createWithItems,
  findById,
  findItems,
  findWithItems,
  listByStatus,
  listActiveWithItems,
  listByTable,
  updateStatus,
  updateItemStatus,
  countToday,
  revenueToday,
  activeTables,
  pendingCount,
};
