// Service discovery + client-side load balancing
// (lab requirements: "Service Discovery", "Load Balancing").
//
// Two modes, picked via DISCOVERY_MODE:
//
//  - "registry" (default, used by docker-compose):
//      Each service self-registers with the registry-service and heartbeats
//      every 10s. Consumers ask the registry for the healthy instances of a
//      service and ROUND-ROBIN between them -> client-side load balancing.
//      Scale a service (docker compose up --scale menu-service=3) and watch
//      requests rotate across instances.
//
//  - "dns" (used in Kubernetes):
//      Kubernetes Services already provide discovery (DNS names) and load
//      balancing (kube-proxy), so we simply resolve http://<service>:<port>.
const logger = require('./logger');

const MODE = process.env.DISCOVERY_MODE || 'registry';
const REGISTRY_URL = process.env.REGISTRY_URL || 'http://registry:4000';

// Well-known ports (also used for DNS mode in Kubernetes).
const PORTS = {
  'auth-service': 4001,
  'menu-service': 4002,
  'order-service': 4003,
  'billing-service': 4004,
  'logging-service': 4005,
};

// ---- registration (called by each service on boot) ----
async function registerSelf(serviceName, port) {
  if (MODE !== 'registry') return; // k8s registers via its own Service objects
  const host = process.env.HOSTNAME || serviceName; // container hostname
  const url = `http://${host}:${port}`;
  const beat = async () => {
    try {
      await fetch(`${REGISTRY_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ service: serviceName, url }),
      });
    } catch {
      logger.warn(`registry unreachable, will retry`, {});
    }
  };
  await beat();
  setInterval(beat, 10_000).unref(); // heartbeat keeps the lease alive
}

// ---- resolution (called by consumers: gateway, order-service) ----
const cache = new Map(); // service -> { urls, fetchedAt }
const rrIndex = new Map(); // service -> round-robin counter

async function resolve(serviceName) {
  if (MODE === 'dns') return `http://${serviceName}:${PORTS[serviceName]}`;

  let entry = cache.get(serviceName);
  if (!entry || Date.now() - entry.fetchedAt > 5_000) {
    const res = await fetch(`${REGISTRY_URL}/services/${serviceName}`);
    if (!res.ok) throw new Error(`discovery failed for ${serviceName}`);
    const { instances } = await res.json();
    if (!instances.length) throw new Error(`no instances of ${serviceName}`);
    entry = { urls: instances.map((i) => i.url), fetchedAt: Date.now() };
    cache.set(serviceName, entry);
  }
  // round-robin across healthy instances = load balancing
  const i = (rrIndex.get(serviceName) || 0) % entry.urls.length;
  rrIndex.set(serviceName, i + 1);
  return entry.urls[i];
}

module.exports = { registerSelf, resolve, PORTS };
