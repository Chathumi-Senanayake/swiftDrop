const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
  eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true, index: true },
  name: { type: String, required: true, trim: true },
  price: { type: Number, required: true, min: 0 },
  image: { type: String, default: '' },
  description: { type: String, default: '' }, // shown in the item details popup, even before the event opens
  variants: { type: [String], default: [] }, // e.g. ['Black', 'White'] – the customer picks one when buying (shared stock)
  variantImages: { type: [String], default: [] }, // photo per variety, same order as variants ('' = use the main image)
  quantity: { type: Number, required: true }, // starting stock (never changes)
  stock: { type: Number, required: true, min: 0 }, // units still available right now
});

module.exports = mongoose.model('Item', itemSchema);
