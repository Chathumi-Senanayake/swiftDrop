// Buying. Nginx applies a stricter rate limit to everything under /api/purchase.
// Paying for a reservation happens in paymentRoutes.js.
const router = require('express').Router();
const purchaseService = require('../services/purchaseService');
const { requireAuth, requireCustomer } = require('../middleware/auth');

router.use(requireAuth, requireCustomer);

// POST /api/purchase/reserve  { itemId, variant }   -> holds 1 unit for a few minutes (it is now in the cart)
router.post('/reserve', async (req, res) => {
  const order = await purchaseService.reserve(req.user, req.body.itemId, req.body.variant);
  res.status(201).json({ order });
});

// POST /api/purchase/:orderId/cancel    -> unit goes back into stock
router.post('/:orderId/cancel', async (req, res) => {
  const order = await purchaseService.cancel(req.user, req.params.orderId);
  res.json({ order });
});

module.exports = router;
