const mongoose = require('mongoose');

// Email addresses that asked for sale alerts (the "Get sale alerts" box on the home page)
const subscriberSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Subscriber', subscriberSchema);
