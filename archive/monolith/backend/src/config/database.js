const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { DATABASE_PATH } = require('./env');

const dbPath = path.isAbsolute(DATABASE_PATH)
  ? DATABASE_PATH
  : path.join(__dirname, '..', '..', DATABASE_PATH);

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Database connection error:', err.message);
    process.exit(1);
  }
  console.log(`Connected to SQLite at ${dbPath}`);
});

// WAL mode lets readers (KDS, customer phones) and a writer work concurrently —
// important on a Pi serving many devices off one SQLite file.
db.serialize(() => {
  db.run('PRAGMA journal_mode = WAL;');
  db.run('PRAGMA synchronous = NORMAL;');
  db.run('PRAGMA foreign_keys = ON;');
  db.run('PRAGMA busy_timeout = 5000;');
});

function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) return reject(err);
      resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
}

function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) return reject(err);
      resolve(row);
    });
  });
}

function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
}

function exec(sql) {
  return new Promise((resolve, reject) => {
    db.exec(sql, (err) => {
      if (err) return reject(err);
      resolve();
    });
  });
}

module.exports = { db, run, get, all, exec };
