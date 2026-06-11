// Controller layer: translates HTTP <-> service layer. No business logic.
const authService = require('../services/authService');
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

module.exports = { login, verify };
