// billing-service: owns bills. Drafts them from order events (event-driven),
// serves the monolith's /api/billing/* flow (request-bill, pending, payment,
// receipt) plus sales reports for the admin dashboard.
const express = require('express');
const logger = require('../../../shared/logger');
const { traceMiddleware } = require('../../../shared/trace');
const { registerSelf } = require('../../../shared/discovery');
const { subscribe, createPublisher } = require('../../../shared/events');
const repo = require('./repositories/billRepository');
const billingService = require('./services/billingService');

const PORT = parseInt(process.env.PORT, 10) || 4004;
const REDIS_URL = process.env.REDIS_URL || 'redis://redis:6379';

const app = express();
app.use(express.json());
app.use(traceMiddleware);

// --- the monolith's billing flow, same paths and shapes ---
app.post('/api/billing/request-bill/:orderId', async (req, res, next) => {
  try {
    const { bill, alreadyRequested } = await billingService.requestBill(req.params.orderId, req.traceId);
    res.status(alreadyRequested ? 200 : 201).json({ bill });
  } catch (err) { next(err); }
});

app.get('/api/billing/pending', async (req, res, next) => {
  try { res.json({ bills: await billingService.listPending() }); }
  catch (err) { next(err); }
});

app.get('/api/billing/:billId/receipt', async (req, res, next) => {
  try { res.json({ receipt: await billingService.receipt(req.params.billId, req.traceId) }); }
  catch (err) { next(err); }
});

app.post('/api/billing/:billId/payment', async (req, res, next) => {
  try { res.json({ bill: await billingService.processPayment(req.params.billId, (req.body || {}).method, req.traceId) }); }
  catch (err) { next(err); }
});

app.get('/api/billing/:billId', async (req, res, next) => {
  try {
    const bill = await billingService.getBillById(req.params.billId);
    const order = await billingService.fetchOrder(bill.order_id, req.traceId);
    res.json({ bill, order });
  } catch (err) { next(err); }
});

// --- bill list (kept from the lab API) ---
app.get('/api/bills', async (req, res, next) => {
  try { res.json({ bills: await billingService.list() }); }
  catch (err) { next(err); }
});

// --- sales reports + the billing share of the dashboard ---
app.get('/api/admin/sales/daily', async (req, res, next) => {
  try { res.json({ sales: await billingService.dailySales() }); }
  catch (err) { next(err); }
});

app.get('/api/admin/sales/weekly', async (req, res, next) => {
  try { res.json({ sales: await billingService.weeklySales() }); }
  catch (err) { next(err); }
});

app.get('/api/admin/revenue', async (req, res, next) => {
  try { res.json({ revenue_today: await billingService.revenueToday() }); }
  catch (err) { next(err); }
});

app.get('/health', (req, res) => res.json({ ok: true, service: 'billing-service', uptime: process.uptime() }));

app.use((err, req, res, next) => res.status(err.status || 500).json({ error: err.message }));

async function start() {
  await logger.initLogger(REDIS_URL);
  await repo.init();
  billingService.setPublisher(await createPublisher(REDIS_URL));
  await subscribe(REDIS_URL, {
    'order.created': billingService.onOrderCreated,
    'order.status.updated': billingService.onOrderStatusUpdated,
    'config.updated': billingService.onConfigUpdated,
  });
  app.listen(PORT, async () => {
    logger.info(`listening on ${PORT}`);
    await registerSelf('billing-service', PORT);
  });
}
start();
