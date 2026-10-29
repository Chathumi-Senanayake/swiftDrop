// Browsing events. Public: anyone can look at the sales; buying needs an account.
const router = require('express').Router();
const eventService = require('../services/eventService');

// GET /api/events
router.get('/', async (req, res) => {
  res.json({ events: await eventService.listEvents() });
});

// GET /api/events/:id
router.get('/:id', async (req, res) => {
  res.json({ event: await eventService.getEvent(req.params.id) });
});

// GET /api/events/:id/stock   (polled by the event page for real-time stock)
router.get('/:id/stock', async (req, res) => {
  res.json(await eventService.getStock(req.params.id));
});

module.exports = router;
