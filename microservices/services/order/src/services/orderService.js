// Service layer: order business rules.
//
// Demonstrates BOTH inter-service communication styles of the lab:
//  1. SYNCHRONOUS  — calls menu-service over HTTP (via service discovery) to
//     validate the table and items and fetch authoritative prices. Never
//     trusts the client.
//  2. ASYNCHRONOUS — publishes "order.created" / "order.status.updated" /
//     "order.item.updated" events; billing-service and the gateway's
//     Socket.io bridge react without order-service knowing they exist.
const repo = require('../repositories/orderRepository');
const { resolve } = require('../../../../shared/discovery');
const logger = require('../../../../shared/logger');

const ORDER_STATUSES = ['pending', 'accepted', 'preparing', 'ready', 'served', 'paid', 'cancelled'];
const ITEM_STATUSES = ['pending', 'preparing', 'ready'];

let publisher = null;
function setPublisher(p) { publisher = p; }
const publish = async (type, data, traceId) => { if (publisher) await publisher.publish(type, data, traceId); };

async function fetchFromMenu(path, traceId) {
  const base = await resolve('menu-service');
  const res = await fetch(`${base}${path}`, { headers: { 'x-trace-id': traceId } });
  if (!res.ok) return null;
  return res.json();
}

async function createOrder({ table_id, items, notes }, traceId) {
  if (!Array.isArray(items) || items.length === 0) {
    const err = new Error('No items in order');
    err.status = 400;
    throw err;
  }

  // Sync call: the table must exist in menu-service's catalog.
  const tableRes = await fetchFromMenu(`/api/tables/${table_id}`, traceId);
  if (!tableRes) {
    const err = new Error('Table not found');
    err.status = 404;
    throw err;
  }
  const table = tableRes.table;

  // Sync calls to menu-service for real prices (distributed data ownership).
  const enriched = [];
  for (const it of items) {
    const itemId = it.item_id ?? it.menu_item_id;
    const found = await fetchFromMenu(`/api/menu/items/${itemId}`, traceId);
    if (!found) {
      const err = new Error(`Menu item ${itemId} not found`);
      err.status = 400;
      throw err;
    }
    const menuItem = found.item;
    if (!menuItem.available) {
      const err = new Error(`${menuItem.name} is not available`);
      err.status = 400;
      throw err;
    }
    const qty = parseInt(it.quantity, 10);
    if (!Number.isFinite(qty) || qty <= 0) {
      const err = new Error('Invalid quantity');
      err.status = 400;
      throw err;
    }
    enriched.push({ item_id: menuItem.id, name: menuItem.name, price: menuItem.price, quantity: qty });
  }

  const order = await repo.create({ table_id: table.id, table_number: table.table_number, items: enriched, notes });
  logger.info(`order ${order.id} created (total ${order.total})`, { traceId });

  // Async event: billing-service drafts a bill, the gateway pushes it to UIs.
  await publish('order.created', order, traceId);
  return order;
}

async function updateStatus(id, status, traceId) {
  if (!ORDER_STATUSES.includes(status)) {
    const err = new Error('Invalid status');
    err.status = 400;
    throw err;
  }
  const before = await repo.findById(id);
  if (!before) {
    const err = new Error('Order not found');
    err.status = 404;
    throw err;
  }
  await repo.updateStatus(id, status);
  const order = await repo.findById(id);
  await publish(
    'order.status.updated',
    { order_id: order.id, old_status: before.status, new_status: status, order },
    traceId
  );
  return order;
}

async function updateItemStatus(orderId, itemId, status, traceId) {
  if (!ITEM_STATUSES.includes(status)) {
    const err = new Error('Invalid status');
    err.status = 400;
    throw err;
  }
  const { changes } = await repo.updateItemStatus(orderId, itemId, status);
  if (!changes) {
    const err = new Error('Order item not found');
    err.status = 404;
    throw err;
  }

  // Same derived-status rules as the monolith kitchen controller.
  const items = await repo.findItems(orderId);
  if (items.every((i) => i.status === 'ready')) {
    await repo.updateStatus(orderId, 'ready');
  } else if (items.some((i) => i.status === 'preparing')) {
    await repo.updateStatus(orderId, 'preparing');
  }

  const order = await repo.findById(orderId);
  logger.info(`order ${orderId} item ${itemId} -> ${status}`, { traceId });
  await publish('order.item.updated', { order_id: order.id, item_id: Number(itemId), status, order }, traceId);
  return order;
}

// Event handler: billing-service announces a paid bill; the order follows.
async function onBillPaid(event) {
  const orderId = event.data.order_id;
  const order = await repo.findById(orderId);
  if (!order || order.status === 'paid') return;
  await repo.updateStatus(orderId, 'paid');
  const updated = await repo.findById(orderId);
  await publish(
    'order.status.updated',
    { order_id: orderId, old_status: order.status, new_status: 'paid', order: updated },
    event.traceId
  );
}

async function stats() {
  const [orders_today, active_tables, pending_orders] = await Promise.all([
    repo.countToday(), repo.activeTables(), repo.pendingCount(),
  ]);
  return { orders_today, active_tables, pending_orders };
}

module.exports = {
  setPublisher, createOrder, updateStatus, updateItemStatus, onBillPaid, stats,
  list: repo.list, findById: repo.findById,
  listByTable: repo.listByTable, listActive: repo.listActive,
};
