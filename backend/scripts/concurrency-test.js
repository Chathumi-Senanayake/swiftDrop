// Proves "zero oversell": 1,000 different customers try to buy the same item (stock 100) at the SAME moment.
//
// Usage:   npm run test:concurrency                         (targets http://localhost:3000)
//          npm run test:concurrency -- http://nginx         (inside Docker, through the load balancer)
//          USERS=500 STOCK=50 npm run test:concurrency
//
// It creates test users + a live test event directly in the database, fires all purchase
// requests at once, checks the results, then deletes the test data.
const mongoose = require('mongoose');
const config = require('../src/config');
const authService = require('../src/services/authService');
const User = require('../src/models/User');
const Session = require('../src/models/Session');
const Event = require('../src/models/Event');
const Item = require('../src/models/Item');
const Order = require('../src/models/Order');

const TARGET = process.argv[2] || 'http://localhost:3000';
const USERS = Number(process.env.USERS || 1000);
const STOCK = Number(process.env.STOCK || 100);

async function run() {
  await mongoose.connect(config.mongoUri);
  const tag = Date.now();

  // 1. A live event with one item
  const event = await Event.create({
    name: `Concurrency Test ${tag}`,
    coverImage: '/img/placeholder.svg',
    goLiveAt: new Date(Date.now() - 1000),
  });
  const item = await Item.create({ eventId: event._id, name: 'Test Item', price: 10, quantity: STOCK, stock: STOCK });

  // 2. Many test users, each already logged in
  const users = await User.insertMany(
    Array.from({ length: USERS }, (_, i) => ({ name: `Load User ${i}`, email: `load${tag}_${i}@test.local`, passwordHash: 'x' }))
  );
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
  const sessions = await Session.insertMany(users.map((u) => ({ userId: u._id, expiresAt })));
  const tokens = sessions.map((s, i) => authService.signToken(s, users[i]));

  console.log(`Firing ${USERS} simultaneous purchase requests at ${TARGET} for an item with stock ${STOCK}...`);

  // 3. Fire everything at once
  const started = Date.now();
  const timings = [];
  const statuses = await Promise.all(
    tokens.map(async (token) => {
      const t0 = Date.now();
      try {
        const res = await fetch(`${TARGET}/api/purchase/reserve`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ itemId: item._id }),
        });
        const body = await res.json().catch(() => ({}));
        timings.push(Date.now() - t0);
        return res.status === 201 ? 'reserved' : `${res.status} ${body.error?.code || ''}`.trim();
      } catch (err) {
        return `network error (${err.cause?.code || err.message})`;
      }
    })
  );
  const totalMs = Date.now() - started;

  // 4. Check the database
  const finalItem = await Item.findById(item._id).lean();
  const activeOrders = await Order.countDocuments({ itemId: item._id, active: true });

  const counts = statuses.reduce((acc, s) => ((acc[s] = (acc[s] || 0) + 1), acc), {});
  timings.sort((a, b) => a - b);
  const p95 = timings[Math.floor(timings.length * 0.95)] || 0;
  const serverErrors = statuses.filter((s) => /^5\d\d/.test(s) || s.startsWith('network error')).length;

  console.log('\nResponses:', counts);
  console.log(`Total time: ${totalMs} ms   p95 latency: ${p95} ms`);
  console.log(`Stock left in DB: ${finalItem.stock}   Orders in DB: ${activeOrders}   Starting stock: ${STOCK}`);

  const noOversell = activeOrders <= STOCK && activeOrders + finalItem.stock === STOCK && finalItem.stock >= 0;
  console.log(noOversell ? '\nPASS: zero oversell, stock and orders match exactly.' : '\nFAIL: stock and orders do not match!');
  console.log(serverErrors === 0 ? 'PASS: no 5xx / network errors.' : `WARN: ${serverErrors} 5xx / network errors.`);

  // 5. Clean up
  await Order.deleteMany({ itemId: item._id });
  await Session.deleteMany({ _id: { $in: sessions.map((s) => s._id) } });
  await User.deleteMany({ _id: { $in: users.map((u) => u._id) } });
  await Item.deleteOne({ _id: item._id });
  await Event.deleteOne({ _id: event._id });
  await mongoose.disconnect();
  process.exit(noOversell ? 0 : 1);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
