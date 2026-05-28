const express = require('express');
const ctrl = require('../controllers/menuController');

const router = express.Router();

router.get('/', ctrl.getMenu);
router.get('/category/:id', ctrl.getCategoryItems);
router.get('/categories', ctrl.listCategories);

module.exports = router;
