const express = require('express');
const config = require('../services/configService');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();

// Public branding/currency/tax config (consumed by customer menu + all clients).
router.get('/', async (req, res, next) => {
  try {
    res.json({ config: await config.publicConfig() });
  } catch (e) {
    next(e);
  }
});

// Admin-only: update tenant config (currency, tax, branding, restaurant name).
router.put('/', authenticate, requireRole('admin'), async (req, res, next) => {
  try {
    const allowed = [...config.PUBLIC_KEYS, 'restaurant_name'];
    const patch = {};
    for (const k of allowed) {
      if (req.body[k] !== undefined) patch[k] = req.body[k];
    }
    const updated = await config.update(patch);
    const publicCfg = await config.publicConfig();
    res.json({ ok: true, config: publicCfg, provisioned: updated.provisioned === '1' });
  } catch (e) {
    next(e);
  }
});

module.exports = router;
