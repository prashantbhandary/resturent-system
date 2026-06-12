const fs = require('fs');
const path = require('path');
const { db, run, get, all, exec } = require('../config/database');
const logger = require('../utils/logger');

const MIGRATIONS_DIR = path.join(__dirname, 'migrations');

/**
 * Forward-only SQL migration runner for the Pi's SQLite database.
 *
 * - Migrations are plain .sql files in ./migrations, named `NNN_description.sql`.
 * - Applied migrations are tracked in `schema_migrations`.
 * - Each file runs inside a transaction; a failure rolls back and aborts.
 *
 * This replaces the previous schema-init-on-boot (CREATE IF NOT EXISTS), so all
 * schema changes are versioned and auditable.
 */
async function ensureMigrationsTable() {
  await exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      applied_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
}

function listMigrationFiles() {
  if (!fs.existsSync(MIGRATIONS_DIR)) return [];
  return fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith('.sql'))
    .sort(); // NNN_ prefixes sort lexicographically == numerically
}

function migrationId(filename) {
  return filename.split('_')[0];
}

function runScript(sql) {
  return new Promise((resolve, reject) => {
    db.exec(sql, (err) => (err ? reject(err) : resolve()));
  });
}

async function migrate({ silent = false } = {}) {
  await ensureMigrationsTable();
  const applied = new Set(
    (await all('SELECT id FROM schema_migrations')).map((r) => r.id)
  );
  const files = listMigrationFiles();
  let count = 0;

  for (const file of files) {
    const id = migrationId(file);
    if (applied.has(id)) continue;

    const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8');
    try {
      await runScript('BEGIN');
      await runScript(sql);
      await run('INSERT INTO schema_migrations (id, name) VALUES (?, ?)', [id, file]);
      await runScript('COMMIT');
      count += 1;
      if (!silent) logger.info(`Applied migration ${file}`);
    } catch (err) {
      await runScript('ROLLBACK').catch(() => {});
      throw new Error(`Migration ${file} failed: ${err.message}`);
    }
  }

  if (!silent) {
    logger.info(count ? `Migrations complete (${count} applied)` : 'Database up to date');
  }
  return { applied: count };
}

async function currentVersion() {
  await ensureMigrationsTable();
  const row = await get('SELECT id FROM schema_migrations ORDER BY id DESC LIMIT 1');
  return row ? row.id : null;
}

module.exports = { migrate, currentVersion };

// Allow `node src/db/migrate.js` to run migrations directly (CI / ops).
if (require.main === module) {
  migrate()
    .then(() => process.exit(0))
    .catch((err) => {
      // eslint-disable-next-line no-console
      console.error(err);
      process.exit(1);
    });
}
