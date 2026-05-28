const { run, get, all } = require('../config/database');

async function create({ table_number, capacity = 4, qr_code_url = null }) {
  const res = await run(
    `INSERT INTO tables (table_number, capacity, qr_code_url) VALUES (?, ?, ?)`,
    [table_number, capacity, qr_code_url]
  );
  return findById(res.lastID);
}

function findById(id) {
  return get(`SELECT * FROM tables WHERE id = ?`, [id]);
}

function findByNumber(number) {
  return get(`SELECT * FROM tables WHERE table_number = ?`, [number]);
}

function listAll() {
  return all(`SELECT * FROM tables ORDER BY table_number ASC`);
}

function update(id, { table_number, capacity, qr_code_url }) {
  return run(
    `UPDATE tables SET table_number = COALESCE(?, table_number),
                       capacity = COALESCE(?, capacity),
                       qr_code_url = COALESCE(?, qr_code_url)
     WHERE id = ?`,
    [table_number, capacity, qr_code_url, id]
  );
}

function remove(id) {
  return run(`DELETE FROM tables WHERE id = ?`, [id]);
}

module.exports = { create, findById, findByNumber, listAll, update, remove };
