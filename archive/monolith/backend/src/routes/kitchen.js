const express = require('express');
const ctrl = require('../controllers/kitchenController');

const router = express.Router();

router.get('/orders', ctrl.getActiveOrders);
router.patch('/orders/:order_id/status', ctrl.updateOrderStatus);
router.patch('/orders/:order_id/items/:item_id/status', ctrl.updateItemStatus);

module.exports = router;
