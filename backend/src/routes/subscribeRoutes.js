// Sale alerts sign-up (public)
const router = require('express').Router();
const Subscriber = require('../models/Subscriber');
const AppError = require('../utils/AppError');

// POST /api/subscribe  { email }
router.post('/', async (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  if (!/^\S+@\S+\.\S+$/.test(email) || email.length > 200) throw new AppError(400, 'Please enter a valid email address.', 'VALIDATION');
  await Subscriber.updateOne({ email }, { $setOnInsert: { email } }, { upsert: true });
  res.json({ ok: true });
});

module.exports = router;
