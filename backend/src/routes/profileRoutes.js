// The logged-in user's own data: profile, password, order history.
const router = require('express').Router();
const authService = require('../services/authService');
const purchaseService = require('../services/purchaseService');
const { requireAuth } = require('../middleware/auth');

router.use(requireAuth);

// GET /api/me
router.get('/', (req, res) => {
  res.json({ user: req.user });
});

// PUT /api/me  { name, phone, address }
router.put('/', async (req, res) => {
  const user = await authService.updateProfile(req.user, req.body);
  res.json({ user });
});

// PUT /api/me/password  { currentPassword, newPassword }
router.put('/password', async (req, res) => {
  await authService.changePassword(req.user, req.body);
  res.json({ message: 'Password changed.' });
});

// GET /api/me/orders
router.get('/orders', async (req, res) => {
  res.json({ orders: await purchaseService.myOrders(req.user) });
});

module.exports = router;
