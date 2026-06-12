const Bill = require('../models/bill');
const Order = require('../models/order');
const billingService = require('../services/billingService');

async function requestBill(req, res, next) {
  try {
    const order_id = parseInt(req.params.order_id, 10);
    const bill = await billingService.generateBill(order_id);
    const io = req.app.get('io');
    io.emit('bill:generated', bill);
    res.status(201).json({ bill });
  } catch (e) {
    next(e);
  }
}

async function pending(req, res, next) {
  try {
    const bills = await Bill.listPending();
    res.json({ bills });
  } catch (e) {
    next(e);
  }
}

async function getBill(req, res, next) {
  try {
    const bill = await Bill.findById(parseInt(req.params.bill_id, 10));
    if (!bill) return res.status(404).json({ error: 'Bill not found' });
    const order = await Order.findWithItems(bill.order_id);
    res.json({ bill, order });
  } catch (e) {
    next(e);
  }
}

async function pay(req, res, next) {
  try {
    const bill_id = parseInt(req.params.bill_id, 10);
    const { method } = req.body;
    const bill = await billingService.processPayment(bill_id, method);
    const io = req.app.get('io');
    io.emit('bill:paid', bill);
    io.emit('order:status-changed', {
      order_id: bill.order_id,
      new_status: 'paid',
    });
    res.json({ bill });
  } catch (e) {
    next(e);
  }
}

async function receipt(req, res, next) {
  try {
    const bill = await Bill.findById(parseInt(req.params.bill_id, 10));
    if (!bill) return res.status(404).json({ error: 'Bill not found' });
    const order = await Order.findWithItems(bill.order_id);
    res.json({
      receipt: {
        invoice_no: `INV-${String(bill.id).padStart(6, '0')}`,
        bill,
        order,
        items: order.items,
        printed_at: new Date().toISOString(),
      },
    });
  } catch (e) {
    next(e);
  }
}

module.exports = { requestBill, pending, getBill, pay, receipt };
