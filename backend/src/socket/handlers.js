const orderService = require('../services/orderService');
const billingService = require('../services/billingService');
const Order = require('../models/order');
const logger = require('../utils/logger');

function attachHandlers(io) {
  io.on('connection', (socket) => {
    logger.info(`Socket connected: ${socket.id}`);

    socket.on('join:room', (room) => {
      socket.join(room);
    });

    socket.on('order:submit', async (data, ack) => {
      try {
        const order = await orderService.createOrder(data);
        io.emit('order:created', order);
        io.emit('kitchen:new-order', { order_id: order.id, urgency: 'normal' });
        if (typeof ack === 'function') ack({ ok: true, order });
      } catch (err) {
        logger.error('order:submit', err.message);
        if (typeof ack === 'function') ack({ ok: false, error: err.message });
      }
    });

    socket.on('kitchen:accept', async ({ order_id }, ack) => {
      try {
        const order = await orderService.setOrderStatus(order_id, 'accepted');
        io.emit('order:status-changed', {
          order_id,
          new_status: 'accepted',
          order,
        });
        if (typeof ack === 'function') ack({ ok: true, order });
      } catch (err) {
        if (typeof ack === 'function') ack({ ok: false, error: err.message });
      }
    });

    socket.on('kitchen:item-preparing', async ({ order_id, item_id }, ack) => {
      try {
        await orderService.setItemStatus(item_id, 'preparing');
        await orderService.setOrderStatus(order_id, 'preparing');
        const order = await Order.findWithItems(order_id);
        io.emit('order:item-status', { order_id, item_id, status: 'preparing', order });
        if (typeof ack === 'function') ack({ ok: true, order });
      } catch (err) {
        if (typeof ack === 'function') ack({ ok: false, error: err.message });
      }
    });

    socket.on('kitchen:item-ready', async ({ order_id, item_id }, ack) => {
      try {
        await orderService.setItemStatus(item_id, 'ready');
        const items = await Order.findItems(order_id);
        const allReady = items.every((i) => i.status === 'ready');
        if (allReady) await orderService.setOrderStatus(order_id, 'ready');
        const order = await Order.findWithItems(order_id);
        io.emit('order:item-status', { order_id, item_id, status: 'ready', order });
        if (typeof ack === 'function') ack({ ok: true, order });
      } catch (err) {
        if (typeof ack === 'function') ack({ ok: false, error: err.message });
      }
    });

    socket.on('billing:request', async ({ order_id }, ack) => {
      try {
        const bill = await billingService.generateBill(order_id);
        io.emit('bill:generated', bill);
        if (typeof ack === 'function') ack({ ok: true, bill });
      } catch (err) {
        if (typeof ack === 'function') ack({ ok: false, error: err.message });
      }
    });

    socket.on('customer:disconnect', () => {
      logger.info(`Customer disconnected: ${socket.id}`);
    });

    socket.on('disconnect', () => {
      logger.info(`Socket disconnected: ${socket.id}`);
    });
  });
}

module.exports = { attachHandlers };
