const mongoose = require('mongoose');

// One row per logged-in browser. Logging out deletes the row, so the token stops working immediately.
const sessionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  expiresAt: { type: Date, required: true },
});

// MongoDB deletes expired sessions automatically
sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('Session', sessionSchema);
