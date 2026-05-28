const bcrypt = require('bcryptjs');
const { initSchema, run, get } = require('../config/database');
const { Category, Item } = require('../models/menu');
const Table = require('../models/table');

async function seed() {
  await initSchema();
  console.log('Schema ready. Seeding...');

  const adminEmail = 'admin@restaurant.local';
  const existing = await get('SELECT id FROM users WHERE email = ?', [adminEmail]);
  if (!existing) {
    const hash = await bcrypt.hash('admin123', 10);
    await run(
      'INSERT INTO users (email, password_hash, name, role) VALUES (?, ?, ?, ?)',
      [adminEmail, hash, 'Admin', 'admin']
    );
    console.log(`Created admin: ${adminEmail} / admin123`);
  }

  const staffSeed = [
    { email: 'chef@restaurant.local', password: 'chef123', name: 'Chef', role: 'chef' },
    { email: 'billing@restaurant.local', password: 'billing123', name: 'Billing', role: 'billing' },
    { email: 'waiter@restaurant.local', password: 'waiter123', name: 'Waiter', role: 'waiter' },
  ];
  for (const s of staffSeed) {
    const ex = await get('SELECT id FROM users WHERE email = ?', [s.email]);
    if (!ex) {
      const hash = await bcrypt.hash(s.password, 10);
      await run(
        'INSERT INTO users (email, password_hash, name, role) VALUES (?, ?, ?, ?)',
        [s.email, hash, s.name, s.role]
      );
      console.log(`Created ${s.role}: ${s.email} / ${s.password}`);
    }
  }

  for (let i = 1; i <= 6; i++) {
    const exists = await Table.findByNumber(i);
    if (!exists) await Table.create({ table_number: i, capacity: 4 });
  }
  console.log('Seeded 6 tables');

  const categoriesData = [
    { name: 'Starters', icon: '🥗', position: 1 },
    { name: 'Mains', icon: '🍛', position: 2 },
    { name: 'Pizza', icon: '🍕', position: 3 },
    { name: 'Drinks', icon: '🥤', position: 4 },
    { name: 'Desserts', icon: '🍰', position: 5 },
  ];

  const categories = {};
  for (const c of categoriesData) {
    const all = await Category.listAll();
    let found = all.find((x) => x.name === c.name);
    if (!found) found = await Category.create(c);
    categories[c.name] = found.id;
  }

  const items = [
    { cat: 'Starters', name: 'Veg Spring Rolls', desc: 'Crispy rolls with vegetables', price: 220 },
    { cat: 'Starters', name: 'Chicken Wings', desc: 'Spicy buffalo wings', price: 380 },
    { cat: 'Starters', name: 'Paneer Tikka', desc: 'Grilled cottage cheese', price: 320 },
    { cat: 'Mains', name: 'Butter Chicken', desc: 'Classic creamy chicken curry', price: 480 },
    { cat: 'Mains', name: 'Dal Makhani', desc: 'Slow-cooked black lentils', price: 320 },
    { cat: 'Mains', name: 'Chicken Biryani', desc: 'Aromatic rice with chicken', price: 420 },
    { cat: 'Pizza', name: 'Margherita', desc: 'Tomato, mozzarella, basil', price: 380 },
    { cat: 'Pizza', name: 'Pepperoni', desc: 'Tomato, mozzarella, pepperoni', price: 480 },
    { cat: 'Drinks', name: 'Coca Cola', desc: '330ml', price: 80 },
    { cat: 'Drinks', name: 'Fresh Lime Soda', desc: 'Sweet or salty', price: 120 },
    { cat: 'Drinks', name: 'Masala Chai', desc: 'Hot Indian tea', price: 60 },
    { cat: 'Desserts', name: 'Gulab Jamun', desc: '2 pcs in syrup', price: 140 },
    { cat: 'Desserts', name: 'Chocolate Brownie', desc: 'Warm, with ice cream', price: 220 },
  ];

  const allItems = await Item.listAll();
  for (const it of items) {
    if (allItems.find((x) => x.name === it.name)) continue;
    await Item.create({
      category_id: categories[it.cat],
      name: it.name,
      description: it.desc,
      price: it.price,
      available: 1,
    });
  }

  console.log('Seed complete.');
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
