// Products across all sales (public): home page deals, Deals page, search, product page.
const router = require('express').Router();
const eventService = require('../services/eventService');

// GET /api/items?status=live|locked|all&search=headphones&limit=60
router.get('/', async (req, res) => {
  res.json({ items: await eventService.listItems(req.query) });
});

// GET /api/items/recent-sales   -> latest purchases for the "just bought" pop-up (item + town only)
router.get('/recent-sales', async (req, res) => {
  res.json({ sales: await eventService.recentSales() });
});

// GET /api/items/:id   -> { item, event }
router.get('/:id', async (req, res) => {
  res.json(await eventService.getItem(req.params.id));
});

module.exports = router;
