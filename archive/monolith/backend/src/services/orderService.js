const Order = require('../models/order');
const Table = require('../models/table');
const { Item } = require('../models/menu');

async function createOrder({ table_id, items, notes }) {
  if (!Array.isArray(items) || items.length === 0) {
    const err = new Error('No items in order');
    err.status = 400;
    throw err;
  }
  const table = await Table.findById(table_id);
  if (!table) {
    const err = new Error('Table not found');
    err.status = 404;
    throw err;
  }

  const enriched = [];
  for (const it of items) {
    const menuItem = await Item.findById(it.item_id);
    if (!menuItem) {
      const err = new Error(`Menu item ${it.item_id} not found`);
      err.status = 400;
      throw err;
    }
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
    enriched.push({
      item_id: menuItem.id,
      name: menuItem.name,
      price: menuItem.price,
      quantity: qty,
    });
  }

  const orderId = await Order.createWithItems({ table_id, items: enriched, notes });
  return Order.findWithItems(orderId);
}

async function setOrderStatus(order_id, status) {
  const valid = ['pending', 'accepted', 'preparing', 'ready', 'served', 'paid', 'cancelled'];
  if (!valid.includes(status)) {
    const err = new Error('Invalid status');
    err.status = 400;
    throw err;
  }
  await Order.updateStatus(order_id, status);
  return Order.findWithItems(order_id);
}

async function setItemStatus(item_id, status) {
  const valid = ['pending', 'preparing', 'ready'];
  if (!valid.includes(status)) {
    const err = new Error('Invalid status');
    err.status = 400;
    throw err;
  }
  await Order.updateItemStatus(item_id, status);
}

module.exports = { createOrder, setOrderStatus, setItemStatus };
