// Repository layer: menu-service's private database (its own Docker volume).
// Owns the restaurant catalog: categories, menu items and tables (the QR
// targets) — same schema/fields as the monolith so responses match exactly.
const { openDatabase } = require('../../../../shared/sqlite');

const { run, get, all, exec } = openDatabase();

async function init() {
  await exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      icon TEXT DEFAULT '🍽️',
      position INTEGER NOT NULL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      description TEXT DEFAULT '',
      price REAL NOT NULL,
      image TEXT DEFAULT NULL,
      available INTEGER NOT NULL DEFAULT 1,
      is_veg INTEGER NOT NULL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS tables (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      table_number INTEGER UNIQUE NOT NULL,
      capacity INTEGER NOT NULL DEFAULT 4,
      qr_code_url TEXT DEFAULT NULL
    );
  `);
}

// --- categories ---
const listCategories = () => all(`SELECT * FROM categories ORDER BY position ASC, id ASC`);
const findCategory = (id) => get(`SELECT * FROM categories WHERE id = ?`, [id]);
async function createCategory({ name, icon = '🍽️', position = 0 }) {
  const { lastID } = await run(`INSERT INTO categories (name, icon, position) VALUES (?, ?, ?)`, [name, icon, position]);
  return findCategory(lastID);
}
const updateCategory = (id, { name, icon, position }) =>
  run(
    `UPDATE categories SET name = COALESCE(?, name), icon = COALESCE(?, icon), position = COALESCE(?, position) WHERE id = ?`,
    [name, icon, position, id]
  );
const removeCategory = (id) => run(`DELETE FROM categories WHERE id = ?`, [id]);

// --- items ---
const listItems = () => all(`SELECT * FROM items ORDER BY category_id, name`);
const listAvailableItems = () => all(`SELECT * FROM items WHERE available = 1 ORDER BY category_id, name`);
const findItem = (id) => get(`SELECT * FROM items WHERE id = ?`, [id]);
async function createItem({ category_id, name, description = '', price, image = null, available = 1, is_veg = 0 }) {
  const { lastID } = await run(
    `INSERT INTO items (category_id, name, description, price, image, available, is_veg) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [category_id, name, description, price, image, available ? 1 : 0, is_veg ? 1 : 0]
  );
  return findItem(lastID);
}
const updateItem = (id, { category_id, name, description, price, image, available, is_veg }) =>
  run(
    `UPDATE items SET category_id = COALESCE(?, category_id),
                      name = COALESCE(?, name),
                      description = COALESCE(?, description),
                      price = COALESCE(?, price),
                      image = COALESCE(?, image),
                      available = COALESCE(?, available),
                      is_veg = COALESCE(?, is_veg)
     WHERE id = ?`,
    [
      category_id,
      name,
      description,
      price,
      image,
      available === undefined ? null : available ? 1 : 0,
      is_veg === undefined ? null : is_veg ? 1 : 0,
      id,
    ]
  );
const removeItem = (id) => run(`DELETE FROM items WHERE id = ?`, [id]);
const countItems = async () => (await get(`SELECT COUNT(*) AS n FROM items`)).n;

// --- tables ---
const listTables = () => all(`SELECT * FROM tables ORDER BY table_number ASC`);
const findTable = (id) => get(`SELECT * FROM tables WHERE id = ?`, [id]);
const findTableByNumber = (n) => get(`SELECT * FROM tables WHERE table_number = ?`, [n]);
async function createTable({ table_number, capacity = 4 }) {
  const { lastID } = await run(`INSERT INTO tables (table_number, capacity) VALUES (?, ?)`, [table_number, capacity]);
  return findTable(lastID);
}
const updateTable = (id, { table_number, capacity }) =>
  run(`UPDATE tables SET table_number = COALESCE(?, table_number), capacity = COALESCE(?, capacity) WHERE id = ?`, [
    table_number, capacity, id,
  ]);
const removeTable = (id) => run(`DELETE FROM tables WHERE id = ?`, [id]);

module.exports = {
  init,
  listCategories, findCategory, createCategory, updateCategory, removeCategory,
  listItems, listAvailableItems, findItem, createItem, updateItem, removeItem, countItems,
  listTables, findTable, findTableByNumber, createTable, updateTable, removeTable,
};
