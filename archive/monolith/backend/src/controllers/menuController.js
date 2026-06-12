const { Category, Item } = require('../models/menu');

async function getMenu(req, res, next) {
  try {
    const categories = await Category.listAll();
    const items = await Item.listAll();
    const grouped = categories.map((c) => ({
      ...c,
      items: items.filter((i) => i.category_id === c.id && i.available),
    }));
    res.json({ categories: grouped });
  } catch (e) {
    next(e);
  }
}

async function getCategoryItems(req, res, next) {
  try {
    const items = await Item.listByCategory(parseInt(req.params.id, 10));
    res.json({ items });
  } catch (e) {
    next(e);
  }
}

async function listCategories(req, res, next) {
  try {
    const categories = await Category.listAll();
    res.json({ categories });
  } catch (e) {
    next(e);
  }
}

async function createCategory(req, res, next) {
  try {
    const { name, icon, position } = req.body;
    if (!name) return res.status(400).json({ error: 'Name required' });
    const category = await Category.create({ name, icon, position });
    res.status(201).json({ category });
  } catch (e) {
    next(e);
  }
}

async function updateCategory(req, res, next) {
  try {
    await Category.update(parseInt(req.params.id, 10), req.body);
    const category = await Category.findById(parseInt(req.params.id, 10));
    res.json({ category });
  } catch (e) {
    next(e);
  }
}

async function deleteCategory(req, res, next) {
  try {
    await Category.remove(parseInt(req.params.id, 10));
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
}

async function listItems(req, res, next) {
  try {
    const items = await Item.listAll();
    res.json({ items });
  } catch (e) {
    next(e);
  }
}

async function createItem(req, res, next) {
  try {
    const { category_id, name, description, price, image, available } = req.body;
    if (!category_id || !name || price === undefined) {
      return res.status(400).json({ error: 'category_id, name, price required' });
    }
    const item = await Item.create({
      category_id,
      name,
      description,
      price: parseFloat(price),
      image,
      available: available !== false,
    });
    res.status(201).json({ item });
  } catch (e) {
    next(e);
  }
}

async function updateItem(req, res, next) {
  try {
    await Item.update(parseInt(req.params.id, 10), req.body);
    const item = await Item.findById(parseInt(req.params.id, 10));
    res.json({ item });
  } catch (e) {
    next(e);
  }
}

async function deleteItem(req, res, next) {
  try {
    await Item.remove(parseInt(req.params.id, 10));
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
}

module.exports = {
  getMenu,
  getCategoryItems,
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  listItems,
  createItem,
  updateItem,
  deleteItem,
};
