// Rate limiting (lab requirement: "Rate limiting").
//
// Basic fixed-window limiter, hand-rolled so the mechanism is visible:
// each client IP gets a counter that resets every WINDOW_MS. Exceed the
// budget -> HTTP 429 Too Many Requests. In production you'd back this with
// Redis so all gateway replicas share one budget (noted in README).
const WINDOW_MS = 60_000;
const MAX_REQUESTS = parseInt(process.env.RATE_LIMIT_PER_MIN, 10) || 100;

const windows = new Map(); // ip -> { count, windowStart }

function rateLimiter(req, res, next) {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  let w = windows.get(ip);
  if (!w || now - w.windowStart >= WINDOW_MS) {
    w = { count: 0, windowStart: now };
    windows.set(ip, w);
  }
  w.count += 1;
  res.setHeader('X-RateLimit-Limit', MAX_REQUESTS);
  res.setHeader('X-RateLimit-Remaining', Math.max(0, MAX_REQUESTS - w.count));
  if (w.count > MAX_REQUESTS) {
    return res.status(429).json({ error: 'Too many requests, slow down' });
  }
  next();
}

// stop the map growing forever
setInterval(() => {
  const now = Date.now();
  for (const [ip, w] of windows) if (now - w.windowStart >= WINDOW_MS) windows.delete(ip);
}, WINDOW_MS).unref();

module.exports = { rateLimiter };
