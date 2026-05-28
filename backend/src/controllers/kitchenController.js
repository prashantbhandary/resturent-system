const Order = require('../models/order');
const orderService = require('../services/orderService');

async function getActiveOrders(req, res, next) {
  try {
    const orders = await Order.listActiveWithItems();
    res.json({ orders });
  } catch (e) {
    next(e);
  }
}

async function updateOrderStatus(req, res, next) {
  try {
    const order_id = parseInt(req.params.order_id, 10);
    const { status } = req.body;
    const before = await Order.findById(order_id);
    if (!before) return res.status(404).json({ error: 'Order not found' });
    const order = await orderService.setOrderStatus(order_id, status);
    const io = req.app.get('io');
    io.emit('order:status-changed', {
      order_id,
      old_status: before.status,
      new_status: status,
      order,
    });
    res.json({ order });
  } catch (e) {
    next(e);
  }
}

async function updateItemStatus(req, res, next) {
  try {
    const order_id = parseInt(req.params.order_id, 10);
    const item_id = parseInt(req.params.item_id, 10);
    const { status } = req.body;
    await orderService.setItemStatus(item_id, status);

    const items = await Order.findItems(order_id);
    const allReady = items.every((i) => i.status === 'ready');
    if (allReady) {
      await orderService.setOrderStatus(order_id, 'ready');
    } else if (items.some((i) => i.status === 'preparing')) {
      await orderService.setOrderStatus(order_id, 'preparing');
    }

    const order = await Order.findWithItems(order_id);
    const io = req.app.get('io');
    io.emit('order:item-status', { order_id, item_id, status, order });
    res.json({ order });
  } catch (e) {
    next(e);
  }
}

module.exports = { getActiveOrders, updateOrderStatus, updateItemStatus };
