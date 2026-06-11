// API Gateway (lab requirement: "API Gateway").
//
// The single front door. Clients only ever talk to the gateway; it
//   1. rate-limits every request            (lib/rateLimiter.js)
//   2. assigns/propagates the trace id      (shared/trace.js)
//   3. authenticates protected routes by calling auth-service
//   4. discovers a healthy instance of the target service (shared/discovery)
//      and round-robins between instances    = load balancing
//   5. proxies the request through a circuit breaker (lib/circuitBreaker.js)
const express = require('express');
const logger = require('../../../shared/logger');
const { traceMiddleware } = require('../../../shared/trace');
const { resolve } = require('../../../shared/discovery');
const { rateLimiter } = require('./lib/rateLimiter');
const { getBreaker, states } = require('./lib/circuitBreaker');

const PORT = parseInt(process.env.PORT, 10) || 8080;
const REDIS_URL = process.env.REDIS_URL || 'redis://redis:6379';

// Routing table: URL prefix -> owning service.
const ROUTES = [
  { prefix: '/api/auth', service: 'auth-service' },
  { prefix: '/api/menu', service: 'menu-service' },
  { prefix: '/api/orders', service: 'order-service' },
  { prefix: '/api/bills', service: 'billing-service' },
  { prefix: '/api/logs', service: 'logging-service' },
];

// Routes that require a valid JWT (verified by auth-service).
const PROTECTED = [
  { method: 'PATCH', prefix: '/api/orders' }, // staff update order status
  { method: 'GET', prefix: '/api/bills' },    // staff read bills
  { method: 'POST', prefix: '/api/menu' },    // staff add menu items
];

const app = express();
app.set('trust proxy', true);
app.use(express.json());
app.use(traceMiddleware);
// Health/observability endpoints are exempt from rate limiting — monitoring
// must keep working even when a client is being throttled.
app.use((req, res, next) => (req.path.startsWith('/health') ? next() : rateLimiter(req, res, next)));

// --- observability endpoints ---
app.get('/health', (req, res) => res.json({ ok: true, service: 'gateway', uptime: process.uptime() }));
app.get('/health/circuits', (req, res) => res.json(states()));
// Fan-out health: ping every service so one URL shows whole-system status.
app.get('/health/services', async (req, res) => {
  const out = {};
  await Promise.all(
    ROUTES.map(async ({ service }) => {
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

// --- the proxy itself ---
app.use(async (req, res) => {
  const route = ROUTES.find((r) => req.path.startsWith(r.prefix));
  if (!route) return res.status(404).json({ error: 'No such route' });

  try {
    if (PROTECTED.some((p) => p.method === req.method && req.path.startsWith(p.prefix))) {
      await authenticate(req); // 401s before the request ever reaches a service
    }

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

async function start() {
  await logger.initLogger(REDIS_URL);
  app.listen(PORT, () => logger.info(`gateway listening on ${PORT}`));
}
start();
