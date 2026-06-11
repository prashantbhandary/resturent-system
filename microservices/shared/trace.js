// Distributed tracing (lab requirement: "Distributed tracing").
//
// Basic but real: the gateway generates a unique x-trace-id per incoming
// request; every service propagates it on outbound calls and attaches it to
// every log line. Querying the logging-service by traceId then shows the
// whole journey of one request across all services.
const crypto = require('crypto');

// Express middleware: adopt the incoming trace id or start a new one.
function traceMiddleware(req, res, next) {
  req.traceId = req.headers['x-trace-id'] || crypto.randomUUID();
  res.setHeader('x-trace-id', req.traceId);
  next();
}

// Headers to forward on any service-to-service call.
function traceHeaders(req) {
  return { 'x-trace-id': req.traceId };
}

module.exports = { traceMiddleware, traceHeaders };
