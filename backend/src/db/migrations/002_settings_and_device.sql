-- Tenant configuration (currency, tax, branding) + appliance/device identity.
-- Replaces hardcoded TAX_RATE/currency/demo values with per-restaurant config.

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Sensible defaults; provisioning overwrites these for the specific restaurant.
INSERT OR IGNORE INTO settings (key, value) VALUES
  ('restaurant_name', 'My Restaurant'),
  ('currency_code',   'NPR'),
  ('currency_symbol', 'Rs'),
  ('locale',          'en-NP'),
  ('tax_rate',        '0.13'),
  ('tax_label',       'VAT'),
  ('service_charge',  '0'),
  ('brand_color',     '#f97316'),
  ('provisioned',     '0');

-- Local appliance identity + cached cloud license (one row).
CREATE TABLE IF NOT EXISTS device (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  device_id TEXT,
  tenant_id TEXT,
  location_id TEXT,
  license_key TEXT,
  license_token TEXT,          -- signed license payload (cached)
  license_status TEXT DEFAULT 'unlicensed',
  entitlements TEXT,           -- JSON blob of feature flags / limits
  last_validated_at TEXT,
  grace_until TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

INSERT OR IGNORE INTO device (id) VALUES (1);

-- Outbox of daily sales summaries to push to the cloud (sync, not live traffic).
CREATE TABLE IF NOT EXISTS sync_outbox (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  kind TEXT NOT NULL,          -- e.g. 'daily_summary'
  business_date TEXT NOT NULL,
  payload TEXT NOT NULL,       -- JSON
  synced_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (kind, business_date)
);
