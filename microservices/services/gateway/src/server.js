// API Gateway (lab requirement: "API Gateway").
//
// The single front door. Clients only ever talk to the gateway; it
//   1. rate-limits every request            (lib/rateLimiter.js)
//   2. assigns/propagates the trace id      (shared/trace.js)
//   3. authenticates protected routes by calling auth-service
//   4. discovers a healthy instance of the target service (shared/discovery)
//      and round-robins between instances    = load balancing
//   5. proxies the request through a circuit breaker (lib/circuitBreaker.js)
//   6. bridges the Redis event bus to Socket.io so the React frontend gets
//      the same real-time events the monolith emitted
const express = require('express');
const http = require('http');
const fs = require('fs');
const path = require('path');
const { Server: SocketServer } = require('socket.io');
const logger = require('../../../shared/logger');
const { traceMiddleware } = require('../../../shared/trace');
const { resolve } = require('../../../shared/discovery');
const { subscribe, createPublisher } = require('../../../shared/events');
const { rateLimiter } = require('./lib/rateLimiter');
const { getBreaker, states } = require('./lib/circuitBreaker');

const PORT = parseInt(process.env.PORT, 10) || 8080;
const REDIS_URL = process.env.REDIS_URL || 'redis://redis:6379';

// Routing table: URL prefix -> owning service. Longest prefix wins, so the
// /api/admin/* sub-resources can live with the service that owns the data.
const ROUTES = [
  { prefix: '/api/auth', service: 'auth-service' },
  { prefix: '/api/admin/staff', service: 'auth-service' },
  { prefix: '/api/menu', service: 'menu-service' },
  { prefix: '/api/admin/menu', service: 'menu-service' },
  { prefix: '/api/admin/tables', service: 'menu-service' },
  { prefix: '/api/orders', service: 'order-service' },
  { prefix: '/api/kitchen', service: 'order-service' }, // kitchen view = orders
  { prefix: '/api/billing', service: 'billing-service' },
  { prefix: '/api/bills', service: 'billing-service' },
  { prefix: '/api/admin/sales', service: 'billing-service' },
  { prefix: '/api/logs', service: 'logging-service' },
].sort((a, b) => b.prefix.length - a.prefix.length);

// Routes that require a valid JWT (verified by auth-service); role: which
// role may pass (monolith parity: most admin routes are admin-only, the
// dashboard itself only needs a login).
const PROTECTED = [
  { method: '*', prefix: '/api/admin/menu', role: 'admin' },
  { method: '*', prefix: '/api/admin/tables', role: 'admin' },
  { method: '*', prefix: '/api/admin/staff', role: 'admin' },
  { method: '*', prefix: '/api/admin/sales', role: 'admin' },
  { method: '*', prefix: '/api/admin', role: null },
  { method: 'PATCH', prefix: '/api/orders', role: null },  // staff update order status
  { method: 'PATCH', prefix: '/api/kitchen', role: null }, // kitchen staff actions
  { method: 'GET', prefix: '/api/bills', role: null },     // staff read bills
  { method: 'POST', prefix: '/api/menu', role: 'admin' },  // staff add menu items
];

// --- tenant config (currency, tax, branding), persisted on the gateway ---
const CONFIG_DEFAULTS = {
  restaurant_name: 'DineQR Microservices',
  currency_code: 'NPR',
  currency_symbol: 'Rs',
  locale: 'en-NP',
  tax_rate: process.env.TAX_RATE || '0.13',
  tax_label: 'VAT',
  service_charge: '0',
  brand_color: '#f97316',
};
const CONFIG_KEYS = Object.keys(CONFIG_DEFAULTS);
const CONFIG_FILE = path.join(process.env.DATA_DIR || '/tmp', 'config.json');

function loadConfig() {
  try { return { ...CONFIG_DEFAULTS, ...JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8')) }; }
  catch { return { ...CONFIG_DEFAULTS }; }
}
function saveConfig(cfg) {
  fs.mkdirSync(path.dirname(CONFIG_FILE), { recursive: true });
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(cfg, null, 2));
}

let publisher = null;

const app = express();
app.set('trust proxy', true);
app.use(express.json());
app.use(traceMiddleware);
// CORS: the React frontend (vite dev server on another port) calls the
// gateway cross-origin. Hand-rolled like everything else in this lab.
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-trace-id');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});
// Health/observability endpoints are exempt from rate limiting — monitoring
// must keep working even when a client is being throttled.
app.use((req, res, next) => (req.path.startsWith('/health') ? next() : rateLimiter(req, res, next)));

// --- edge authentication for protected routes ---
async function authenticate(req) {
  const base = await resolve('auth-service');
  const r = await fetch(`${base}/api/auth/verify`, {
    headers: { authorization: req.headers.authorization || '', 'x-trace-id': req.traceId },
    signal: AbortSignal.timeout(3000),
  });
  if (!r.ok) {
    const err = new Error('Unauthorized');
    err.status = 401;
    throw err;
  }
  return (await r.json()).user;
}

async function authorize(req) {
  const rule = PROTECTED.find(
    (p) => (p.method === '*' || p.method === req.method) && req.path.startsWith(p.prefix)
  );
  if (!rule) return null;
  const user = await authenticate(req); // 401s before the request ever reaches a service
  if (rule.role && user.role !== rule.role) {
    const err = new Error('Forbidden');
    err.status = 403;
    throw err;
  }
  return user;
}

// --- config + provisioning (tenant-level concerns, served at the edge) ---
app.get('/api/config', (req, res) => res.json({ config: loadConfig() }));

app.put('/api/config', async (req, res) => {
  try {
    const user = await authenticate(req);
    if (user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
    const cfg = loadConfig();
    for (const k of CONFIG_KEYS) {
      if (req.body[k] !== undefined) cfg[k] = String(req.body[k]);
    }
    saveConfig(cfg);
    // billing-service listens for tax_rate changes — event, not a call.
    if (publisher) await publisher.publish('config.updated', cfg, req.traceId);
    res.json({ ok: true, config: cfg, provisioned: true });
  } catch (err) {
    res.status(err.status || 502).json({ error: err.message });
  }
});

// The lab system ships pre-seeded (demo users + menu), so it is always
// provisioned; the monolith's first-boot wizard never needs to run.
app.get('/api/provisioning/status', (req, res) =>
  res.json({ provisioned: true, restaurant_name: loadConfig().restaurant_name })
);
app.post('/api/provisioning/setup', (req, res) =>
  res.status(400).json({ error: 'Already provisioned' })
);

// --- observability endpoints ---
app.get('/health', (req, res) => res.json({ ok: true, service: 'gateway', uptime: process.uptime() }));
app.get('/health/circuits', (req, res) => res.json(states()));
// Fan-out health: ping every service so one URL shows whole-system status.
app.get('/health/services', async (req, res) => {
  const out = {};
  const services = [...new Set(ROUTES.map((r) => r.service))];
  await Promise.all(
    services.map(async (service) => {
      try {
        const base = await resolve(service);
        const r = await fetch(`${base}/health`, { signal: AbortSignal.timeout(2000) });
        out[service] = r.ok ? await r.json() : { ok: false, status: r.status };
      } catch (err) {
        out[service] = { ok: false, error: err.message };
      }
    })
  );
  res.json(out);
});

// --- dashboard composition: one frontend call, two owning services ---
app.get('/api/admin/dashboard', async (req, res) => {
  try {
    await authenticate(req);
    const [orderBase, billingBase] = await Promise.all([resolve('order-service'), resolve('billing-service')]);
    const headers = { 'x-trace-id': req.traceId };
    const [statsRes, revenueRes] = await Promise.all([
      fetch(`${orderBase}/api/admin/stats`, { headers, signal: AbortSignal.timeout(4000) }),
      fetch(`${billingBase}/api/admin/revenue`, { headers, signal: AbortSignal.timeout(4000) }),
    ]);
    const stats = statsRes.ok ? await statsRes.json() : {};
    const revenue = revenueRes.ok ? await revenueRes.json() : {};
    res.json({ stats: { ...stats, revenue_today: revenue.revenue_today || 0 } });
  } catch (err) {
    res.status(err.status || 502).json({ error: err.message, traceId: req.traceId });
  }
});

// --- the proxy itself ---
app.use(async (req, res) => {
  const route = ROUTES.find((r) => req.path.startsWith(r.prefix));
  if (!route) return res.status(404).json({ error: 'No such route' });

  try {
    await authorize(req);

    const breaker = getBreaker(route.service);
    const { status, body } = await breaker.exec(async () => {
      const base = await resolve(route.service); // discovery + round-robin LB
      const upstream = await fetch(base + req.originalUrl, {
        method: req.method,
        headers: {
          'content-type': 'application/json',
          authorization: req.headers.authorization || '',
          'x-trace-id': req.traceId,
        },
        body: ['GET', 'HEAD'].includes(req.method) ? undefined : JSON.stringify(req.body || {}),
        signal: AbortSignal.timeout(5000),
      });
      // 5xx from the service counts as a failure for the breaker
      if (upstream.status >= 500) throw new Error(`${route.service} returned ${upstream.status}`);
      return { status: upstream.status, body: await upstream.json().catch(() => ({})) };
    });

    logger.info(`${req.method} ${req.path} -> ${route.service} ${status}`, { traceId: req.traceId });
    res.status(status).json(body);
  } catch (err) {
    logger.error(`${req.method} ${req.path} -> ${route.service} FAILED: ${err.message}`, { traceId: req.traceId });
    res.status(err.status || 502).json({ error: err.message, traceId: req.traceId });
  }
});

// --- Socket.io bridge: Redis bus events -> the monolith's socket events ---
// The frontend's components subscribe to these exact names; emitting them
// from the gateway keeps the React app 100% unchanged.
const server = http.createServer(app);
const io = new SocketServer(server, { cors: { origin: '*' } });

const SOCKET_BRIDGE = {
  'order.created': (data) => {
    io.emit('order:created', data);
    io.emit('kitchen:new-order', { order_id: data.id, urgency: 'normal' });
  },
  'order.status.updated': (data) => io.emit('order:status-changed', data),
  'order.item.updated': (data) => io.emit('order:item-status', data),
  'bill.generated': (data) => io.emit('bill:generated', data),
  'bill.paid': (data) => io.emit('bill:paid', data),
};

async function start() {
  await logger.initLogger(REDIS_URL);
  publisher = await createPublisher(REDIS_URL);
  await subscribe(
    REDIS_URL,
    Object.fromEntries(
      Object.entries(SOCKET_BRIDGE).map(([type, emit]) => [type, (event) => emit(event.data)])
    )
  );
  server.listen(PORT, () => logger.info(`gateway listening on ${PORT}`));
}
start();
