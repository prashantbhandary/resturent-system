// Database-per-service (lab requirement: "Independent databases per service").
//
// Each service owns a private SQLite database stored in its OWN Docker volume
// (see docker-compose.yml). No service ever touches another service's data —
// they exchange information only via APIs and events. This is the key data
// isolation rule of microservices.
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

function openDatabase() {
  const dir = process.env.DATA_DIR || path.join(__dirname, '..', 'data');
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, `${process.env.SERVICE_NAME || 'service'}.sqlite`);
  const db = new sqlite3.Database(file);
  db.serialize(() => {
    db.run('PRAGMA journal_mode = WAL;');
    db.run('PRAGMA foreign_keys = ON;');
  });

  // Small promise wrappers (same style as the monolith).
  const run = (sql, params = []) =>
    new Promise((resolve, reject) => {
      db.run(sql, params, function (err) {
        if (err) return reject(err);
        resolve({ lastID: this.lastID, changes: this.changes });
      });
    });
  const get = (sql, params = []) =>
    new Promise((resolve, reject) => {
      db.get(sql, params, (err, row) => (err ? reject(err) : resolve(row)));
    });
  const all = (sql, params = []) =>
    new Promise((resolve, reject) => {
      db.all(sql, params, (err, rows) => (err ? reject(err) : resolve(rows)));
    });
  const exec = (sql) =>
    new Promise((resolve, reject) => {
      db.exec(sql, (err) => (err ? reject(err) : resolve()));
    });

  return { db, run, get, all, exec };
}

module.exports = { openDatabase };
