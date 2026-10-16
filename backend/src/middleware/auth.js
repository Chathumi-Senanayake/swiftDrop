// Checks the "Authorization: Bearer <token>" header on protected routes.
const authService = require('../services/authService');
const AppError = require('../utils/AppError');

async function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) throw new AppError(401, 'Please log in to continue.', 'UNAUTHENTICATED');

  const { user, sessionId } = await authService.verifyToken(token);
  req.user = user;
  req.sessionId = sessionId;
  next();
}

function requireAdmin(req, res, next) {
  if (req.user.role !== 'admin') throw new AppError(403, 'Only admins can do this.', 'FORBIDDEN');
  next();
}

// Admins manage the platform; only customers can buy.
function requireCustomer(req, res, next) {
  if (req.user.role !== 'customer') throw new AppError(403, 'Admin accounts cannot make purchases.', 'FORBIDDEN');
  next();
}

module.exports = { requireAuth, requireAdmin, requireCustomer };
