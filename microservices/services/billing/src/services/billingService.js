// Service layer: billing rules. This service has NO HTTP dependency on
// order-service — it learns about orders purely from events (event-driven).
const repo = require('../repositories/billRepository');
const logger = require('../../../../shared/logger');

const TAX_RATE = parseFloat(process.env.TAX_RATE) || 0.13;

// Reacts to order.created events.
async function onOrderCreated(event) {
  const order = event.data;
  const subtotal = order.total;
  const tax = +(subtotal * TAX_RATE).toFixed(2);
  await repo.create({ order_id: order.id, subtotal, tax, total: +(subtotal + tax).toFixed(2) });
  logger.info(`draft bill created for order ${order.id}`, { traceId: event.traceId });
}

// Reacts to order.status.updated events (marks the bill paid).
async function onOrderStatusUpdated(event) {
  if (event.data.status === 'paid') {
    await repo.setStatus(event.data.id, 'paid');
    logger.info(`bill for order ${event.data.id} marked paid`, { traceId: event.traceId });
  }
}

async function getBill(orderId) {
  const bill = await repo.findByOrderId(orderId);
  if (!bill) {
    const err = new Error('No bill for that order');
    err.status = 404;
    throw err;
  }
  return bill;
}

module.exports = { onOrderCreated, onOrderStatusUpdated, getBill, list: repo.list };
