const express = require('express');
const provisioningService = require('../services/provisioningService');
const { sign } = require('../utils/jwt');

const router = express.Router();

// Public: lets the frontend decide whether to show the setup wizard.
router.get('/status', async (req, res, next) => {
  try {
    res.json(await provisioningService.status());
  } catch (e) {
    next(e);
  }
});

// Public, but single-use: only works while the appliance is unprovisioned.
router.post('/setup', async (req, res, next) => {
  try {
    const { user } = await provisioningService.setup(req.body);
    const token = sign({ id: user.id, role: user.role });
    res.status(201).json({ ok: true, user, token });
  } catch (e) {
    next(e);
  }
});

module.exports = router;
