// Service layer: order business rules.
//
// Demonstrates BOTH inter-service communication styles of the lab:
//  1. SYNCHRONOUS  — calls menu-service over HTTP (via service discovery) to
//     validate items and fetch authoritative prices. Never trusts the client.
//  2. ASYNCHRONOUS — publishes "order.created" / "order.status.updated"
//     events; billing-service reacts without order-service knowing it exists.
const repo = require('../repositories/orderRepository');
const { resolve } = require('../../../../shared/discovery');
const logger = require('../../../../shared/logger');

const VALID_STATUSES = ['pending', 'preparing', 'ready', 'served', 'paid'];
let publisher = null;
function setPublisher(p) { publisher = p; }

async function fetchMenuItem(id, traceId) {
  const base = await resolve('menu-service');
  const res = await fetch(`${base}/api/menu/items/${id}`, { headers: { 'x-trace-id': traceId } });
  if (!res.ok) return null;
  return (await res.json()).item;
}

async function createOrder({ table_number, items }, traceId) {
  if (!(table_number > 0) || !Array.isArray(items) || items.length === 0) {
    const err = new Error('table_number and items[] required');
    err.status = 400;
    throw err;
  }

  // Sync call to menu-service for real prices (distributed data ownership).
  const enriched = [];
  let total = 0;
  for (const it of items) {
    const menuItem = await fetchMenuItem(it.menu_item_id, traceId);
    if (!menuItem) {
      const err = new Error(`menu item ${it.menu_item_id} not found`);
      err.status = 400;
      throw err;
    }
    const quantity = it.quantity > 0 ? it.quantity : 1;
    total += menuItem.price * quantity;
    enriched.push({ menu_item_id: menuItem.id, name: menuItem.name, price: menuItem.price, quantity });
  }

  const order = await repo.create({ table_number, total, items: enriched });
  logger.info(`order ${order.id} created (total ${total})`, { traceId });

  // Async event: billing-service will create a draft bill from this.
  if (publisher) await publisher.publish('order.created', order, traceId);
  return order;
}

async function updateStatus(id, status, traceId) {
  if (!VALID_STATUSES.includes(status)) {
    const err = new Error(`status must be one of ${VALID_STATUSES.join(', ')}`);
    err.status = 400;
    throw err;
  }
  const order = await repo.findById(id);
  if (!order) {
    const err = new Error('Order not found');
    err.status = 404;
    throw err;
  }
  await repo.updateStatus(id, status);
  const updated = await repo.findById(id);
  if (publisher) await publisher.publish('order.status.updated', updated, traceId);
  return updated;
}

module.exports = { setPublisher, createOrder, updateStatus, list: repo.list, findById: repo.findById };
