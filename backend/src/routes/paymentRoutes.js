// Paying for reserved items.
const express = require('express');
const paymentService = require('../services/paymentService');
const { requireAuth, requireCustomer } = require('../middleware/auth');

const router = express.Router();

// GET /api/payments/methods   -> { card: true, cod: true, sandbox: true }
router.get('/methods', (req, res) => {
  res.json(paymentService.methods());
});

// POST /api/payments/payhere/notify   Called by PayHere's servers (not the browser), as a normal form post.
// No login: the md5sig signature proves the message came from PayHere.
router.post('/payhere/notify', express.urlencoded({ extended: false, limit: '20kb' }), async (req, res) => {
  await paymentService.handlePayHereNotify(req.body || {});
  res.send('OK');
});

// POST /api/payments/checkout  { orderIds: [...], method: 'card' | 'cod' }
//   card -> { payment, gateway: { action, fields } }  the browser posts the fields to the gateway
//   cod  -> { payment }                                the orders are confirmed right away
router.post('/checkout', requireAuth, requireCustomer, async (req, res) => {
  res.status(201).json(await paymentService.checkout(req.user, req.body || {}, req.get('origin')));
});

// GET /api/payments/:id   -> the payment and its orders (polled by the "payment result" page)
router.get('/:id', requireAuth, async (req, res) => {
  res.json({ payment: await paymentService.getPayment(req.user, req.params.id) });
});

module.exports = router;
