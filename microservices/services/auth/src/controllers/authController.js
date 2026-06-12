// Controller layer: translates HTTP <-> service layer. No business logic.
const bcrypt = require('bcryptjs');
const authService = require('../services/authService');
const users = require('../repositories/userRepository');
const logger = require('../../../../shared/logger');

async function login(req, res, next) {
  try {
    const result = await authService.login(req.body || {});
    logger.info(`login ok: ${result.user.email}`, { traceId: req.traceId });
    res.json(result);
  } catch (err) {
    logger.warn(`login failed`, { traceId: req.traceId });
    next(err);
  }
}

async function register(req, res, next) {
  try {
    res.status(201).json(await authService.register(req.body || {}));
  } catch (err) {
    next(err);
  }
}

async function verify(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    const user = await authService.verify(token);
    res.json({ user });
  } catch (err) {
    next(err);
  }
}

// --- staff management (admin UI) — same shapes as the monolith ---
async function listStaff(req, res, next) {
  try { res.json({ users: await users.listAll() }); }
  catch (err) { next(err); }
}

async function createStaff(req, res, next) {
  try {
    const { email, password, name, role } = req.body || {};
    if (!email || !password || !name || !role) {
      return res.status(400).json({ error: 'email, password, name, role required' });
    }
    const password_hash = await bcrypt.hash(password, 10);
    res.status(201).json({ user: await users.create({ email, password_hash, name, role }) });
  } catch (err) { next(err); }
}

async function updateStaff(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    const { role, active } = req.body || {};
    if (role) await users.updateRole(id, role);
    if (active !== undefined) await users.setActive(id, active);
    res.json({ user: await users.findById(id) });
  } catch (err) { next(err); }
}

async function removeStaff(req, res, next) {
  try {
    await users.remove(parseInt(req.params.id, 10));
    res.json({ ok: true });
  } catch (err) { next(err); }
}

module.exports = { login, register, verify, listStaff, createStaff, updateStaff, removeStaff };
