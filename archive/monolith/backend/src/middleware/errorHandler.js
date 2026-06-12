const logger = require('../utils/logger');

function notFound(req, res) {
  res.status(404).json({ error: `Not found: ${req.method} ${req.path}` });
}

function errorHandler(err, req, res, _next) {
  logger.error(err.stack || err.message);
  const status = err.status || 500;
  res.status(status).json({ error: err.message || 'Internal server error' });
}

module.exports = { notFound, errorHandler };
