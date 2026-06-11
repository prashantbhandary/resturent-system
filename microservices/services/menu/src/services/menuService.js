// Service layer: menu business rules (seeding, validation), no HTTP/SQL.
const repo = require('../repositories/menuRepository');

const DEFAULT_MENU = [
  { name: 'Chicken Wings', category: 'Starters', price: 380 },
  { name: 'Paneer Tikka', category: 'Starters', price: 320 },
  { name: 'Chicken Momo', category: 'Mains', price: 250 },
  { name: 'Veg Pizza', category: 'Pizza', price: 450 },
  { name: 'Coke', category: 'Drinks', price: 80 },
  { name: 'Ice Cream', category: 'Desserts', price: 150 },
];

async function seedIfEmpty() {
  if ((await repo.count()) > 0) return;
  for (const item of DEFAULT_MENU) await repo.create(item);
}

const listMenu = () => repo.listAvailable();

async function getItem(id) {
  const item = await repo.findById(id);
  if (!item) {
    const err = new Error('Menu item not found');
    err.status = 404;
    throw err;
  }
  return item;
}

async function addItem({ name, category, price }) {
  if (!name || !category || !(price > 0)) {
    const err = new Error('name, category and positive price required');
    err.status = 400;
    throw err;
  }
  const { lastID } = await repo.create({ name, category, price });
  return repo.findById(lastID);
}

module.exports = { seedIfEmpty, listMenu, getItem, addItem };
