// All settings in one place. Values come from environment variables (.env file).
require('dotenv').config();
const os = require('os');
const path = require('path');

module.exports = {
  port: Number(process.env.PORT || 3000),
  mongoUri: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/swiftdrop',
  jwtSecret: process.env.JWT_SECRET || 'swiftdrop-dev-secret',
  reservationMinutes: Number(process.env.RESERVATION_MINUTES || 5),
  uploadDir: path.join(__dirname, '..', 'uploads'),
  // Name of this server instance (shows which app server handled a request behind the load balancer)
  instanceName: process.env.INSTANCE_NAME || os.hostname(),
};
