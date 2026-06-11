// Centralized logging (lab requirement: "Centralized logging").
//
// Every service logs structured JSON to stdout AND publishes the same entry to
// the Redis "logs" channel. The logging-service subscribes to that channel and
// aggregates entries from ALL services in one place, queryable by service name
// or traceId (which is what makes the distributed tracing visible).
const { createClient } = require('redis');

const SERVICE = process.env.SERVICE_NAME || 'unknown';
let publisher = null;

async function initLogger(redisUrl) {
  try {
    publisher = createClient({ url: redisUrl });
    publisher.on('error', () => {}); // never let logging crash the service
    await publisher.connect();
  } catch {
    publisher = null; // Redis down -> still log to stdout, just not centrally
  }
}

function log(level, message, meta = {}) {
  const entry = {
    ts: new Date().toISOString(),
    service: SERVICE,
    level,
    message,
    ...meta, // typically { traceId, ...extra }
  };
  console.log(JSON.stringify(entry));
  if (publisher && publisher.isReady) {
    publisher.publish('logs', JSON.stringify(entry)).catch(() => {});
  }
}

module.exports = {
  initLogger,
  info: (msg, meta) => log('info', msg, meta),
  warn: (msg, meta) => log('warn', msg, meta),
  error: (msg, meta) => log('error', msg, meta),
};
