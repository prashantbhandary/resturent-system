const Settings = require('../models/settings');

/**
 * Tenant-configurable runtime config (currency, tax, branding), cached in memory
 * with a short TTL so hot paths (billing, menu) don't hit SQLite every call.
 * Replaces the hardcoded TAX_RATE / currency / branding values.
 */
const CACHE_TTL_MS = 10_000;
let cache = null;
let cachedAt = 0;

const DEFAULTS = {
  restaurant_name: 'My Restaurant',
  currency_code: 'NPR',
  currency_symbol: 'Rs',
  locale: 'en-NP',
  tax_rate: '0.13',
  tax_label: 'VAT',
  service_charge: '0',
  brand_color: '#f97316',
  provisioned: '0',
};

const PUBLIC_KEYS = [
  'restaurant_name',
  'currency_code',
  'currency_symbol',
  'locale',
  'tax_rate',
  'tax_label',
  'service_charge',
  'brand_color',
];

async function load(force = false) {
  if (!force && cache && Date.now() - cachedAt < CACHE_TTL_MS) return cache;
  const stored = await Settings.all();
  cache = { ...DEFAULTS, ...stored };
  cachedAt = Date.now();
  return cache;
}

function invalidate() {
  cache = null;
}

async function get(key) {
  const c = await load();
  return c[key];
}

async function getTaxRate() {
  return parseFloat(await get('tax_rate')) || 0;
}

async function getServiceCharge() {
  return parseFloat(await get('service_charge')) || 0;
}

async function isProvisioned() {
  return (await get('provisioned')) === '1';
}

/** Branding + currency + tax info safe to expose to unauthenticated clients. */
async function publicConfig() {
  const c = await load();
  return Object.fromEntries(PUBLIC_KEYS.map((k) => [k, c[k]]));
}

async function update(partial) {
  await Settings.setMany(partial);
  invalidate();
  return load(true);
}

module.exports = {
  load,
  invalidate,
  get,
  getTaxRate,
  getServiceCharge,
  isProvisioned,
  publicConfig,
  update,
  DEFAULTS,
  PUBLIC_KEYS,
};
