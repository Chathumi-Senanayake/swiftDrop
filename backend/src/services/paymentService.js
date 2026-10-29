// Business logic for paying: checkout (card via PayHere, or cash on delivery) and the gateway's notification.
//
// THE RULE THAT MAKES THIS A REAL PAYMENT FLOW:
// The browser can never mark an order as paid. A card order becomes "confirmed" ONLY when PayHere's servers
// call /api/payments/payhere/notify with a signature (md5sig) that we check using our merchant secret.
// Anyone can send a fake request to that URL, but without the secret they cannot produce a valid signature.

const crypto = require('crypto');
const Item = require('../models/Item');
const Order = require('../models/Order');
const Payment = require('../models/Payment');
const AppError = require('../utils/AppError');
const config = require('../config');

const md5 = (text) => crypto.createHash('md5').update(text).digest('hex').toUpperCase();
// PayHere wants amounts as plain "1234.50" (two decimals, no thousands separator)
const formatAmount = (n) => Number(n).toFixed(2);

function cardsEnabled() {
  const { merchantId, merchantSecret } = config.payments.payhere;
  return Boolean(merchantId && merchantSecret);
}

// What the checkout page may offer
function methods() {
  return { card: cardsEnabled(), cod: config.payments.codEnabled, sandbox: config.payments.payhere.sandbox };
}

// ---------- Checkout ----------
// orderIds: the customer's reserved orders to pay for together.  method: 'card' | 'cod'
// origin: the site address the browser is on (used for the "back to SwiftDrop" links of the gateway)
async function checkout(user, { orderIds, method }, origin) {
  if (method === 'card' && !cardsEnabled()) throw new AppError(400, 'Card payments are not available right now. Please choose cash on delivery.', 'METHOD_UNAVAILABLE');
  if (method === 'cod' && !config.payments.codEnabled) throw new AppError(400, 'Cash on delivery is not available right now.', 'METHOD_UNAVAILABLE');
  if (!['card', 'cod'].includes(method)) throw new AppError(400, 'Please choose a payment method.', 'VALIDATION');
  if (!user.phone || !user.address) {
    throw new AppError(400, 'Please add your phone number and delivery address before paying.', 'PROFILE_INCOMPLETE');
  }

  const ids = [...new Set((Array.isArray(orderIds) ? orderIds : []).map(String))];
  if (!ids.length) throw new AppError(400, 'Your cart is empty.', 'VALIDATION');
  if (ids.length > 20) throw new AppError(400, 'Please pay for at most 20 items at a time.', 'VALIDATION');

  const now = new Date();
  const orders = await Order.find({ _id: { $in: ids }, userId: user._id, status: 'reserved', expiresAt: { $gt: now } }).lean();
  if (orders.length !== ids.length) {
    throw new AppError(409, 'Some items in your cart are no longer reserved (the timer ran out). Please review your cart.', 'RESERVATION_INVALID');
  }

  const payment = await Payment.create({
    userId: user._id,
    orderIds: orders.map((o) => o._id),
    amount: orders.reduce((sum, o) => sum + o.price * o.quantity, 0),
    method,
    status: method === 'cod' ? 'pay_on_delivery' : 'pending',
    deliverTo: { name: user.name, phone: user.phone, address: user.address },
  });

  if (method === 'cod') return { payment: await confirmCashOnDelivery(payment, user) };

  // Card: hold the items a little longer while the customer types their card details on PayHere.
  // Only once per order (paymentId still empty), so starting checkout again and again cannot hold stock forever.
  const holdUntil = new Date(Date.now() + config.payments.checkoutMinutes * 60 * 1000);
  await Order.updateMany(
    { _id: { $in: payment.orderIds }, status: 'reserved', paymentId: null, expiresAt: { $lt: holdUntil } },
    { expiresAt: holdUntil }
  );
  await Order.updateMany({ _id: { $in: payment.orderIds }, status: 'reserved' }, { paymentId: payment._id });

  return { payment, gateway: payHereForm(payment, orders, user, origin) };
}

// Cash on delivery: the order is accepted now and paid to the courier.
// Each order is confirmed atomically, so a reservation that expires at this exact moment is simply left out.
async function confirmCashOnDelivery(payment, user) {
  const confirmed = [];
  for (const id of payment.orderIds) {
    const order = await Order.findOneAndUpdate(
      { _id: id, userId: user._id, status: 'reserved', expiresAt: { $gt: new Date() } },
      { status: 'confirmed', paymentMethod: 'cod', paymentId: payment._id },
      { new: true }
    );
    if (order) confirmed.push(order);
  }
  if (!confirmed.length) {
    await Payment.updateOne({ _id: payment._id }, { status: 'cancelled', statusMessage: 'Reservations expired' });
    throw new AppError(409, 'Your reservations expired before the order was placed. Please try again.', 'RESERVATION_INVALID');
  }
  payment.orderIds = confirmed.map((o) => o._id);
  payment.amount = confirmed.reduce((sum, o) => sum + o.price * o.quantity, 0);
  await payment.save();
  return payment;
}

// The fields the browser posts to PayHere's checkout page (https://support.payhere.lk/api-&-mobile-sdk/checkout-api)
function payHereForm(payment, orders, user, origin) {
  const { merchantId, merchantSecret, sandbox, notifyUrl } = config.payments.payhere;
  const base = config.publicUrl || origin || '';
  const orderId = payment._id.toString();
  const amount = formatAmount(payment.amount);
  const [firstName, ...rest] = user.name.trim().split(/\s+/);
  const city = user.address.split(',').pop().trim() || 'Colombo';

  return {
    action: sandbox ? 'https://sandbox.payhere.lk/pay/checkout' : 'https://www.payhere.lk/pay/checkout',
    fields: {
      merchant_id: merchantId,
      return_url: `${base}/payment/${orderId}`,
      cancel_url: `${base}/payment/${orderId}?cancelled=1`,
      notify_url: notifyUrl || `${base}/api/payments/payhere/notify`,
      order_id: orderId,
      items: orders.length === 1 ? orders[0].itemName : `${orders.length} SwiftDrop items`,
      currency: payment.currency,
      amount,
      first_name: firstName,
      last_name: rest.join(' ') || firstName,
      email: user.email,
      phone: user.phone,
      address: user.address,
      city,
      country: 'Sri Lanka',
      // Proves to PayHere that these amounts came from us and were not edited in the browser
      hash: md5(merchantId + orderId + amount + payment.currency + md5(merchantSecret)),
    },
  };
}

// ---------- PayHere notification (server to server) ----------
// status_code:  2 = success, 0 = pending, -1 = cancelled, -2 = failed, -3 = chargedback
async function handlePayHereNotify(body) {
  const { merchantId, merchantSecret } = config.payments.payhere;
  if (!cardsEnabled()) throw new AppError(400, 'Card payments are not configured.', 'METHOD_UNAVAILABLE');

  const { merchant_id, order_id, payhere_amount, payhere_currency, status_code, md5sig } = body;
  const expected = md5(merchant_id + order_id + payhere_amount + payhere_currency + status_code + md5(merchantSecret));
  if (merchant_id !== merchantId || !md5sig || md5sig.toUpperCase() !== expected) {
    throw new AppError(400, 'Invalid payment signature.', 'BAD_SIGNATURE');
  }

  const payment = await Payment.findById(order_id);
  if (!payment || payment.method !== 'card') throw new AppError(404, 'Unknown payment.', 'NOT_FOUND');
  // The signed amount must match what we asked for
  if (payhere_currency !== payment.currency || payhere_amount !== formatAmount(payment.amount)) {
    throw new AppError(400, 'Payment amount does not match.', 'AMOUNT_MISMATCH');
  }

  const details = {
    gatewayRef: body.payment_id || '',
    gatewayMethod: body.method || '',
    cardNo: body.card_no || '',
    statusMessage: body.status_message || '',
  };
  const code = Number(status_code);

  if (code === 2) return markPaid(payment._id, details);
  if (code === -3) {
    const changed = await Payment.findOneAndUpdate({ _id: payment._id, status: { $ne: 'chargedback' } }, { status: 'chargedback', ...details });
    if (changed) await cancelChargedBackOrders(payment);
  } else if (code === -1 || code === -2) {
    // Only a still-pending payment can fail; a late "failed" message never undoes a successful one.
    // The orders stay reserved until their timer runs out, so the customer can try again from the cart.
    await Payment.updateOne({ _id: payment._id, status: 'pending' }, { status: code === -1 ? 'cancelled' : 'failed', ...details });
  }
  return Payment.findById(payment._id);
}

// Money received: confirm every order of this payment. Safe to call twice (PayHere may retry).
async function markPaid(paymentId, details) {
  const payment = await Payment.findOneAndUpdate(
    { _id: paymentId, status: { $in: ['pending', 'failed', 'cancelled'] } },
    { status: 'paid', paidAt: new Date(), ...details },
    { new: true }
  );
  if (!payment) return Payment.findById(paymentId); // already handled

  const refunds = [];
  for (const orderId of payment.orderIds) {
    if (!(await fillPaidOrder(orderId, payment))) refunds.push(orderId);
  }
  if (refunds.length) {
    payment.refundOrderIds = refunds;
    await payment.save();
    console.warn(`[payments] Payment ${payment._id} needs a refund for ${refunds.length} order(s).`);
  }
  return payment;
}

// Returns true when the paid order is (now) confirmed, false when it cannot be filled and must be refunded.
async function fillPaidOrder(orderId, payment) {
  const paid = { status: 'confirmed', active: true, paymentMethod: 'card', paymentId: payment._id, paidAt: new Date() };

  // Normal case: still reserved (even if the timer just ran out, the customer paid in time at the bank)
  if (await Order.findOneAndUpdate({ _id: orderId, status: 'reserved' }, paid)) return true;

  const order = await Order.findById(orderId).lean();
  if (!order || order.status === 'confirmed') return false; // e.g. already paid by another checkout -> refund this one

  // The reservation expired and its unit went back to stock. Take a unit again if any is left.
  const took = await Item.findOneAndUpdate({ _id: order.itemId, stock: { $gte: order.quantity } }, { $inc: { stock: -order.quantity } });
  if (!took) return false; // sold out meanwhile
  try {
    if (await Order.findOneAndUpdate({ _id: orderId, status: 'cancelled' }, paid)) return true;
  } catch (err) {
    if (err.code !== 11000) throw err; // 11000: the customer already has another active order for this item
  }
  await Item.updateOne({ _id: order.itemId }, { $inc: { stock: order.quantity } });
  return false;
}

// The customer took the money back through their bank: stop the parcel and put the units back into stock.
// Orders already delivered cannot be stopped, so they are only logged.
async function cancelChargedBackOrders(payment) {
  const mine = { _id: { $in: payment.orderIds }, paymentId: payment._id, paymentMethod: 'card', status: 'confirmed' };
  const toCancel = await Order.find({ ...mine, deliveredAt: null }).lean();
  for (const o of toCancel) {
    const cancelled = await Order.findOneAndUpdate({ _id: o._id, status: 'confirmed', deliveredAt: null }, { status: 'cancelled', active: false });
    if (cancelled) await Item.updateOne({ _id: o.itemId }, { $inc: { stock: o.quantity } });
  }
  const delivered = await Order.countDocuments({ ...mine, deliveredAt: { $ne: null } });
  console.warn(`[payments] Chargeback on payment ${payment._id}: ${toCancel.length} order(s) cancelled, ${delivered} already delivered.`);
}

// ---------- Reading ----------
async function getPayment(user, id) {
  const payment = await Payment.findOne({ _id: id, userId: user._id }).lean();
  if (!payment) throw new AppError(404, 'Payment not found.', 'NOT_FOUND');
  const orders = await Order.find({ _id: { $in: payment.orderIds } }).lean();
  return { ...payment, orders };
}

// Admin: payments where money was received for orders that could not be filled
async function refundsNeeded() {
  return Payment.find({ 'refundOrderIds.0': { $exists: true }, refundedAt: null })
    .sort({ updatedAt: -1 })
    .limit(50)
    .populate('userId', 'name email phone')
    .populate('refundOrderIds', 'itemName variant price quantity')
    .lean();
}

// Admin: the money for the unfilled orders has been sent back (done by hand in the PayHere portal)
async function markRefunded(paymentId) {
  const payment = await Payment.findOneAndUpdate(
    { _id: paymentId, 'refundOrderIds.0': { $exists: true }, refundedAt: null },
    { refundedAt: new Date() },
    { new: true }
  );
  if (!payment) throw new AppError(409, 'This payment has no refund waiting.', 'NOTHING_TO_REFUND');
  return payment;
}

// Admin delivered a parcel: cash-on-delivery orders are now paid too
async function markCashCollected(orderIds) {
  const now = new Date();
  await Order.updateMany({ _id: { $in: orderIds }, paymentMethod: 'cod', paidAt: null }, { paidAt: now });
  const paymentIds = await Order.distinct('paymentId', { _id: { $in: orderIds }, paymentMethod: 'cod' });
  for (const id of paymentIds) {
    // A COD payment is fully paid once none of its orders are still waiting for the courier
    if (!(await Order.exists({ paymentId: id, paymentMethod: 'cod', paidAt: null }))) {
      await Payment.updateOne({ _id: id, status: 'pay_on_delivery' }, { status: 'paid', paidAt: now });
    }
  }
}

module.exports = { methods, checkout, handlePayHereNotify, getPayment, refundsNeeded, markRefunded, markCashCollected, md5, formatAmount };
