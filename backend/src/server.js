// Entry point: connect to MongoDB, start the web server, start the reservation-expiry job.
const fs = require('fs');
const mongoose = require('mongoose');
const config = require('./config');
const app = require('./app');
const purchaseService = require('./services/purchaseService');

async function start() {
  fs.mkdirSync(config.uploadDir, { recursive: true });

  await mongoose.connect(config.mongoUri, { maxPoolSize: 50 });
  console.log('Connected to MongoDB');

  // backlog = how many new connections can wait in line (Node's default of 511 is too small for a flash sale)
  app.listen({ port: config.port, backlog: 4096 }, () => {
    console.log(`[${config.instanceName}] SwiftDrop running on http://localhost:${config.port}`);
  });

  // Every 15 seconds, give back stock from reservations that were not paid in time
  setInterval(() => {
    purchaseService.releaseExpired().catch((err) => console.error('Expiry job failed:', err.message));
  }, 15000);
}

start().catch((err) => {
  console.error('Failed to start:', err.message);
  process.exit(1);
});
