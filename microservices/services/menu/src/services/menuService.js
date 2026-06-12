// Service layer: menu business rules (seeding, validation), no HTTP/SQL.
const repo = require('../repositories/menuRepository');

// Same demo data as the monolith seeder, so the app looks identical.
const SEED_CATEGORIES = [
  { name: 'Starters', icon: '🥗', position: 1 },
  { name: 'Mains', icon: '🍛', position: 2 },
  { name: 'Pizza', icon: '🍕', position: 3 },
  { name: 'Drinks', icon: '🥤', position: 4 },
  { name: 'Desserts', icon: '🍰', position: 5 },
];

const SEED_ITEMS = [
  { cat: 'Starters', name: 'Veg Spring Rolls', desc: 'Crispy rolls with vegetables', price: 220, is_veg: 1 },
  { cat: 'Starters', name: 'Chicken Wings', desc: 'Spicy buffalo wings', price: 380, is_veg: 0 },
  { cat: 'Starters', name: 'Paneer Tikka', desc: 'Grilled cottage cheese', price: 320, is_veg: 1 },
  { cat: 'Mains', name: 'Butter Chicken', desc: 'Classic creamy chicken curry', price: 480, is_veg: 0 },
  { cat: 'Mains', name: 'Dal Makhani', desc: 'Slow-cooked black lentils', price: 320, is_veg: 1 },
  { cat: 'Mains', name: 'Chicken Biryani', desc: 'Aromatic rice with chicken', price: 420, is_veg: 0 },
  { cat: 'Pizza', name: 'Margherita', desc: 'Tomato, mozzarella, basil', price: 380, is_veg: 1 },
  { cat: 'Pizza', name: 'Pepperoni', desc: 'Tomato, mozzarella, pepperoni', price: 480, is_veg: 0 },
  { cat: 'Drinks', name: 'Coca Cola', desc: '330ml', price: 80, is_veg: 1 },
  { cat: 'Drinks', name: 'Fresh Lime Soda', desc: 'Sweet or salty', price: 120, is_veg: 1 },
  { cat: 'Drinks', name: 'Masala Chai', desc: 'Hot Indian tea', price: 60, is_veg: 1 },
  { cat: 'Desserts', name: 'Gulab Jamun', desc: '2 pcs in syrup', price: 140, is_veg: 1 },
  { cat: 'Desserts', name: 'Chocolate Brownie', desc: 'Warm, with ice cream', price: 220, is_veg: 1 },
];

async function seedIfEmpty() {
  if ((await repo.countItems()) > 0) return;
  const catIds = {};
  for (const c of SEED_CATEGORIES) {
    const existing = (await repo.listCategories()).find((x) => x.name === c.name);
    catIds[c.name] = existing ? existing.id : (await repo.createCategory(c)).id;
  }
  for (const it of SEED_ITEMS) {
    await repo.createItem({
      category_id: catIds[it.cat], name: it.name, description: it.desc, price: it.price, is_veg: it.is_veg,
    });
  }
  for (let i = 1; i <= 6; i++) {
    if (!(await repo.findTableByNumber(i))) await repo.createTable({ table_number: i, capacity: 4 });
  }
}

// Same response shape as the monolith's /api/menu, so the existing React
// frontend works against the gateway unchanged:
//   { categories: [{ id, name, icon, position, items: [...] }] }
async function listMenuGrouped() {
  const categories = await repo.listCategories();
  const items = await repo.listAvailableItems();
  return categories.map((c) => ({ ...c, items: items.filter((i) => i.category_id === c.id) }));
}

async function getItem(id) {
  const item = await repo.findItem(id);
  if (!item) {
    const err = new Error('Menu item not found');
    err.status = 404;
    throw err;
  }
  return item;
}

async function addItem({ category_id, name, description, price, image, available, is_veg }) {
  if (!category_id || !name || price === undefined) {
    const err = new Error('category_id, name, price required');
    err.status = 400;
    throw err;
  }
  return repo.createItem({
    category_id, name, description, price: parseFloat(price), image,
    available: available !== false, is_veg,
  });
}

module.exports = { seedIfEmpty, listMenuGrouped, getItem, addItem };
