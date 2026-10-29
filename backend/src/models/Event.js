const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    coverImage: { type: String, required: true },
    goLiveAt: { type: Date, required: true },
    endsAt: { type: Date, default: null }, // optional: the sale closes by itself at this time
    // Set when an admin forces the event open or closed. null = follow the schedule.
    manualStatus: { type: String, enum: [null, 'live', 'closed'], default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Event', eventSchema);
