// Business logic for admins managing customer accounts.
const User = require('../models/User');
const Session = require('../models/Session');
const AppError = require('../utils/AppError');

async function listUsers({ page = 1, limit = 10, search = '' }) {
  page = Math.max(1, Number(page) || 1);
  limit = Math.min(50, Math.max(1, Number(limit) || 10));

  const filter = {};
  if (search) {
    const safe = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // escape regex characters
    filter.$or = [{ name: new RegExp(safe, 'i') }, { email: new RegExp(safe, 'i') }];
  }

  const [users, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
    User.countDocuments(filter),
  ]);
  return { users, total, page, pages: Math.max(1, Math.ceil(total / limit)) };
}

async function setActive(userId, active) {
  const user = await User.findById(userId);
  if (!user) throw new AppError(404, 'User not found.', 'NOT_FOUND');
  if (user.role === 'admin') throw new AppError(400, 'Admin accounts cannot be deactivated here.', 'BAD_REQUEST');

  user.active = Boolean(active);
  await user.save();
  // Deactivated users are logged out everywhere right away
  if (!user.active) await Session.deleteMany({ userId: user._id });
  return user;
}

module.exports = { listUsers, setActive };
