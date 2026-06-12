const Order = require('../models/order');
const orderService = require('../services/orderService');

function getIO(req) {
  return req.app.get('io');
}

async function createOrder(req, res, next) {
  try {
    const { table_id, items, notes } = req.body;
    const order = await orderService.createOrder({ table_id, items, notes });
    const io = getIO(req);
    io.emit('order:created', order);
    io.emit('kitchen:new-order', { order_id: order.id, urgency: 'normal' });
    res.status(201).json({ order });
  } catch (e) {
    next(e);
  }
}

async function getOrderForTable(req, res, next) {
  try {
    const orders = await Order.listByTable(
      parseInt(req.params.table_id, 10),
      ['pending', 'accepted', 'preparing', 'ready', 'served']
    );
    const withItems = [];
    for (const o of orders) {
      withItems.push(await Order.findWithItems(o.id));
    }
    res.json({ orders: withItems });
  } catch (e) {
    next(e);
  }
}

async function getOrder(req, res, next) {
  try {
    const order = await Order.findWithItems(parseInt(req.params.id, 10));
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json({ order });
  } catch (e) {
    next(e);
  }
}

module.exports = { createOrder, getOrderForTable, getOrder };
