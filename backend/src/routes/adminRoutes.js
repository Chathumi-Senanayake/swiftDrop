// Admin only: event CRUD, force open/close, dashboard, users.
const router = require('express').Router();
const eventService = require('../services/eventService');
const userService = require('../services/userService');
const purchaseService = require('../services/purchaseService');
const upload = require('../middleware/upload');
const { requireAuth, requireAdmin } = require('../middleware/auth');

router.use(requireAuth, requireAdmin);

// GET /api/admin/dashboard
router.get('/dashboard', async (req, res) => {
  res.json(await eventService.getDashboard());
});

// ----- Events (CRUD) -----
// The form sends: name, description, goLiveAt, items (JSON text), cover (file), itemImage_0, itemImage_1 ... (files)

// CREATE  POST /api/admin/events
router.post('/events', upload.any(), async (req, res) => {
  const event = await eventService.createEvent(req.body, req.files);
  res.status(201).json({ event });
});

// UPDATE  PUT /api/admin/events/:id
router.put('/events/:id', upload.any(), async (req, res) => {
  const event = await eventService.updateEvent(req.params.id, req.body, req.files);
  res.json({ event });
});

// DELETE  DELETE /api/admin/events/:id
router.delete('/events/:id', async (req, res) => {
  await eventService.deleteEvent(req.params.id);
  res.json({ message: 'Event deleted.' });
});

// POST /api/admin/events/:id/open   and   /close
router.post('/events/:id/open', async (req, res) => {
  res.json({ event: await eventService.openEvent(req.params.id) });
});

router.post('/events/:id/close', async (req, res) => {
  res.json({ event: await eventService.closeEvent(req.params.id) });
});

// ----- Deliveries (paid orders grouped by customer) -----
// GET /api/admin/deliveries?status=pending|delivered&search=nimal
router.get('/deliveries', async (req, res) => {
  res.json({ customers: await purchaseService.deliveries(req.query) });
});

// POST /api/admin/deliveries/:userId/delivered   -> all that customer's waiting orders are delivered
router.post('/deliveries/:userId/delivered', async (req, res) => {
  const count = await purchaseService.markDelivered(req.params.userId);
  res.json({ message: `${count} order(s) marked as delivered.` });
});

// ----- Users -----
// GET /api/admin/users?page=1&search=sarah
router.get('/users', async (req, res) => {
  res.json(await userService.listUsers(req.query));
});

// PATCH /api/admin/users/:id   { active: false }
router.patch('/users/:id', async (req, res) => {
  const user = await userService.setActive(req.params.id, req.body.active);
  res.json({ user });
});

module.exports = router;
