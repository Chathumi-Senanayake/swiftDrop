const router = require('express').Router();
const authService = require('../services/authService');
const { requireAuth } = require('../middleware/auth');

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const user = await authService.register(req.body);
  res.status(201).json({ user });
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { token, user } = await authService.login(req.body);
  res.json({ token, user });
});

// POST /api/auth/logout
router.post('/logout', requireAuth, async (req, res) => {
  await authService.logout(req.sessionId);
  res.json({ message: 'Logged out.' });
});

module.exports = router;
