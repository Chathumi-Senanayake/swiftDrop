// Business logic for events: status rules, create / read / update / delete, force open / close.
const Event = require('../models/Event');
const Item = require('../models/Item');
const Order = require('../models/Order');
const AppError = require('../utils/AppError');

// ---------- Status rules ----------
// locked  = waiting for go-live time (can view, cannot buy)
// live    = open for buying
// soldout = every item has 0 stock left
// closed  = an admin closed it
function getStatus(event, items) {
  if (event.manualStatus === 'closed') return 'closed';
  const opened = event.manualStatus === 'live' || new Date() >= new Date(event.goLiveAt);
  if (!opened) return 'locked';
  if (items.length > 0 && items.every((i) => i.stock === 0)) return 'soldout';
  return 'live';
}

function withStatus(event, items) {
  return { ...event, items, itemCount: items.length, status: getStatus(event, items) };
}

// ---------- Read ----------
async function listEvents() {
  const events = await Event.find().sort({ goLiveAt: 1 }).lean();
  const items = await Item.find({ eventId: { $in: events.map((e) => e._id) } }).lean();
  return events.map((e) => withStatus(e, items.filter((i) => i.eventId.equals(e._id))));
}

async function getEvent(id) {
  const event = await Event.findById(id).lean();
  if (!event) throw new AppError(404, 'This event does not exist.', 'NOT_FOUND');
  const items = await Item.find({ eventId: event._id }).lean();
  return withStatus(event, items);
}

// Small, fast response the event page polls every few seconds for live stock numbers
async function getStock(id) {
  const event = await getEvent(id);
  return {
    status: event.status,
    items: event.items.map((i) => ({ _id: i._id, stock: i.stock, quantity: i.quantity })),
  };
}

// ---------- Create / Update input checking ----------
// Turns the submitted form (text fields + uploaded files) into clean, validated data.
function parseEventForm(body, files = [], existing = null) {
  const fileUrl = (field) => {
    const f = files.find((file) => file.fieldname === field);
    return f ? '/uploads/' + f.filename : null;
  };

  const name = (body.name || '').trim();
  if (!name) throw new AppError(400, 'Event name is required.', 'VALIDATION');

  const goLiveAt = new Date(body.goLiveAt);
  if (isNaN(goLiveAt)) throw new AppError(400, 'Please choose a valid go-live date and time.', 'VALIDATION');
  if (goLiveAt <= new Date()) throw new AppError(400, 'The go-live time must be in the future.', 'VALIDATION');

  const coverImage = fileUrl('cover') || body.coverImage || (existing && existing.coverImage);
  if (!coverImage) throw new AppError(400, 'Please add an event cover photo.', 'VALIDATION');

  let items;
  try {
    items = JSON.parse(body.items || '[]');
  } catch {
    throw new AppError(400, 'Item list is not valid.', 'VALIDATION');
  }
  if (!Array.isArray(items) || items.length === 0) throw new AppError(400, 'Add at least one item.', 'VALIDATION');

  items = items.map((it, index) => {
    const label = `Item ${index + 1}`;
    const itemName = (it.name || '').trim();
    const price = Number(it.price);
    const quantity = Number(it.quantity);
    if (!itemName) throw new AppError(400, `${label}: name is required.`, 'VALIDATION');
    if (!(price > 0)) throw new AppError(400, `${label}: price must be more than 0.`, 'VALIDATION');
    if (!Number.isInteger(quantity) || quantity < 100 || quantity > 500) {
      throw new AppError(400, `${label}: quantity must be a whole number between 100 and 500.`, 'VALIDATION');
    }
    const description = String(it.description || '').trim();
    if (description.length > 1000) throw new AppError(400, `${label}: description must be 1000 characters or less.`, 'VALIDATION');
    // Varieties: trimmed, no blanks, no duplicates. Each may have its own photo:
    // a new upload (variantImage_<item>_<variety>) or the URL it already had.
    const rawVariants = Array.isArray(it.variants) ? it.variants : [];
    const rawImages = Array.isArray(it.variantImages) ? it.variantImages : [];
    const variants = [];
    const variantImages = [];
    rawVariants.forEach((v, j) => {
      v = String(v).trim();
      if (!v || variants.includes(v)) return;
      variants.push(v);
      variantImages.push(fileUrl(`variantImage_${index}_${j}`) || String(rawImages[j] || ''));
    });
    if (variants.length > 10) throw new AppError(400, `${label}: an item can have at most 10 varieties.`, 'VALIDATION');
    const image = fileUrl(`itemImage_${index}`) || it.image || '';
    return { name: itemName, price, quantity, stock: quantity, description, variants, variantImages, image };
  });

  return { name, description: (body.description || '').trim(), goLiveAt, coverImage, items };
}

// ---------- Create ----------
async function createEvent(body, files) {
  const data = parseEventForm(body, files);
  const event = await Event.create({
    name: data.name,
    description: data.description,
    coverImage: data.coverImage,
    goLiveAt: data.goLiveAt,
  });
  await Item.insertMany(data.items.map((i) => ({ ...i, eventId: event._id })));
  return getEvent(event._id); // new events always start as "locked"
}

// ---------- Update ----------
async function updateEvent(id, body, files) {
  const current = await getEvent(id);
  if (current.status !== 'locked') throw new AppError(409, 'Only locked events can be edited.', 'NOT_EDITABLE');

  const data = parseEventForm(body, files, current);
  await Event.updateOne(
    { _id: id },
    { name: data.name, description: data.description, coverImage: data.coverImage, goLiveAt: data.goLiveAt }
  );
  // A locked event has no orders yet, so it is safe to replace its items
  await Item.deleteMany({ eventId: id });
  await Item.insertMany(data.items.map((i) => ({ ...i, eventId: id })));
  return getEvent(id);
}

// ---------- Delete ----------
async function deleteEvent(id) {
  const current = await getEvent(id);
  if (current.status !== 'locked') throw new AppError(409, 'Only locked events can be deleted.', 'NOT_DELETABLE');
  await Item.deleteMany({ eventId: id });
  await Event.deleteOne({ _id: id });
}

// ---------- Force open / close ----------
async function openEvent(id) {
  const current = await getEvent(id);
  if (current.status !== 'locked') throw new AppError(409, 'Only a locked event can be opened.', 'BAD_STATE');
  await Event.updateOne({ _id: id }, { manualStatus: 'live' });
  return getEvent(id);
}

async function closeEvent(id) {
  const current = await getEvent(id);
  if (current.status === 'closed') throw new AppError(409, 'This event is already closed.', 'BAD_STATE');
  if (current.status === 'locked') throw new AppError(409, 'This event has not started yet.', 'BAD_STATE');
  await Event.updateOne({ _id: id }, { manualStatus: 'closed' });
  return getEvent(id);
}

// ---------- Admin dashboard numbers ----------
async function getDashboard() {
  const events = await listEvents();

  // Units sold + revenue per item (only paid / confirmed orders count)
  const sales = await Order.aggregate([
    { $match: { status: 'confirmed' } },
    { $group: { _id: '$itemId', sold: { $sum: '$quantity' }, revenue: { $sum: { $multiply: ['$price', '$quantity'] } } } },
  ]);
  const salesByItem = new Map(sales.map((s) => [s._id.toString(), s]));

  for (const event of events) {
    event.revenue = 0;
    event.sold = 0;
    for (const item of event.items) {
      const s = salesByItem.get(item._id.toString()) || { sold: 0, revenue: 0 };
      item.sold = s.sold;
      item.revenue = s.revenue;
      event.sold += s.sold;
      event.revenue += s.revenue;
    }
  }

  const recentOrders = await Order.find({ status: { $ne: 'cancelled' } })
    .sort({ createdAt: -1 })
    .limit(10)
    .populate('userId', 'name email')
    .lean();

  return {
    totals: {
      events: events.length,
      revenue: events.reduce((sum, e) => sum + e.revenue, 0),
      orders: sales.reduce((sum, s) => sum + s.sold, 0),
      live: events.filter((e) => e.status === 'live').length,
    },
    events,
    recentOrders,
  };
}

module.exports = {
  getStatus,
  listEvents,
  getEvent,
  getStock,
  createEvent,
  updateEvent,
  deleteEvent,
  openEvent,
  closeEvent,
  getDashboard,
};
