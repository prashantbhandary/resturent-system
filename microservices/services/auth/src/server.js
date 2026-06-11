// auth-service: owns users + JWT. Nothing else in the system can read the
// users table — identity is only available through this service's API.
const express = require('express');
const logger = require('../../../shared/logger');
const { traceMiddleware } = require('../../../shared/trace');
const { registerSelf } = require('../../../shared/discovery');
const users = require('./repositories/userRepository');
const authService = require('./services/authService');
const ctrl = require('./controllers/authController');

const PORT = parseInt(process.env.PORT, 10) || 4001;
const REDIS_URL = process.env.REDIS_URL || 'redis://redis:6379';

const app = express();
app.use(express.json());
app.use(traceMiddleware);

app.post('/api/auth/login', ctrl.login);
app.get('/api/auth/verify', ctrl.verify);
app.get('/api/auth/me', ctrl.verify); // frontend session-restore uses /me

// Health check (lab requirement): used by Docker HEALTHCHECK and k8s probes.
app.get('/health', (req, res) => res.json({ ok: true, service: 'auth-service', uptime: process.uptime() }));

app.use((err, req, res, next) => {
  res.status(err.status || 500).json({ error: err.message });
});

async function start() {
  await logger.initLogger(REDIS_URL);
  await users.init();
  await authService.seedDefaultUsers();
  app.listen(PORT, async () => {
    logger.info(`listening on ${PORT}`);
    await registerSelf('auth-service', PORT);
  });
}
start();
