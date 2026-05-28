const express = require('express');
const ctrl = require('../controllers/billingController');

const router = express.Router();

router.post('/request-bill/:order_id', ctrl.requestBill);
router.get('/pending', ctrl.pending);
router.get('/:bill_id', ctrl.getBill);
router.post('/:bill_id/payment', ctrl.pay);
router.get('/:bill_id/receipt', ctrl.receipt);

module.exports = router;
