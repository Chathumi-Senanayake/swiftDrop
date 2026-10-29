// Business logic for buying: reserve -> pay (see paymentService.js) / cancel.
//
// HOW WE STOP OVERSELLING (the core of this project):
// We never do "read stock, then write stock - 1" in two steps, because two servers could read
// the same number at the same time. Instead we send ONE atomic command to MongoDB:
//
//     "decrease stock by 1, but ONLY IF stock > 0"
//
// MongoDB runs that on a single document one request at a time, so even with 1,000 requests
// at once only the first N (N = stock) succeed. Everyone else gets "sold out". Zero oversell.

const Event = require('../models/Event');
const Item = require('../models/Item');
const Order = require('../models/Order');
const AppError = require('../utils/AppError');
const eventService = require('./eventService');
const paymentService = require('./paymentService');
const config = require('../config');

async function reserve(user, itemId, variant = '') {
  if (!itemId) throw new AppError(400, 'Please choose an item.', 'VALIDATION');
  // We deliver every order, so we need somewhere to send it
  if (!user.phone || !user.address) {
    throw new AppError(400, 'Please add your phone number and delivery address in your Profile before buying.', 'PROFILE_INCOMPLETE');
  }

  const item = await Item.findById(itemId).lean();
  if (!item) throw new AppError(404, 'This item does not exist.', 'NOT_FOUND');

  // 1. Is the event open?
  const event = await Event.findById(item.eventId).lean();
  const status = eventService.getStatus(event, [item]);
  if (status === 'locked') throw new AppError(409, "This sale hasn't started yet. Please wait for the countdown.", 'NOT_LIVE');
  if (status === 'closed') throw new AppError(409, 'This sale has ended.', 'EVENT_CLOSED');
  // Quick reject without touching the database again (step 3 is still the real guarantee)
  if (item.stock === 0) throw new AppError(409, 'Sorry, this item is sold out.', 'SOLD_OUT');

  // Items with varieties (colour, size, ...) need one chosen; items without ignore it
  const variants = item.variants || [];
  if (variants.length && !variants.includes(variant)) throw new AppError(400, 'Please choose a variety before buying.', 'VALIDATION');
  if (!variants.length) variant = '';

  // 2. Fast check: already bought this item? (the unique index in Order.js is the real guarantee)
  if (await Order.exists({ userId: user._id, itemId: item._id, active: true })) {
    throw new AppError(409, 'You have already purchased this item.', 'ALREADY_PURCHASED');
  }

  // 3. ATOMIC stock decrement — the line that prevents overselling
  const updated = await Item.findOneAndUpdate(
    { _id: item._id, stock: { $gt: 0 } },
    { $inc: { stock: -1 } },
    { new: true }
  );
  if (!updated) throw new AppError(409, 'Sorry, this item is sold out.', 'SOLD_OUT');

  // 4. Record the reservation. If it fails, give the unit back so stock is never lost.
  try {
    return await Order.create({
      userId: user._id,
      eventId: event._id,
      itemId: item._id,
      eventName: event.name,
      itemName: item.name,
      itemImage: (variant && item.variantImages?.[variants.indexOf(variant)]) || item.image, // photo of the chosen colour
      variant,
      price: item.price,
      quantity: 1,
      status: 'reserved',
      active: true,
      expiresAt: new Date(Date.now() + config.reservationMinutes * 60 * 1000),
    });
  } catch (err) {
    await Item.updateOne({ _id: item._id }, { $inc: { stock: 1 } });
    if (err.code === 11000) throw new AppError(409, 'You have already purchased this item.', 'ALREADY_PURCHASED');
    throw err;
  }
}

// Cancel: mark the order cancelled, then put the unit back into stock
async function cancel(user, orderId) {
  const order = await releaseReservation({ _id: orderId, userId: user._id });
  if (!order) throw new AppError(409, 'This reservation can no longer be cancelled.', 'RESERVATION_INVALID');
  return order;
}

// Shared by cancel() and the expiry job. The "status: reserved" filter makes sure a
// reservation is released only once, even if several servers try at the same time.
async function releaseReservation(filter) {
  const order = await Order.findOneAndUpdate(
    { ...filter, status: 'reserved' },
    { status: 'cancelled', active: false },
    { new: true }
  );
  if (order) await Item.updateOne({ _id: order.itemId }, { $inc: { stock: order.quantity } });
  return order;
}

// Runs every few seconds: reservations not paid in time go back into stock
async function releaseExpired() {
  const expired = await Order.find({ status: 'reserved', expiresAt: { $lte: new Date() } }, '_id').lean();
  for (const o of expired) await releaseReservation({ _id: o._id });
  return expired.length;
}

async function myOrders(user) {
  return Order.find({ userId: user._id }).sort({ createdAt: -1 }).lean();
}

// ---------- Admin: deliveries ----------
// Every paid order grouped by customer, so one parcel can be packed per person.
// status: 'pending' (not delivered yet) or 'delivered'
async function deliveries({ status = 'pending', search = '' }) {
  const delivered = status === 'delivered';
  const groups = await Order.aggregate([
    { $match: { status: 'confirmed', deliveredAt: delivered ? { $ne: null } : null } },
    { $sort: { createdAt: 1 } },
    {
      $group: {
        _id: '$userId',
        orders: { $push: '$$ROOT' },
        total: { $sum: { $multiply: ['$price', '$quantity'] } },
        units: { $sum: '$quantity' },
        firstOrderAt: { $min: '$createdAt' },
        deliveredAt: { $max: '$deliveredAt' },
      },
    },
    { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
    { $unwind: '$user' },
    { $project: { 'user.passwordHash': 0 } },
    // Pending: whoever has waited longest comes first. Delivered: most recent first.
    { $sort: delivered ? { deliveredAt: -1 } : { firstOrderAt: 1 } },
  ]);

  const q = String(search).trim().toLowerCase();
  if (!q) return groups;
  return groups.filter(({ user }) => [user.name, user.email, user.phone, user.address].some((f) => (f || '').toLowerCase().includes(q)));
}

// Mark all of a customer's paid, undelivered orders as delivered (one parcel)
async function markDelivered(userId) {
  const ids = await Order.distinct('_id', { userId, status: 'confirmed', deliveredAt: null });
  const { modifiedCount } = await Order.updateMany(
    { _id: { $in: ids }, status: 'confirmed', deliveredAt: null },
    { deliveredAt: new Date() }
  );
  if (!modifiedCount) throw new AppError(409, 'This customer has no orders waiting for delivery.', 'NOTHING_TO_DELIVER');
  await paymentService.markCashCollected(ids); // the courier collected the cash-on-delivery money
  return modifiedCount;
}

module.exports = { reserve, cancel, releaseExpired, myOrders, deliveries, markDelivered };
