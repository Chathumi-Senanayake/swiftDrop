// Fills the database with demo data (prices in Sri Lankan Rupees): 1 admin, 3 customers, 9 events with items
// and a few paid orders (so the admin Deliveries page has something to show).
// WARNING: deletes all existing data first.   Run with:  npm run seed
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const config = require('../src/config');
const User = require('../src/models/User');
const Session = require('../src/models/Session');
const Event = require('../src/models/Event');
const Item = require('../src/models/Item');
const Order = require('../src/models/Order');
const Payment = require('../src/models/Payment');

const img = (id) => `https://images.unsplash.com/${id}?w=800&q=70&auto=format&fit=crop`;
const hoursFromNow = (h) => new Date(Date.now() + h * 60 * 60 * 1000);

const events = [
  {
    name: 'Home & Living Deals',
    description: 'Premium home appliances and lifestyle items at unbeatable prices.',
    coverImage: img('photo-1555041469-a586c61ea9bc'),
    goLiveAt: hoursFromNow(-1), // already live
    items: [
      {
        name: 'Air Fryer 5L',
        price: 18990, quantity: 100, image: img('photo-1695089028114-ce28248f0ab9'),
        description: 'Crispy, golden food with up to 80% less oil – perfect for chips, chicken and vegetables.\n\n• 5 L basket – enough for a family of 4\n• 1500 W with adjustable temperature (80–200 °C) and 60-minute timer\n• 8 one-touch presets: fries, chicken, fish, steak, prawns, cake, vegetables, reheat\n• Non-stick, dishwasher-safe basket\n• Auto shut-off and overheat protection\n• 1-year warranty',
      },
      {
        name: 'Blender Pro',
        price: 12490, quantity: 150, image: img('photo-1585515320310-259814833e62'),
        description: 'Powerful blender for smoothies, juices, soups and sambols.\n\n• 1200 W motor with 6 stainless steel blades\n• 1.5 L shatter-resistant glass jar\n• 3 speeds + pulse, crushes ice easily\n• Includes a 600 ml grinder jar for spices and coconut\n• Anti-slip base, overload protection\n• 1-year warranty',
      },
      {
        name: 'Robot Vacuum',
        price: 39990, quantity: 100, image: img('photo-1603618090561-412154b4bd1b'),
        description: 'Keeps your floors clean every day without lifting a finger.\n\n• Smart navigation avoids furniture and stairs\n• Up to 120 minutes on one charge, returns to its dock automatically\n• Vacuums and mops (water tank included)\n• Works on tiles, wood and short carpets\n• Control and schedule cleaning from the mobile app\n• Only 7.5 cm tall – fits under beds and sofas\n• 1-year warranty',
      },
      {
        name: 'LED Desk Lamp',
        price: 3490, quantity: 200, image: img('photo-1507473885765-e6ed057f782c'),
        description: 'Eye-friendly lamp for studying and working late.\n\n• 5 colour temperatures and 10 brightness levels\n• Flicker-free LEDs to reduce eye strain\n• Built-in USB port to charge your phone\n• Foldable arm and 45-minute auto-off timer\n• Touch controls, 10 W power use\n• 6-month warranty',
      },
    ],
  },
  {
    name: 'Tech Essentials Flash Sale',
    description: 'Headphones, watches and gadgets sourced directly from overseas suppliers.',
    coverImage: img('photo-1498049794561-7780e7231661'),
    goLiveAt: hoursFromNow(2),
    items: [
      {
        name: 'Wireless Headphones',
        price: 14990, quantity: 100, image: img('photo-1505740420928-5e560c06d30e'),
        description: 'Over-ear Bluetooth headphones with active noise cancelling – block out traffic and focus.\n\n• Active noise cancelling (ANC) + transparency mode\n• Up to 30 hours of battery, 10-minute charge = 5 hours of play\n• Bluetooth 5.3 with built-in microphone for calls\n• Soft memory-foam ear cushions, foldable design\n• 3.5 mm cable included for wired use\n• 1-year warranty',
        variants: ['Black', 'Silver', 'Champagne'],
        variantImages: [img('photo-1487215078519-e21cc028cb29'), img('photo-1484704849700-f032a568e944'), img('photo-1545127398-14699f92334b')],
      },
      {
        name: 'Smart Watch',
        price: 9990, quantity: 120, image: img('photo-1523275335684-37898b6baf30'),
        description: 'Fitness and health tracker that also shows your phone notifications.\n\n• 1.85" colour touch display\n• Heart rate, SpO2, sleep and step tracking\n• 100+ sports modes\n• Water resistant (IP68) – fine for rain and handwashing\n• Up to 7 days of battery life\n• Works with Android and iPhone\n• 6-month warranty',
        variants: ['Black', 'White'],
        variantImages: [img('photo-1546868871-7041f2a55e12'), img('photo-1523275335684-37898b6baf30')],
      },
      {
        name: 'Instant Camera',
        price: 24990, quantity: 100, image: img('photo-1526170375885-4d8ecf77b99f'),
        description: 'Take a photo and hold the print in your hand seconds later – great for trips and parties.\n\n• Prints credit-card-size photos (54 × 86 mm)\n• Automatic exposure and built-in flash\n• Selfie mirror and close-up mode\n• Runs on 2 × AA batteries (included)\n• Film sold separately (10 photos per pack)\n• 1-year warranty',
      },
    ],
  },
  {
    name: 'Fashion Frenzy',
    description: 'Sneakers, sunglasses and accessories in limited quantities.',
    coverImage: img('photo-1441986300917-64674bd600d8'),
    goLiveAt: hoursFromNow(26),
    items: [
      {
        name: 'Running Sneakers',
        price: 7990, quantity: 300, image: img('photo-1542291026-7eec264c27ff'),
        description: 'Light, breathable running shoes for daily runs, gym and walking.\n\n• Breathable knit mesh upper\n• Cushioned EVA midsole for comfort\n• Rubber outsole with strong grip\n• Only about 260 g per shoe\n• Unisex sizing – choose your UK size',
        variants: ['UK 6', 'UK 7', 'UK 8', 'UK 9', 'UK 10'],
      },
      {
        name: 'Classic Sunglasses',
        price: 2990, quantity: 250, image: img('photo-1572635196237-14b3f281503f'),
        description: 'Timeless style with real sun protection for Sri Lankan sunshine.\n\n• Polarised lenses reduce glare from roads and water\n• UV400 – blocks 100% of UVA and UVB rays\n• Lightweight frame with metal hinges\n• Hard case and cleaning cloth included\n• Unisex fit',
        variants: ['Black', 'Tortoise'],
        variantImages: [img('photo-1572635196237-14b3f281503f'), img('photo-1577803645773-f96470509666')],
      },
    ],
  },
  {
    name: 'Beauty & Care Specials',
    description: 'Skincare and fragrance bundles.',
    coverImage: img('photo-1556228578-8c89e6adf883'),
    goLiveAt: hoursFromNow(-48),
    manualStatus: 'closed', // an ended event
    items: [
      {
        name: 'Skincare Set',
        price: 4490, quantity: 100, image: img('photo-1556228578-8c89e6adf883'),
        description: 'Simple 3-step daily routine for clean, healthy skin.\n\n• Gentle foaming cleanser (150 ml)\n• Hydrating toner (150 ml)\n• Light moisturiser with SPF 15 (50 ml)\n• Suitable for all skin types, paraben-free\n• Not tested on animals',
      },
    ],
  },
  {
    name: 'Gaming Gear Blitz',
    description: 'Controllers, keyboards and headsets for serious gamers.',
    coverImage: img('photo-1542751371-adc38448a05e'),
    goLiveAt: hoursFromNow(-0.5), // already live
    items: [
      {
        name: 'Wireless Controller',
        price: 6490, quantity: 150, image: img('photo-1592840496694-26d035b52b48'),
        description: 'Comfortable gamepad for PC, Android and iPhone gaming.\n\n• Bluetooth and USB-C wired modes\n• Dual vibration motors\n• Up to 20 hours of battery\n• Textured grips and responsive triggers\n• Phone clip included for mobile gaming\n• 6-month warranty',
        variants: ['Black', 'White'],
        variantImages: [img('photo-1592840496694-26d035b52b48'), img('photo-1600080972464-8e5f35f63d08')],
      },
      {
        name: 'Mechanical Keyboard',
        price: 13990, quantity: 120, image: img('photo-1618384887929-16ec33fab9ef'),
        description: 'Compact keyboard with a satisfying typing feel for gaming and coding.\n\n• 75% layout (84 keys) – saves desk space\n• Hot-swappable switches – change them without soldering\n• RGB backlight with 18 effects\n• USB-C wired + Bluetooth 5.0 (connect 3 devices)\n• Choose your switch: Red (smooth & quiet), Blue (clicky), Brown (soft bump)\n• 1-year warranty',
        variants: ['Red switches', 'Blue switches', 'Brown switches'],
      },
      {
        name: 'Gaming Mouse',
        price: 4990, quantity: 200, image: img('photo-1527814050087-3793815479db'),
        description: 'Fast and light mouse for precise aiming.\n\n• Only 65 g – honeycomb shell design\n• Adjustable sensor up to 16,000 DPI\n• 6 programmable buttons\n• Soft paracord cable and smooth PTFE feet\n• RGB lighting\n• 6-month warranty',
        variants: ['Black', 'White'],
        variantImages: [img('photo-1615663245857-ac93bb7c39e7'), img('photo-1527814050087-3793815479db')],
      },
      {
        name: 'Gaming Headset',
        price: 8990, quantity: 100, image: img('photo-1599669454699-248893623440'),
        description: 'Hear every footstep with 7.1 virtual surround sound.\n\n• 50 mm drivers with deep bass\n• Detachable noise-cancelling microphone\n• Works with PC, PlayStation, Xbox and phones (3.5 mm + USB)\n• Soft ear cushions for long sessions\n• Volume and mic-mute controls on the cable\n• 6-month warranty',
      },
    ],
  },
  {
    name: 'Kitchen Must-Haves',
    description: 'Coffee makers, cookware and kitchen tools for everyday cooking.',
    coverImage: img('photo-1556909114-f6e7ad7d3136'),
    goLiveAt: hoursFromNow(-3), // already live
    items: [
      {
        name: 'Espresso Machine',
        price: 34990, quantity: 100, image: img('photo-1495474472287-4d71bcdd2085'),
        description: 'Make café-style coffee at home – espresso, cappuccino and latte.\n\n• 15-bar pressure pump for rich crema\n• Steam wand for frothing milk\n• 1.2 L removable water tank\n• Makes 1 or 2 cups at a time\n• Cup-warming plate on top\n• Stainless steel finish\n• 1-year warranty',
      },
      {
        name: 'Non-Stick Pan Set',
        price: 9990, quantity: 150, image: img('photo-1590794056226-79ef3a8147e1'),
        description: 'Everyday cookware set that needs very little oil.\n\n• 3 pans: 20 cm, 24 cm and 28 cm\n• Granite non-stick coating, PFOA-free\n• Works on gas, electric and induction cookers\n• Heat-resistant soft-touch handles\n• Easy to clean',
      },
      {
        name: 'Chef Knife',
        price: 3990, quantity: 200, image: img('photo-1593618998160-e34014e67546'),
        description: 'One sharp knife for chopping, slicing and dicing.\n\n• 20 cm (8") high-carbon stainless steel blade\n• Sharp out of the box and easy to re-sharpen\n• Ergonomic non-slip handle\n• Comes in a gift box with a blade guard',
      },
    ],
  },
  {
    name: 'Sports & Fitness Rush',
    description: 'Gym equipment and outdoor gear to keep you moving.',
    coverImage: img('photo-1534438327276-14e5300c3a48'),
    goLiveAt: hoursFromNow(6),
    items: [
      {
        name: 'Yoga Mat',
        price: 2490, quantity: 250, image: img('photo-1601925260368-ae2f83cf8b7f'),
        description: 'Non-slip mat for yoga, stretching and home workouts.\n\n• 6 mm thick for joint comfort\n• Size 183 × 61 cm\n• Non-slip texture on both sides\n• Light (about 900 g) with a carrying strap\n• Easy to wipe clean',
        variants: ['Purple', 'Blue', 'Black'],
      },
      {
        name: 'Adjustable Dumbbells',
        price: 14990, quantity: 100, image: img('photo-1517836357463-d25dfeac3438'),
        description: 'Start strength training at home with one compact set.\n\n• Pair of dumbbells, each adjustable from 2 kg to 10 kg (20 kg total)\n• Cast-iron plates with spin-lock collars\n• Comfortable knurled steel handles\n• Carry case included',
      },
      {
        name: 'Water Bottle',
        price: 2290, quantity: 300, image: img('photo-1602143407151-7111542de6e8'),
        description: 'Stainless steel bottle that keeps water cold all day.\n\n• 750 ml capacity\n• Double-wall vacuum insulation – cold for 24 hours, hot for 12\n• Leak-proof lid with carry loop\n• BPA-free, no metallic taste\n• Fits most car cup holders',
      },
    ],
  },
  {
    name: 'Back to School',
    description: 'Backpacks, stationery and study gadgets for the new term.',
    coverImage: img('photo-1503676260728-1c00da094a0b'),
    goLiveAt: hoursFromNow(50),
    items: [
      {
        name: 'Laptop Backpack',
        price: 4990, quantity: 200, image: img('photo-1553062407-98eeb64c6a62'),
        description: 'Smart everyday backpack for campus and office.\n\n• Padded pocket fits laptops up to 15.6"\n• Water-resistant fabric\n• Built-in USB charging port (power bank not included)\n• Hidden anti-theft back pocket\n• Padded shoulder straps and back panel\n• 25 L capacity',
        variants: ['Navy', 'Black', 'Brown'],
        variantImages: [img('photo-1553062407-98eeb64c6a62'), img('photo-1581605405669-fcdf81165afa'), img('photo-1622560480605-d83c853bc5c3')],
      },
      {
        name: 'Notebook Pack',
        price: 1290, quantity: 300, image: img('photo-1531346878377-a5be20888e57'),
        description: 'Good-quality notebooks for lectures and notes.\n\n• Pack of 5 A5 notebooks\n• 120 pages each, 80 gsm paper (no ink bleed)\n• Sturdy cover with elastic closure\n• Choose your page style: ruled, dotted or blank',
        variants: ['Ruled', 'Dotted', 'Blank'],
      },
      {
        name: 'Wireless Earbuds',
        price: 5990, quantity: 150, image: img('photo-1572569511254-d8f925fe2cbb'),
        description: 'True wireless earbuds for music, calls and online classes.\n\n• Up to 24 hours of playback with the charging case\n• Bluetooth 5.3 – quick, stable connection\n• Touch controls and voice assistant support\n• IPX5 sweat and splash resistance\n• USB-C charging\n• 6-month warranty',
        variants: ['White', 'Black'],
        variantImages: [img('photo-1572569511254-d8f925fe2cbb'), img('photo-1606220588913-b3aacb4d2f46')],
      },
    ],
  },
  {
    name: 'Book Lovers Sale',
    description: 'Bestsellers and classic novels at flash prices.',
    coverImage: img('photo-1512820790803-83ca734da794'),
    goLiveAt: hoursFromNow(-72),
    manualStatus: 'closed', // an ended event
    items: [
      {
        name: 'Bestseller Bundle',
        price: 4990, quantity: 100, image: img('photo-1544947950-fa07a98d237f'),
        description: 'Three of this year’s most popular novels in paperback.\n\n• 3 English paperback novels\n• Mix of thriller, romance and literary fiction\n• Brand-new copies\n• Great as a gift',
      },
      {
        name: 'Kindle Reader',
        price: 32990, quantity: 100, image: img('photo-1592496431122-2349e0fbc666'),
        description: 'Read thousands of books on a screen that feels like paper.\n\n• 6" glare-free display – easy to read in sunlight\n• Adjustable front light for night reading\n• 16 GB storage – holds thousands of books\n• Weeks of battery life on one charge\n• Light: only 158 g\n• 1-year warranty',
      },
    ],
  },
];

// Brand and normal retail price of each item (the sale price above is lower)
const EXTRAS = {
  'Air Fryer 5L': ['Philips', 29990],
  'Blender Pro': ['Panasonic', 18990],
  'Robot Vacuum': ['Xiaomi', 64990],
  'LED Desk Lamp': ['Baseus', 5490],
  'Wireless Headphones': ['Sony', 24990],
  'Smart Watch': ['Samsung', 16990],
  'Instant Camera': ['Fujifilm', 34990],
  'Running Sneakers': ['Nike', 13990],
  'Classic Sunglasses': ['Ray-Ban', 4990],
  'Skincare Set': ['Cetaphil', 6990],
  'Wireless Controller': ['8BitDo', 9990],
  'Mechanical Keyboard': ['Keychron', 21990],
  'Gaming Mouse': ['Logitech', 7990],
  'Gaming Headset': ['HyperX', 13990],
  'Espresso Machine': ['DeLonghi', 54990],
  'Non-Stick Pan Set': ['Prestige', 15990],
  'Chef Knife': ['Victorinox', 6490],
  'Yoga Mat': ['Decathlon', 3990],
  'Adjustable Dumbbells': ['Bowflex', 22990],
  'Water Bottle': ['Hydro Flask', 3990],
  'Laptop Backpack': ['Samsonite', 8990],
  'Notebook Pack': ['Atlas', 1990],
  'Wireless Earbuds': ['JBL', 9990],
  'Bestseller Bundle': ['Penguin', 7490],
  'Kindle Reader': ['Amazon', 44990],
};

// How long each live / upcoming sale runs after going live
const SALE_HOURS = {
  'Home & Living Deals': 6,
  'Tech Essentials Flash Sale': 4,
  'Fashion Frenzy': 12,
  'Gaming Gear Blitz': 2,
  'Kitchen Must-Haves': 8,
  'Sports & Fitness Rush': 6,
  'Back to School': 24,
};

async function seed() {
  await mongoose.connect(config.mongoUri);
  console.log('Connected. Clearing old data...');
  await Promise.all([User, Session, Event, Item, Order, Payment].map((m) => m.deleteMany({})));
  await Promise.all([User, Session, Event, Item, Order, Payment].map((m) => m.syncIndexes()));

  const customerHash = await bcrypt.hash('Customer@123', 10);
  const [, sarah, nimal, kavindi] = await User.create([
    { name: 'Admin User', email: 'admin@swiftdrop.com', passwordHash: await bcrypt.hash('Admin@123', 10), role: 'admin' },
    { name: 'Sarah Tan', email: 'sarah@example.com', phone: '077 123 4567', address: '45/2 Galle Road, Colombo 03', passwordHash: customerHash },
    { name: 'Nimal Perera', email: 'nimal@example.com', phone: '071 555 8899', address: '12 Temple Road, Kandy', passwordHash: customerHash },
    { name: 'Kavindi Silva', email: 'kavindi@example.com', phone: '076 321 0099', address: '88 Main Street, Negombo', passwordHash: customerHash },
  ]);

  const createdItems = {}; // item name -> { item, event }
  for (const e of events) {
    const { items, ...eventData } = e;
    // Live and upcoming sales run for a limited time (drives the "Sale ends in" timers)
    if (!eventData.manualStatus) eventData.endsAt = new Date(new Date(eventData.goLiveAt).getTime() + SALE_HOURS[e.name] * 3600000);
    const event = await Event.create(eventData);
    const docs = await Item.insertMany(
      items.map((i) => ({ ...i, brand: EXTRAS[i.name][0], originalPrice: EXTRAS[i.name][1], eventId: event._id, stock: i.quantity }))
    );
    docs.forEach((item) => (createdItems[item.name] = { item, event }));
  }

  // Demo paid orders: [customer, item, variety, delivered?]
  // Sarah's orders are only from the ended event, so she can still try buying everything that is live.
  const demoOrders = [
    [sarah, 'Kindle Reader', '', false],
    [sarah, 'Bestseller Bundle', '', false],
    [nimal, 'Air Fryer 5L', '', false],
    [nimal, 'Blender Pro', '', false],
    [nimal, 'LED Desk Lamp', '', false],
    [kavindi, 'Robot Vacuum', '', false],
    [kavindi, 'Bestseller Bundle', '', true],
  ];
  for (const [user, itemName, variant, delivered] of demoOrders) {
    const { item, event } = createdItems[itemName];
    const index = item.variants.indexOf(variant);
    await Order.create({
      userId: user._id,
      eventId: event._id,
      itemId: item._id,
      eventName: event.name,
      itemName: item.name,
      itemImage: (index >= 0 && item.variantImages[index]) || item.image,
      variant,
      price: item.price,
      quantity: 1,
      status: 'confirmed',
      active: true,
      paymentMethod: 'cod',
      paidAt: delivered ? new Date() : null,
      deliveredAt: delivered ? new Date() : null,
    });
    await Item.updateOne({ _id: item._id }, { $inc: { stock: -1 } });
  }

  console.log('Seed complete!');
  console.log('  Admin:    admin@swiftdrop.com / Admin@123');
  console.log('  Customer: sarah@example.com   / Customer@123   (also nimal@ and kavindi@example.com)');
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
