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
      available INTEGER NOT NULL DEFAULT 1
    );
  `);
}

const listAvailable = () => all(`SELECT * FROM items WHERE available = 1 ORDER BY category, name`);
const findById = (id) => get(`SELECT * FROM items WHERE id = ?`, [id]);
const count = async () => (await get(`SELECT COUNT(*) AS n FROM items`)).n;
const create = ({ name, category, price }) =>
  run(`INSERT INTO items (name, category, price) VALUES (?, ?, ?)`, [name, category, price]);

module.exports = { init, listAvailable, findById, count, create };
