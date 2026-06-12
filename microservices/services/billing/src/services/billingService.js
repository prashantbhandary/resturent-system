// Service layer: billing rules. Bills are DRAFTED from order.created events
// (event-driven — take billing down and orders still flow; bills catch up).
// The receipt/bill-detail endpoints fetch the live order synchronously from
// order-service, mirroring the monolith's bill+order JOIN responses.
const repo = require('../repositories/billRepository');
const { resolve } = require('../../../../shared/discovery');
const logger = require('../../../../shared/logger');

let TAX_RATE = parseFloat(process.env.TAX_RATE) || 0.13;

let publisher = null;
function setPublisher(p) { publisher = p; }
const publish = async (type, data, traceId) => { if (publisher) await publisher.publish(type, data, traceId); };

// Admin can change tax_rate at runtime (config.updated comes from the gateway).
function onConfigUpdated(event) {
  const rate = parseFloat((event.data || {}).tax_rate);
  if (Number.isFinite(rate)) {
    TAX_RATE = rate;
    logger.info(`tax rate updated to ${rate}`);
  }
}

function computeAmounts(subtotal) {
  const tax = Math.round(subtotal * TAX_RATE * 100) / 100;
  const total = Math.round((subtotal + tax) * 100) / 100;
  return { subtotal, tax, total };
}

function billFromOrder(order, status) {
  return {
    order_id: order.id,
    table_id: order.table_id,
    table_number: order.table_number,
    items_count: order.items_count || (order.items || []).reduce((s, i) => s + i.quantity, 0),
    ...computeAmounts(order.total),
    status,
  };
}

// Reacts to order.created events: draft the bill ahead of time.
async function onOrderCreated(event) {
  const order = event.data;
  if (await repo.findByOrder(order.id)) return;
  await repo.create(billFromOrder(order, 'draft'));
  logger.info(`draft bill created for order ${order.id}`, { traceId: event.traceId });
}

// Reacts to order.status.updated events (order cancelled -> void the draft).
async function onOrderStatusUpdated(event) {
  const { order_id, new_status } = event.data;
  if (new_status === 'cancelled') await repo.setStatusByOrder(order_id, 'cancelled');
}

async function fetchOrder(orderId, traceId) {
  const base = await resolve('order-service');
  const res = await fetch(`${base}/api/orders/${orderId}`, { headers: { 'x-trace-id': traceId } });
  if (!res.ok) return null;
  return (await res.json()).order;
}

// Customer pressed "Request Bill": promote the draft to a pending bill the
// billing dashboard shows. If billing missed the order event, recover by
// fetching the order synchronously.
async function requestBill(orderId, traceId) {
  let bill = await repo.findByOrder(orderId);
  if (bill && bill.status !== 'draft') return { bill, alreadyRequested: true };

  if (!bill) {
    const order = await fetchOrder(orderId, traceId);
    if (!order) {
      const err = new Error('Order not found');
      err.status = 404;
      throw err;
    }
    bill = await repo.create(billFromOrder(order, 'pending'));
  } else {
    await repo.setStatus(bill.id, 'pending');
    bill = await repo.findById(bill.id);
  }

  await publish('bill.generated', bill, traceId);
  return { bill, alreadyRequested: false };
}

async function getBillById(billId) {
  const bill = await repo.findById(billId);
  if (!bill) {
    const err = new Error('Bill not found');
    err.status = 404;
    throw err;
  }
  return bill;
}

async function processPayment(billId, method, traceId) {
  if (!['cash', 'card'].includes(method)) {
    const err = new Error('Invalid payment method');
    err.status = 400;
    throw err;
  }
  let bill = await getBillById(billId);
  if (bill.status === 'paid') return bill;
  await repo.markPaid(billId, method);
  bill = await repo.findById(billId);

  // order-service hears this and flips the order to 'paid' on its own.
  await publish('bill.paid', bill, traceId);
  return bill;
}

async function receipt(billId, traceId) {
  const bill = await getBillById(billId);
  const order = await fetchOrder(bill.order_id, traceId);
  return {
    invoice_no: `INV-${String(bill.id).padStart(6, '0')}`,
    bill,
    order,
    items: order ? order.items : [],
    printed_at: new Date().toISOString(),
  };
}

module.exports = {
  setPublisher, onConfigUpdated, onOrderCreated, onOrderStatusUpdated,
  requestBill, getBillById, processPayment, receipt, fetchOrder,
  listPending: repo.listPending, list: repo.list,
  dailySales: repo.dailySales, weeklySales: repo.weeklySales, revenueToday: repo.revenueToday,
};
