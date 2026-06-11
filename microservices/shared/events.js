// Event-driven communication (lab requirement: "Event-driven communication").
//
// Services do NOT call each other for things that can happen asynchronously.
// Instead a service publishes a fact ("order.created") to the Redis "events"
// channel and moves on; any interested service reacts in its own time.
// Example in this system: order-service publishes order.created and the
// billing-service (a completely independent process with its own database)
// subscribes and creates a draft bill. If billing is down, orders still work
// — that is the decoupling event-driven architecture buys you.
const { createClient } = require('redis');
const logger = require('./logger');

const CHANNEL = 'events';

async function createPublisher(redisUrl) {
  const client = createClient({ url: redisUrl });
  client.on('error', () => {});
  await client.connect();
  return {
    publish: async (type, data, traceId) => {
      const event = { type, data, traceId, ts: new Date().toISOString() };
      await client.publish(CHANNEL, JSON.stringify(event));
      logger.info(`event published: ${type}`, { traceId });
    },
  };
}

async function subscribe(redisUrl, handlers) {
  const client = createClient({ url: redisUrl });
  client.on('error', () => {});
  await client.connect();
  await client.subscribe(CHANNEL, (raw) => {
    let event;
    try { event = JSON.parse(raw); } catch { return; }
    const handler = handlers[event.type];
    if (!handler) return;
    logger.info(`event received: ${event.type}`, { traceId: event.traceId });
    Promise.resolve(handler(event)).catch((err) =>
      logger.error(`event handler failed: ${err.message}`, { traceId: event.traceId })
    );
  });
}

module.exports = { createPublisher, subscribe };
