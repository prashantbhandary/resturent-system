# Restaurant System — Microservices (Cloud Computing Lab)

The restaurant QR-ordering system re-architected from a monolith into
microservices, implementing the standard cloud-infrastructure patterns **in a
deliberately basic, readable way** — every pattern is hand-rolled and commented
so you can explain the mechanism, not just name the library.

```
                                   ┌──────────────────────────────────────────┐
                                   │                Docker / k8s              │
   client                          │                                          │
     │  http://localhost:8080      │   ┌─────────────┐      ┌──────────────┐  │
     ▼                             │   │  registry   │◄─────│ every service│  │
 ┌─────────┐  rate limit ▸ trace   │   │ (discovery) │ beat │ self-registers│ │
 │ GATEWAY │  ▸ auth ▸ breaker ────┼──►└─────────────┘      └──────────────┘  │
 └─────────┘        │              │                                          │
      route+load-balance           │   ┌────────────┐  own DB volume each     │
      ┌─────────┬───┴────┬─────────┼──►│ auth :4001 │  ┌──────────────┐       │
      ▼         ▼        ▼         │   │ menu :4002 │  │ order :4003  │       │
   /api/auth /api/menu /api/orders │   └────────────┘  └──────┬───────┘       │
                                   │                          │ publishes     │
   /api/bills ────────────────────►│   ┌─────────────┐   ┌────▼─────────┐     │
   /api/logs ─────────────────────►│   │ logging:4005│◄──│ redis events │     │
                                   │   └─────────────┘   └────┬─────────┘     │
                                   │        ▲ logs channel    │ subscribes    │
                                   │        └─ all services   ▼               │
                                   │                  ┌──────────────┐        │
                                   │                  │ billing:4004 │        │
                                   │                  └──────────────┘        │
                                   └──────────────────────────────────────────┘
```

## Run it

```bash
cd microservices
docker compose up --build          # first build takes a few minutes
./demo.sh                          # scripted walk-through of every pattern
```

Everything is reachable ONLY through the gateway at `http://localhost:8080`.

## Requirement → where it's implemented

| Requirement | Where | How (basic version) |
|---|---|---|
| **API Gateway** | `services/gateway/src/server.js` | Single entry point; routes `/api/*` prefixes to owning services; applies rate limit, tracing, edge auth, circuit breaker to every call |
| **Service Discovery** | `services/registry/src/server.js` + `shared/discovery.js` | Services self-register + heartbeat (10s); registry prunes dead instances (30s TTL); consumers query it. In k8s, `DISCOVERY_MODE=dns` uses native Service DNS instead |
| **Load Balancing** | `shared/discovery.js` (`resolve()`) | Client-side round-robin across registered instances. Demo: `docker compose up --scale menu-service=3` and watch `service` hostnames rotate in the logs. In k8s, kube-proxy balances across pod replicas |
| **Containerization** | `Dockerfile` + `docker-compose.yml` | One parameterized Dockerfile (`--build-arg SERVICE=...`) builds each service into its own image |
| **Kubernetes orchestration** | `k8s/*.yaml` | Deployments (replicas, probes), Services, NodePort gateway; namespace `restaurant` |
| **Independent databases per service** | `shared/sqlite.js` + per-service `repositories/` + compose `volumes:` | auth, menu, order, billing each own a private SQLite DB in their **own Docker volume**; no service reads another's data — they use APIs/events |
| **Event-driven communication** | `shared/events.js`, `order/src/services/orderService.js`, `billing/src/services/billingService.js` | order-service publishes `order.created` to Redis; billing-service subscribes and creates the bill. Order flow never waits on billing |
| **Centralized logging** | `shared/logger.js` + `services/logging/src/server.js` | Every service logs JSON to stdout **and** the Redis `logs` channel; logging-service aggregates and serves `GET /api/logs` |
| **Distributed tracing** | `shared/trace.js` | Gateway mints an `x-trace-id` per request; it's propagated on every hop and stamped on every log line. `GET /api/logs?traceId=<id>` shows one request's journey across services |
| **Health checks** | `/health` on every service; compose `healthcheck:`; k8s probes | Plus `GET /health/services` on the gateway = whole-system fan-out check |
| **Rate limiting** | `services/gateway/src/lib/rateLimiter.js` | Fixed-window counter per client IP (default 100 req/min) → HTTP 429. Hand-rolled so the mechanism is visible |
| **Circuit breaker** | `services/gateway/src/lib/circuitBreaker.js` | Hand-rolled CLOSED → OPEN → HALF_OPEN breaker per downstream service (5 failures opens; 15s cool-down; trial request to recover). Watch live: `GET /health/circuits` |

## Clean architecture / SOLID / service layer pattern

Each business service is layered, dependencies pointing inward only:

```
routes (HTTP)  →  controllers  →  services (business rules)  →  repositories (DB)
```

- **Single Responsibility**: each microservice owns one business capability;
  each layer has one reason to change.
- **Open/Closed**: add a new event consumer (e.g. a notifications service)
  without touching order-service — it just subscribes to existing events.
- **Dependency Inversion**: services depend on repository functions, never on
  SQL/SQLite directly (`auth/src/services/authService.js` knows nothing about
  the database engine).
- **Service layer pattern**: business rules live in `src/services/*.js`,
  reachable from HTTP controllers *and* from event handlers (see billing).

## Try the patterns by hand

```bash
# health of the whole system through one URL
curl http://localhost:8080/health/services

# login (auth-service), then use the token
TOKEN=$(curl -s -X POST http://localhost:8080/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@restaurant.local","password":"admin123"}' | python3 -c 'import sys,json;print(json.load(sys.stdin)["token"])')

# menu (public), then place an order (order-service → menu-service sync call)
curl http://localhost:8080/api/menu
curl -s -X POST http://localhost:8080/api/orders \
  -H 'Content-Type: application/json' \
  -d '{"table_number":1,"items":[{"menu_item_id":1,"quantity":2}]}'

# the EVENT did the work: billing-service created a bill on its own
curl -H "Authorization: Bearer $TOKEN" http://localhost:8080/api/bills/1

# centralized logs + distributed trace of one request
curl "http://localhost:8080/api/logs?limit=20"
curl "http://localhost:8080/api/logs?traceId=<id-from-any-response-header>"

# rate limiting: hammer it -> 429s appear
for i in $(seq 1 120); do curl -s -o /dev/null -w "%{http_code}\n" http://localhost:8080/api/menu; done | sort | uniq -c

# circuit breaker: kill a service, watch the breaker open after 5 failures
docker compose stop menu-service
for i in 1 2 3 4 5 6; do curl -s http://localhost:8080/api/menu; echo; done
curl http://localhost:8080/health/circuits        # menu-service: OPEN
docker compose start menu-service                  # ~15s later it self-heals

# load balancing: scale out and watch round-robin
docker compose up -d --scale menu-service=3
curl "http://localhost:8080/api/logs?service=menu-service&limit=10"
```

## Kubernetes

```bash
# with minikube
minikube start
eval $(minikube docker-env)
cd microservices
for s in auth menu order billing logging gateway registry; do
  docker build -t restaurant/$s:lab --build-arg SERVICE=$s .
done
kubectl apply -f k8s/
kubectl -n restaurant get pods          # watch readiness probes gate traffic
minikube service gateway -n restaurant  # opens http://<node>:30080
```

In k8s the custom registry isn't needed: Service objects + DNS provide
discovery and kube-proxy provides load balancing — the gateway switches to
that with `DISCOVERY_MODE=dns`. Knowing *why* the hand-rolled registry becomes
redundant in k8s is a good lab talking point.

## Honest limitations (also good viva answers)

- **Redis pub/sub is fire-and-forget** — if billing is down when an order is
  created, that event is lost. Production: durable queue/streams (RabbitMQ,
  Kafka, Redis Streams) with acknowledgements and retries.
- **SQLite per service** keeps the lab light; the *isolation* is what matters.
  Production: one Postgres/Mongo per service — swap inside the repository
  layer, nothing above it changes (that's the point of the layering).
- **Rate limiter and breaker state are per gateway replica** — production
  would share state via Redis.
- **k8s volumes are emptyDir** — pod restart loses data; use PVCs.
