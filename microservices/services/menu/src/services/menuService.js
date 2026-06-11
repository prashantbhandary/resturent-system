// Service layer: menu business rules (seeding, validation), no HTTP/SQL.
const repo = require('../repositories/menuRepository');

const DEFAULT_MENU = [
  { name: 'Chicken Wings', category: 'Starters', price: 380, description: 'Spicy buffalo wings', is_veg: 0 },
  { name: 'Paneer Tikka', category: 'Starters', price: 320, description: 'Grilled cottage cheese', is_veg: 1 },
  { name: 'Chicken Momo', category: 'Mains', price: 250, description: 'Steamed dumplings (10 pcs)', is_veg: 0 },
  { name: 'Veg Pizza', category: 'Pizza', price: 450, description: 'Capsicum, olives, corn', is_veg: 1 },
  { name: 'Coke', category: 'Drinks', price: 80, description: 'Chilled, 250ml', is_veg: 1 },
  { name: 'Ice Cream', category: 'Desserts', price: 150, description: 'Two scoops, vanilla', is_veg: 1 },
];

const CATEGORY_ICONS = {
  Starters: '🥗', Mains: '🍛', Pizza: '🍕', Drinks: '🥤', Desserts: '🍨',
};

async function seedIfEmpty() {
  if ((await repo.count()) > 0) return;
  for (const item of DEFAULT_MENU) await repo.create(item);
}

// Same response shape as the monolith's /api/menu, so the existing React
// frontend works against the gateway unchanged:
//   { categories: [{ id, name, icon, items: [...] }] }
async function listMenuGrouped() {
  const items = await repo.listAvailable();
  const byCategory = new Map();
  for (const it of items) {
    if (!byCategory.has(it.category)) byCategory.set(it.category, []);
    byCategory.get(it.category).push({ ...it, category_id: null, image: null });
  }
  let id = 0;
  const categories = [...byCategory.entries()].map(([name, catItems]) => ({
    id: ++id,
    name,
    icon: CATEGORY_ICONS[name] || '🍽️',
    position: id,
    items: catItems,
  }));
  return categories;
}

async function getItem(id) {
  const item = await repo.findById(id);
  if (!item) {
    const err = new Error('Menu item not found');
    err.status = 404;
    throw err;
  }
  return item;
}

async function addItem({ name, category, price, description, is_veg }) {
  if (!name || !category || !(price > 0)) {
    const err = new Error('name, category and positive price required');
    err.status = 400;
    throw err;
  }
  const { lastID } = await repo.create({ name, category, price, description, is_veg });
  return repo.findById(lastID);
}

module.exports = { seedIfEmpty, listMenuGrouped, getItem, addItem };
