// All settings in one place. Values come from environment variables (.env file).
require('dotenv').config();
const os = require('os');
const path = require('path');

const publicUrl = (process.env.PUBLIC_URL || '').replace(/\/+$/, '');

module.exports = {
  port: Number(process.env.PORT || 3000),
  mongoUri: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/swiftdrop',
  jwtSecret: process.env.JWT_SECRET || 'swiftdrop-dev-secret',
  reservationMinutes: Number(process.env.RESERVATION_MINUTES || 5),
  uploadDir: path.join(__dirname, '..', 'uploads'),
  // Name of this server instance (shows which app server handled a request behind the load balancer)
  instanceName: process.env.INSTANCE_NAME || os.hostname(),

  // "Continue with Google" (Firebase Authentication). Empty = Google sign-in switched off.
  // Only the project ID is needed: Firebase login tokens are checked against Google's public keys.
  firebaseProjectId: process.env.FIREBASE_PROJECT_ID || '',

  // ---------- Payments ----------
  // The address customers open the site at, e.g. https://swiftdrop.lk (used for the gateway's return links).
  // Empty = use the address of the browser that started checkout.
  publicUrl,
  payments: {
    // Extra minutes a reservation is held once the customer is sent to the card gateway
    checkoutMinutes: Number(process.env.CHECKOUT_MINUTES || 15),
    codEnabled: process.env.COD_ENABLED !== 'false',
    // PayHere (https://www.payhere.lk) – card payments. Leave the merchant ID empty to switch cards off.
    payhere: {
      merchantId: process.env.PAYHERE_MERCHANT_ID || '',
      merchantSecret: process.env.PAYHERE_MERCHANT_SECRET || '',
      sandbox: process.env.PAYHERE_SANDBOX !== 'false',
      // PayHere's servers call this URL to report the payment result. It MUST be reachable from the internet.
      notifyUrl: process.env.PAYHERE_NOTIFY_URL || (publicUrl && publicUrl + '/api/payments/payhere/notify'),
    },
  },
};
