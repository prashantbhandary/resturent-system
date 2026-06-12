// menu-service: owns the restaurant catalog (menu categories, items, tables).
// order-service asks IT for prices and table validity (synchronous
// service-to-service calls) instead of reading its database.
const express = require('express');
const QRCode = require('qrcode');
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

// --- public menu (customer-facing) ---
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

// --- tables (consumed by order-service to validate, and by admin UI) ---
app.get('/api/tables/:id', async (req, res, next) => {
  try {
    const table = await repo.findTable(req.params.id);
    if (!table) return res.status(404).json({ error: 'Table not found' });
    res.json({ table });
  } catch (err) { next(err); }
});

// --- admin: menu items ---
app.get('/api/admin/menu/items', async (req, res, next) => {
  try { res.json({ items: await repo.listItems() }); }
  catch (err) { next(err); }
});

app.post('/api/admin/menu/items', async (req, res, next) => {
  try { res.status(201).json({ item: await menuService.addItem(req.body || {}) }); }
  catch (err) { next(err); }
});

app.put('/api/admin/menu/items/:id', async (req, res, next) => {
  try {
    await repo.updateItem(parseInt(req.params.id, 10), req.body || {});
    res.json({ item: await repo.findItem(parseInt(req.params.id, 10)) });
  } catch (err) { next(err); }
});

app.delete('/api/admin/menu/items/:id', async (req, res, next) => {
  try {
    await repo.removeItem(parseInt(req.params.id, 10));
    res.json({ ok: true });
  } catch (err) { next(err); }
});

// --- admin: categories ---
app.get('/api/admin/menu/categories', async (req, res, next) => {
  try { res.json({ categories: await repo.listCategories() }); }
  catch (err) { next(err); }
});

app.post('/api/admin/menu/categories', async (req, res, next) => {
  try {
    const { name, icon, position } = req.body || {};
    if (!name) return res.status(400).json({ error: 'Name required' });
    res.status(201).json({ category: await repo.createCategory({ name, icon, position }) });
  } catch (err) { next(err); }
});

app.put('/api/admin/menu/categories/:id', async (req, res, next) => {
  try {
    await repo.updateCategory(parseInt(req.params.id, 10), req.body || {});
    res.json({ category: await repo.findCategory(parseInt(req.params.id, 10)) });
  } catch (err) { next(err); }
});

app.delete('/api/admin/menu/categories/:id', async (req, res, next) => {
  try {
    await repo.removeCategory(parseInt(req.params.id, 10));
    res.json({ ok: true });
  } catch (err) { next(err); }
});

// --- admin: tables + QR codes ---
app.get('/api/admin/tables', async (req, res, next) => {
  try { res.json({ tables: await repo.listTables() }); }
  catch (err) { next(err); }
});

app.post('/api/admin/tables', async (req, res, next) => {
  try {
    const { table_number, capacity } = req.body || {};
    if (!table_number) return res.status(400).json({ error: 'table_number required' });
    res.status(201).json({ table: await repo.createTable({ table_number, capacity }) });
  } catch (err) { next(err); }
});

app.put('/api/admin/tables/:id', async (req, res, next) => {
  try {
    await repo.updateTable(parseInt(req.params.id, 10), req.body || {});
    res.json({ table: await repo.findTable(parseInt(req.params.id, 10)) });
  } catch (err) { next(err); }
});

app.delete('/api/admin/tables/:id', async (req, res, next) => {
  try {
    await repo.removeTable(parseInt(req.params.id, 10));
    res.json({ ok: true });
  } catch (err) { next(err); }
});

app.get('/api/admin/tables/:id/qr-code', async (req, res, next) => {
  try {
    const table = await repo.findTable(parseInt(req.params.id, 10));
    if (!table) return res.status(404).json({ error: 'Table not found' });
    const origin = req.query.origin || `${req.protocol}://${req.get('host')}`;
    const url = `${origin}/menu/table/${table.id}`;
    const dataUrl = await QRCode.toDataURL(url, { width: 400, margin: 2 });
    res.json({ table, url, qr_code: dataUrl });
  } catch (err) { next(err); }
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
