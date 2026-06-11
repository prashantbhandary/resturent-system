// order-service: owns orders. Validates against menu-service (sync) and
// announces changes on the event bus (async).
const express = require('express');
const logger = require('../../../shared/logger');
const { traceMiddleware } = require('../../../shared/trace');
const { registerSelf } = require('../../../shared/discovery');
const { createPublisher } = require('../../../shared/events');
const repo = require('./repositories/orderRepository');
const orderService = require('./services/orderService');

const PORT = parseInt(process.env.PORT, 10) || 4003;
const REDIS_URL = process.env.REDIS_URL || 'redis://redis:6379';

const app = express();
app.use(express.json());
app.use(traceMiddleware);

app.post('/api/orders', async (req, res, next) => {
  try { res.status(201).json({ order: await orderService.createOrder(req.body || {}, req.traceId) }); }
  catch (err) { next(err); }
});

app.get('/api/orders', async (req, res, next) => {
  try { res.json({ orders: await orderService.list() }); }
  catch (err) { next(err); }
});

// Customer order-status page: orders for one table.
app.get('/api/orders/table/:tableId', async (req, res, next) => {
  try { res.json({ orders: await orderService.listByTable(req.params.tableId) }); }
  catch (err) { next(err); }
});

app.get('/api/orders/:id', async (req, res, next) => {
  try {
    const order = await orderService.findById(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json({ order });
  } catch (err) { next(err); }
});

app.patch('/api/orders/:id/status', async (req, res, next) => {
  try { res.json({ order: await orderService.updateStatus(req.params.id, (req.body || {}).status, req.traceId) }); }
  catch (err) { next(err); }
});

// Kitchen display routes (the monolith has a kitchen module; here the
// kitchen view is just another face of order data, so order-service owns it).
app.get('/api/kitchen/orders', async (req, res, next) => {
  try { res.json({ orders: await orderService.listActive() }); }
  catch (err) { next(err); }
});

app.patch('/api/kitchen/orders/:id/status', async (req, res, next) => {
  try { res.json({ order: await orderService.updateStatus(req.params.id, (req.body || {}).status, req.traceId) }); }
  catch (err) { next(err); }
});

app.patch('/api/kitchen/orders/:id/items/:itemId/status', async (req, res, next) => {
  try { res.json({ order: await orderService.updateItemStatus(req.params.id, req.params.itemId, (req.body || {}).status, req.traceId) }); }
  catch (err) { next(err); }
});

app.get('/health', (req, res) => res.json({ ok: true, service: 'order-service', uptime: process.uptime() }));

app.use((err, req, res, next) => res.status(err.status || 500).json({ error: err.message }));

async function start() {
  await logger.initLogger(REDIS_URL);
  await repo.init();
  orderService.setPublisher(await createPublisher(REDIS_URL));
  app.listen(PORT, async () => {
    logger.info(`listening on ${PORT}`);
    await registerSelf('order-service', PORT);
  });
}
start();
