const { run, get, all } = require('../config/database');

const Category = {
  async create({ name, icon = null, position = 0 }) {
    const res = await run(
      `INSERT INTO menu_categories (name, icon, position) VALUES (?, ?, ?)`,
      [name, icon, position]
    );
    return Category.findById(res.lastID);
  },
  findById(id) {
    return get(`SELECT * FROM menu_categories WHERE id = ?`, [id]);
  },
  listAll() {
    return all(`SELECT * FROM menu_categories ORDER BY position ASC, name ASC`);
  },
  update(id, { name, icon, position }) {
    return run(
      `UPDATE menu_categories SET name = COALESCE(?, name),
                                  icon = COALESCE(?, icon),
                                  position = COALESCE(?, position)
       WHERE id = ?`,
      [name, icon, position, id]
    );
  },
  remove(id) {
    return run(`DELETE FROM menu_categories WHERE id = ?`, [id]);
  },
};

const Item = {
  async create({ category_id, name, description = '', price, image = null, available = 1 }) {
    const res = await run(
      `INSERT INTO menu_items (category_id, name, description, price, image, available)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [category_id, name, description, price, image, available ? 1 : 0]
    );
    return Item.findById(res.lastID);
  },
  findById(id) {
    return get(`SELECT * FROM menu_items WHERE id = ?`, [id]);
  },
  listByCategory(category_id) {
    return all(
      `SELECT * FROM menu_items WHERE category_id = ? ORDER BY name ASC`,
      [category_id]
    );
  },
  listAll() {
    return all(`SELECT * FROM menu_items ORDER BY name ASC`);
  },
  update(id, fields) {
    return run(
      `UPDATE menu_items SET
         category_id = COALESCE(?, category_id),
         name = COALESCE(?, name),
         description = COALESCE(?, description),
         price = COALESCE(?, price),
         image = COALESCE(?, image),
         available = COALESCE(?, available)
       WHERE id = ?`,
      [
        fields.category_id ?? null,
        fields.name ?? null,
        fields.description ?? null,
        fields.price ?? null,
        fields.image ?? null,
        fields.available === undefined ? null : (fields.available ? 1 : 0),
        id,
      ]
    );
  },
  remove(id) {
    return run(`DELETE FROM menu_items WHERE id = ?`, [id]);
  },
};

module.exports = { Category, Item };
