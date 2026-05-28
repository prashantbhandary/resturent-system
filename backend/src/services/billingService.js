const Bill = require('../models/bill');
const Order = require('../models/order');
const { TAX_RATE } = require('../config/env');

async function generateBill(order_id) {
  const order = await Order.findWithItems(order_id);
  if (!order) {
    const err = new Error('Order not found');
    err.status = 404;
    throw err;
  }
  const existing = await Bill.findByOrder(order_id);
  if (existing) return Bill.findById(existing.id);

  const subtotal = order.items.reduce((s, i) => s + i.price_at_time * i.quantity, 0);
  const tax = Math.round(subtotal * TAX_RATE * 100) / 100;
  const total = Math.round((subtotal + tax) * 100) / 100;
  return Bill.create({ order_id, subtotal, tax, total });
}

async function processPayment(bill_id, method) {
  const valid = ['cash', 'card'];
  if (!valid.includes(method)) {
    const err = new Error('Invalid payment method');
    err.status = 400;
    throw err;
  }
  const bill = await Bill.findById(bill_id);
  if (!bill) {
    const err = new Error('Bill not found');
    err.status = 404;
    throw err;
  }
  if (bill.status === 'paid') return bill;
  await Bill.markPaid(bill_id, method);
  await Order.updateStatus(bill.order_id, 'paid');
  return Bill.findById(bill_id);
}

module.exports = { generateBill, processPayment };
