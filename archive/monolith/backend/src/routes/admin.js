const express = require('express');
const QRCode = require('qrcode');
const { authenticate, requireRole } = require('../middleware/auth');
const menuCtrl = require('../controllers/menuController');
const Table = require('../models/table');
const Order = require('../models/order');
const Bill = require('../models/bill');
const User = require('../models/user');
const bcrypt = require('bcryptjs');

const router = express.Router();

// Public-ish: admin actions need auth + admin role
router.use(authenticate);

// Dashboard
router.get('/dashboard', async (req, res, next) => {
  try {
    const [orders_today, revenue_today, active_tables, pending_orders] = await Promise.all([
      Order.countToday(),
      Order.revenueToday(),
      Order.activeTables(),
      Order.pendingCount(),
    ]);
    res.json({
      stats: { orders_today, revenue_today, active_tables, pending_orders },
    });
  } catch (e) {
    next(e);
  }
});

// Menu management (admin)
router.get('/menu/items', requireRole('admin'), menuCtrl.listItems);
router.post('/menu/items', requireRole('admin'), menuCtrl.createItem);
router.put('/menu/items/:id', requireRole('admin'), menuCtrl.updateItem);
router.delete('/menu/items/:id', requireRole('admin'), menuCtrl.deleteItem);

router.get('/menu/categories', requireRole('admin'), menuCtrl.listCategories);
router.post('/menu/categories', requireRole('admin'), menuCtrl.createCategory);
router.put('/menu/categories/:id', requireRole('admin'), menuCtrl.updateCategory);
router.delete('/menu/categories/:id', requireRole('admin'), menuCtrl.deleteCategory);

// Tables
router.get('/tables', requireRole('admin'), async (req, res, next) => {
  try {
    res.json({ tables: await Table.listAll() });
  } catch (e) {
    next(e);
  }
});

router.post('/tables', requireRole('admin'), async (req, res, next) => {
  try {
    const { table_number, capacity } = req.body;
    if (!table_number) return res.status(400).json({ error: 'table_number required' });
    const table = await Table.create({ table_number, capacity });
    res.status(201).json({ table });
  } catch (e) {
    next(e);
  }
});

router.put('/tables/:id', requireRole('admin'), async (req, res, next) => {
  try {
    await Table.update(parseInt(req.params.id, 10), req.body);
    res.json({ table: await Table.findById(parseInt(req.params.id, 10)) });
  } catch (e) {
    next(e);
  }
});

router.delete('/tables/:id', requireRole('admin'), async (req, res, next) => {
  try {
    await Table.remove(parseInt(req.params.id, 10));
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

router.get('/tables/:id/qr-code', requireRole('admin'), async (req, res, next) => {
  try {
    const table = await Table.findById(parseInt(req.params.id, 10));
    if (!table) return res.status(404).json({ error: 'Table not found' });
    const origin = req.query.origin || `${req.protocol}://${req.get('host')}`;
    const url = `${origin}/menu/table/${table.id}`;
    const dataUrl = await QRCode.toDataURL(url, { width: 400, margin: 2 });
    res.json({ table, url, qr_code: dataUrl });
  } catch (e) {
    next(e);
  }
});

// Sales
router.get('/sales/daily', requireRole('admin'), async (req, res, next) => {
  try {
    res.json({ sales: await Bill.dailySales() });
  } catch (e) {
    next(e);
  }
});

router.get('/sales/weekly', requireRole('admin'), async (req, res, next) => {
  try {
    res.json({ sales: await Bill.weeklySales() });
  } catch (e) {
    next(e);
  }
});

// Staff
router.get('/staff', requireRole('admin'), async (req, res, next) => {
  try {
    res.json({ users: await User.listAll() });
  } catch (e) {
    next(e);
  }
});

router.post('/staff', requireRole('admin'), async (req, res, next) => {
  try {
    const { email, password, name, role } = req.body;
    if (!email || !password || !name || !role) {
      return res.status(400).json({ error: 'email, password, name, role required' });
    }
    const password_hash = await bcrypt.hash(password, 10);
    const user = await User.create({ email, password_hash, name, role });
    res.status(201).json({ user });
  } catch (e) {
    next(e);
  }
});

router.put('/staff/:id', requireRole('admin'), async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (req.body.role) await User.updateRole(id, req.body.role);
    if (req.body.active !== undefined) await User.setActive(id, req.body.active);
    res.json({ user: await User.findById(id) });
  } catch (e) {
    next(e);
  }
});

router.delete('/staff/:id', requireRole('admin'), async (req, res, next) => {
  try {
    await User.remove(parseInt(req.params.id, 10));
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

module.exports = router;
