const http = require('http');
const path = require('path');
const express = require('express');
const cors = require('cors');
const compression = require('compression');
const bodyParser = require('body-parser');
const { Server } = require('socket.io');

const { PORT, CORS_ORIGIN } = require('./config/env');
const { migrate } = require('./db/migrate');
const { attachHandlers } = require('./socket/handlers');
const { notFound, errorHandler } = require('./middleware/errorHandler');
const logger = require('./utils/logger');

const authRoutes = require('./routes/auth');
const menuRoutes = require('./routes/menu');
const orderRoutes = require('./routes/orders');
const kitchenRoutes = require('./routes/kitchen');
const billingRoutes = require('./routes/billing');
const adminRoutes = require('./routes/admin');
const provisioningRoutes = require('./routes/provisioning');
const configRoutes = require('./routes/config');

// On the LAN appliance, customer phones / staff devices reach the box via many
// origins (restaurant.local, raw IPs). '*' reflects the request origin so they
// all work offline; set CORS_ORIGIN to a specific origin to lock it down.
const corsOrigin = CORS_ORIGIN === '*' ? true : CORS_ORIGIN;

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: corsOrigin, methods: ['GET', 'POST'] },
});
app.set('io', io);

app.use(cors({ origin: corsOrigin, credentials: true }));
app.use(compression());
app.use(bodyParser.json({ limit: '2mb' }));
app.use(bodyParser.urlencoded({ extended: true }));

app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    logger.debug(`${req.method} ${req.path} ${res.statusCode} ${Date.now() - start}ms`);
  });
  next();
});

app.get('/api/health', (req, res) => res.json({ ok: true, time: new Date().toISOString() }));

app.use('/api/provisioning', provisioningRoutes);
app.use('/api/config', configRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/kitchen', kitchenRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/admin', adminRoutes);

// Serve the built frontend so the Pi runs as a single-box LAN appliance:
// one Node process answers both the API and the app on one port.
const distPath = path.join(__dirname, '..', '..', 'frontend', 'dist');
app.use(express.static(distPath));
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) return next(); // unknown API route -> 404 handler
  res.sendFile(path.join(distPath, 'index.html')); // SPA fallback
});

app.use(notFound);
app.use(errorHandler);

attachHandlers(io);

async function start() {
  await migrate();
  server.listen(PORT, () => {
    logger.info(`Server listening on http://localhost:${PORT}`);
    logger.info(`Allowing CORS origin: ${CORS_ORIGIN}`);
  });
}

start().catch((err) => {
  logger.error('Failed to start server:', err);
  process.exit(1);
});
