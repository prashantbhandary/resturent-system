// logging-service (lab requirement: "Centralized logging").
//
// Subscribes to the Redis "logs" channel where every service publishes its
// structured log entries, keeps the most recent ones in a ring buffer, and
// exposes them over HTTP. Filter by service or traceId:
//
//   GET /api/logs                     -> latest from everyone
//   GET /api/logs?service=order-service
//   GET /api/logs?traceId=<id>        -> one request's path across services
//                                        (this is the distributed trace view)
const express = require('express');
const { createClient } = require('redis');
const { registerSelf } = require('../../../shared/discovery');

const PORT = parseInt(process.env.PORT, 10) || 4005;
const REDIS_URL = process.env.REDIS_URL || 'redis://redis:6379';
const MAX_ENTRIES = 2000;

const entries = []; // ring buffer of recent log entries

const app = express();

app.get('/api/logs', (req, res) => {
  const { service, traceId, level } = req.query;
  const limit = Math.min(parseInt(req.query.limit, 10) || 200, MAX_ENTRIES);
  let out = entries;
  if (service) out = out.filter((e) => e.service === service);
  if (traceId) out = out.filter((e) => e.traceId === traceId);
  if (level) out = out.filter((e) => e.level === level);
  res.json({ count: Math.min(out.length, limit), logs: out.slice(-limit) });
});

app.get('/health', (req, res) => res.json({ ok: true, service: 'logging-service', uptime: process.uptime(), stored: entries.length }));

async function start() {
  const sub = createClient({ url: REDIS_URL });
  sub.on('error', () => {});
  await sub.connect();
  await sub.subscribe('logs', (raw) => {
    try {
      entries.push(JSON.parse(raw));
      if (entries.length > MAX_ENTRIES) entries.shift();
    } catch { /* ignore malformed */ }
  });
  app.listen(PORT, async () => {
    console.log(JSON.stringify({ service: 'logging-service', message: `listening on ${PORT}` }));
    await registerSelf('logging-service', PORT);
  });
}
start();
