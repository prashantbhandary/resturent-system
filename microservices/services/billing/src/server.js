// billing-service: owns bills. Subscribes to order events instead of being
// called — take it down and orders still flow; bills catch up when it returns
// is the part a real system would add with a durable queue (noted in README).
const express = require('express');
const logger = require('../../../shared/logger');
const { traceMiddleware } = require('../../../shared/trace');
const { registerSelf } = require('../../../shared/discovery');
const { subscribe } = require('../../../shared/events');
const repo = require('./repositories/billRepository');
const billingService = require('./services/billingService');

const PORT = parseInt(process.env.PORT, 10) || 4004;
const REDIS_URL = process.env.REDIS_URL || 'redis://redis:6379';

const app = express();
app.use(express.json());
app.use(traceMiddleware);

app.get('/api/bills', async (req, res, next) => {
  try { res.json({ bills: await billingService.list() }); }
  catch (err) { next(err); }
});

app.get('/api/bills/:orderId', async (req, res, next) => {
  try { res.json({ bill: await billingService.getBill(req.params.orderId) }); }
  catch (err) { next(err); }
});

app.get('/health', (req, res) => res.json({ ok: true, service: 'billing-service', uptime: process.uptime() }));

app.use((err, req, res, next) => res.status(err.status || 500).json({ error: err.message }));

async function start() {
  await logger.initLogger(REDIS_URL);
  await repo.init();
  await subscribe(REDIS_URL, {
    'order.created': billingService.onOrderCreated,
    'order.status.updated': billingService.onOrderStatusUpdated,
  });
  app.listen(PORT, async () => {
    logger.info(`listening on ${PORT}`);
    await registerSelf('billing-service', PORT);
  });
}
start();
