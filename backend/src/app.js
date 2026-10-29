// Builds the Express app: middleware, routes, the React app (when built), error handling.
const express = require('express');
const fs = require('fs');
const path = require('path');
const config = require('./config');
const AppError = require('./utils/AppError');
const errorHandler = require('./middleware/errorHandler');

const app = express();
app.set('trust proxy', true); // we sit behind Nginx

app.use(express.json({ limit: '1mb' }));

// Tells you which app server answered (useful to see the load balancer working)
app.use((req, res, next) => {
  res.set('X-Served-By', config.instanceName);
  next();
});

// Uploaded images
app.use('/uploads', express.static(config.uploadDir));

// API
app.get('/api/health', (req, res) => res.json({ ok: true, instance: config.instanceName }));
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/me', require('./routes/profileRoutes'));
app.use('/api/events', require('./routes/eventRoutes'));
app.use('/api/items', require('./routes/itemRoutes'));
app.use('/api/purchase', require('./routes/purchaseRoutes'));
app.use('/api/payments', require('./routes/paymentRoutes'));
app.use('/api/subscribe', require('./routes/subscribeRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));

// Unknown API URL -> JSON 404 (not an HTML page)
app.use('/api', (req, res, next) => next(new AppError(404, 'This API endpoint does not exist.', 'NOT_FOUND')));

// The React app (frontend/dist), if it has been built with "npm run build".
// In development Vite serves it instead, and in Docker Nginx does.
const webDir = path.join(__dirname, '..', '..', 'frontend', 'dist');
if (fs.existsSync(webDir)) {
  app.use(express.static(webDir));
  // Any other page URL (e.g. /events/123) -> index.html, and React Router shows the right page
  app.use((req, res, next) => (req.method === 'GET' ? res.sendFile(path.join(webDir, 'index.html')) : next()));
}

app.use(errorHandler);

module.exports = app;
