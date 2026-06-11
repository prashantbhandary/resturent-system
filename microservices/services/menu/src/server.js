// menu-service: owns the menu catalog. order-service asks IT for prices
// (a synchronous service-to-service call) instead of reading its database.
const express = require('express');
const logger = require('../../../shared/logger');
const { traceMiddleware } = require('../../../shared/trace');
const { registerSelf } = require('../../../shared/discovery');
const repo = require('./repositories/menuRepository');
const menuService = require('./services/menuService');

const PORT = parseInt(process.env.PORT, 10) || 4002;
const REDIS_URL = process.env.REDIS_URL || 'redis://redis:6379';

const app = express();
app.use(express.json());
app.use(traceMiddleware);

// Controller layer kept inline — the service is intentionally tiny.
app.get('/api/menu', async (req, res, next) => {
  try {
    logger.info('menu listed', { traceId: req.traceId });
    res.json({ categories: await menuService.listMenuGrouped() });
  } catch (err) { next(err); }
});

app.get('/api/menu/items/:id', async (req, res, next) => {
  try { res.json({ item: await menuService.getItem(req.params.id) }); }
  catch (err) { next(err); }
});

app.post('/api/menu/items', async (req, res, next) => {
  try { res.status(201).json({ item: await menuService.addItem(req.body || {}) }); }
  catch (err) { next(err); }
});

app.get('/health', (req, res) => res.json({ ok: true, service: 'menu-service', uptime: process.uptime() }));

app.use((err, req, res, next) => res.status(err.status || 500).json({ error: err.message }));

async function start() {
  await logger.initLogger(REDIS_URL);
  await repo.init();
  await menuService.seedIfEmpty();
  app.listen(PORT, async () => {
    logger.info(`listening on ${PORT}`);
    await registerSelf('menu-service', PORT);
  });
}
start();
