const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
    itemId: { type: mongoose.Schema.Types.ObjectId, ref: 'Item', required: true },
    // Copies of names/price so order history stays correct even if the event changes later
    eventName: String,
    itemName: String,
    itemImage: String,
    variant: { type: String, default: '' }, // the variety the customer chose, e.g. 'Black'
    price: Number,
    quantity: { type: Number, default: 1 },
    // reserved -> confirmed (paid)   or   reserved -> cancelled (stock given back)
    status: { type: String, enum: ['reserved', 'confirmed', 'cancelled'], default: 'reserved' },
    active: { type: Boolean, default: true }, // true while reserved or confirmed
    expiresAt: Date, // reservation must be paid before this time
    paymentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment', default: null }, // latest checkout for this order
    paymentMethod: { type: String, enum: ['', 'card', 'cod'], default: '' }, // set when confirmed
    paidAt: { type: Date, default: null }, // card: when the gateway confirmed. cod: when delivered
    deliveredAt: { type: Date, default: null }, // set by an admin when the parcel has been delivered
  },
  { timestamps: true }
);

// The database itself blocks a second active order for the same user + item.
// This stops duplicate purchases even if two requests arrive at the same millisecond.
orderSchema.index(
  { userId: 1, itemId: 1 },
  { unique: true, partialFilterExpression: { active: true } }
);
orderSchema.index({ status: 1, expiresAt: 1 });
orderSchema.index({ status: 1, deliveredAt: 1, userId: 1 }); // admin delivery list

module.exports = mongoose.model('Order', orderSchema);
