// Service Registry (lab requirement: "Service Discovery").
//
// The phone book of the system. Services POST /register on boot and then
// heartbeat every 10s; an instance that misses heartbeats for TTL_MS is
// pruned (assumed dead). Consumers GET /services/:name to find the live
// instances — the shared discovery client then round-robins across them
// (load balancing). In Kubernetes this whole job is done natively by
// Service objects + DNS, which is why the gateway has a "dns" mode.
const express = require('express');

const PORT = parseInt(process.env.PORT, 10) || 4000;
const TTL_MS = 30_000;

const app = express();
app.use(express.json());

// service name -> Map(url -> lastSeen timestamp)
const services = new Map();

app.post('/register', (req, res) => {
  const { service, url } = req.body || {};
  if (!service || !url) return res.status(400).json({ error: 'service and url required' });
  if (!services.has(service)) services.set(service, new Map());
  services.get(service).set(url, Date.now());
  res.json({ ok: true });
});

app.get('/services/:name', (req, res) => {
  const instances = [];
  const entry = services.get(req.params.name);
  if (entry) {
    for (const [url, lastSeen] of entry) {
      if (Date.now() - lastSeen < TTL_MS) instances.push({ url, lastSeen });
      else entry.delete(url); // prune dead instances lazily
    }
  }
  res.json({ service: req.params.name, instances });
});

// Whole-system view: every known service and its live instances.
app.get('/services', (req, res) => {
  const out = {};
  for (const [name, entry] of services) {
    out[name] = [...entry.entries()]
      .filter(([, t]) => Date.now() - t < TTL_MS)
      .map(([url]) => url);
  }
  res.json(out);
});

app.get('/health', (req, res) => res.json({ ok: true, service: 'registry', uptime: process.uptime() }));

app.listen(PORT, () => console.log(JSON.stringify({ service: 'registry', message: `listening on ${PORT}` })));
