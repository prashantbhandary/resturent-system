const bcrypt = require('bcryptjs');
const User = require('../models/user');
const Table = require('../models/table');
const Settings = require('../models/settings');
const config = require('./configService');
const { isEmail, isNonEmptyString } = require('../utils/validators');

/**
 * First-boot provisioning: turns a blank appliance into a configured restaurant.
 * Replaces the seed script's hardcoded demo accounts. Idempotent guard: refuses
 * to run once `provisioned` is set.
 */
async function status() {
  const cfg = await config.publicConfig();
  return {
    provisioned: await config.isProvisioned(),
    restaurant_name: cfg.restaurant_name,
  };
}

async function setup(input) {
  if (await config.isProvisioned()) {
    const err = new Error('Appliance is already provisioned');
    err.status = 409;
    throw err;
  }

  const {
    restaurant_name,
    admin = {},
    currency_code,
    currency_symbol,
    locale,
    tax_rate,
    tax_label,
    service_charge,
    brand_color,
    tables_count,
  } = input;

  if (!isNonEmptyString(restaurant_name)) {
    const err = new Error('restaurant_name is required');
    err.status = 400;
    throw err;
  }
  if (!isEmail(admin.email)) {
    const err = new Error('A valid admin email is required');
    err.status = 400;
    throw err;
  }
  if (!isNonEmptyString(admin.password) || admin.password.length < 8) {
    const err = new Error('Admin password must be at least 8 characters');
    err.status = 400;
    throw err;
  }

  // Create the owner/admin account.
  const password_hash = await bcrypt.hash(admin.password, 10);
  const user = await User.create({
    email: admin.email,
    password_hash,
    name: admin.name || 'Admin',
    role: 'admin',
  });

  // Persist tenant config (only set provided values; defaults already seeded).
  const settingsPatch = { restaurant_name, provisioned: '1' };
  const optional = {
    currency_code,
    currency_symbol,
    locale,
    tax_rate,
    tax_label,
    service_charge,
    brand_color,
  };
  for (const [k, v] of Object.entries(optional)) {
    if (v !== undefined && v !== null && v !== '') settingsPatch[k] = String(v);
  }
  await Settings.setMany(settingsPatch);
  config.invalidate();

  // Create the requested number of tables (default 6).
  const count = Math.max(1, Math.min(parseInt(tables_count, 10) || 6, 200));
  const existing = await Table.listAll();
  const existingNumbers = new Set(existing.map((t) => t.table_number));
  for (let i = 1; i <= count; i += 1) {
    if (!existingNumbers.has(i)) await Table.create({ table_number: i, capacity: 4 });
  }

  return { ok: true, user };
}

module.exports = { status, setup };
