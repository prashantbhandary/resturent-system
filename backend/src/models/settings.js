const { run, get, all } = require('../config/database');

const Settings = {
  async get(key) {
    const row = await get('SELECT value FROM settings WHERE key = ?', [key]);
    return row ? row.value : null;
  },

  async getMany(keys) {
    const placeholders = keys.map(() => '?').join(',');
    const rows = await all(
      `SELECT key, value FROM settings WHERE key IN (${placeholders})`,
      keys
    );
    return Object.fromEntries(rows.map((r) => [r.key, r.value]));
  },

  async all() {
    const rows = await all('SELECT key, value FROM settings');
    return Object.fromEntries(rows.map((r) => [r.key, r.value]));
  },

  async set(key, value) {
    await run(
      `INSERT INTO settings (key, value, updated_at) VALUES (?, ?, datetime('now'))
       ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = datetime('now')`,
      [key, value == null ? null : String(value)]
    );
  },

  async setMany(obj) {
    for (const [key, value] of Object.entries(obj)) {
      await this.set(key, value);
    }
  },
};

module.exports = Settings;
