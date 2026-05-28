const express = require('express');
const ctrl = require('../controllers/orderController');

const router = express.Router();

router.post('/', ctrl.createOrder);
router.get('/table/:table_id', ctrl.getOrderForTable);
router.get('/:id', ctrl.getOrder);

module.exports = router;
