const { NODE_ENV } = require('../config/env');

function info(...args) {
  console.log('[INFO]', ...args);
}

function warn(...args) {
  console.warn('[WARN]', ...args);
}

function error(...args) {
  console.error('[ERROR]', ...args);
}

function debug(...args) {
  if (NODE_ENV !== 'production') console.log('[DEBUG]', ...args);
}

module.exports = { info, warn, error, debug };
