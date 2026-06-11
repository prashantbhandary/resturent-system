// Repository layer: menu-service's private database (its own Docker volume).
const { openDatabase } = require('../../../../shared/sqlite');

const { run, get, all, exec } = openDatabase();

async function init() {
  await exec(`
    CREATE TABLE IF NOT EXISTS items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      price REAL NOT NULL,
      description TEXT DEFAULT '',
      is_veg INTEGER NOT NULL DEFAULT 0,
      available INTEGER NOT NULL DEFAULT 1
    );
  `);
}

const listAvailable = () => all(`SELECT * FROM items WHERE available = 1 ORDER BY category, name`);
const findById = (id) => get(`SELECT * FROM items WHERE id = ?`, [id]);
const count = async () => (await get(`SELECT COUNT(*) AS n FROM items`)).n;
const create = ({ name, category, price, description = '', is_veg = 0 }) =>
  run(`INSERT INTO items (name, category, price, description, is_veg) VALUES (?, ?, ?, ?, ?)`, [
    name, category, price, description, is_veg ? 1 : 0,
  ]);

module.exports = { init, listAvailable, findById, count, create };
