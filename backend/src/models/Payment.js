const mongoose = require('mongoose');

// One checkout: the customer pays for one or more reserved orders at once.
//   card: pending -> paid | failed | cancelled   (decided ONLY by the gateway's signed notification)
//   cod:  pay_on_delivery -> paid                (paid when the admin marks the parcel delivered)
const paymentSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    orderIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Order' }],
    amount: { type: Number, required: true },
    currency: { type: String, default: 'LKR' },
    method: { type: String, enum: ['card', 'cod'], required: true },
    status: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'cancelled', 'chargedback', 'pay_on_delivery'],
      default: 'pending',
    },
    statusMessage: { type: String, default: '' },
    // Filled from the gateway's notification
    gatewayRef: { type: String, default: '' }, // PayHere payment_id
    gatewayMethod: { type: String, default: '' }, // VISA, MASTER, AMEX, ...
    cardNo: { type: String, default: '' }, // masked, e.g. ************4242
    paidAt: { type: Date, default: null },
    // Orders that were paid for but could not be filled (e.g. the reservation expired and the item sold out).
    // Their money must be refunded by an admin.
    refundOrderIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Order' }],
    refundedAt: { type: Date, default: null }, // set when an admin has refunded those orders in the PayHere portal
    // Where the parcel goes (copied at checkout)
    deliverTo: { name: String, phone: String, address: String },
  },
  { timestamps: true }
);

paymentSchema.index({ refundOrderIds: 1 });

module.exports = mongoose.model('Payment', paymentSchema);
