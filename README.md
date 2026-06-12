# Restaurant QR Ordering System

A complete local-first restaurant ordering platform: customers scan QR codes, chefs see real-time orders, billing staff process payments, and admins manage the menu — all on one machine.

## Features

- **Customer Menu** — QR-linked menu page at `/menu/table/:id` with cart and order tracking
- **Kitchen Display (KDS)** — real-time order board with item-level status, color coded by age
- **Billing** — bill generation, cash/card payment, printable receipt
- **Admin Dashboard** — menu/category/table/staff management, sales reports, QR code generation
- **Real-time** — Socket.io broadcasts order, kitchen, and billing events to all connected clients
- **Auth** — JWT-based login with roles (admin, chef, billing, waiter)

## Stack

- Backend: Node.js microservices (gateway, auth, menu, order, billing, logging, registry) + Redis event bus, one SQLite database per data-owning service
- Frontend: React 18 + Vite + TailwindCSS + React Router
- Auth: JWT + bcrypt

## Quick Start (Docker — recommended)

Two commands run the whole stack:

```bash
# Terminal 1 — the API: all microservices behind the gateway
docker compose -f microservices/docker-compose.yml up --build

# Terminal 2 — the frontend
docker compose up --build
```

That serves:
- Frontend: http://localhost:3000
- API gateway: http://localhost:8080 (routes `/api/*` to the auth/menu/order/billing services)

Each data-owning service keeps its own SQLite database under `microservices/data/<service>/`; data persists across restarts. See [microservices/README.md](microservices/README.md) for service-level details, the scaling demo, and k8s manifests.

Open:
- Customer: http://localhost:3000/menu/table/1
- Staff login: http://localhost:3000/login
- Kitchen: http://localhost:3000/kitchen
- Billing: http://localhost:3000/billing
- Admin: http://localhost:3000/admin

### Demo Accounts

| Role     | Email                       | Password    |
|----------|-----------------------------|-------------|
| admin    | admin@restaurant.local      | admin123    |
| chef     | chef@restaurant.local       | chef123     |
| billing  | billing@restaurant.local    | billing123  |
| waiter   | waiter@restaurant.local     | waiter123   |

## Testing the Workflow

Open three browser windows:

1. **Customer** — http://localhost:3000/menu/table/1 — add items, place order
2. **Kitchen** — log in as chef → accept order → mark items preparing → ready
3. **Billing** — log in as billing → pending bill appears after "Request Bill" → process payment → receipt prints

## API Reference

| Method | Path                                                | Purpose |
|--------|-----------------------------------------------------|---------|
| POST   | `/api/auth/login`                                   | Login |
| GET    | `/api/auth/me`                                      | Current user |
| GET    | `/api/menu`                                         | Menu grouped by category |
| POST   | `/api/orders`                                       | Create order |
| GET    | `/api/orders/table/:id`                             | Orders for a table |
| GET    | `/api/kitchen/orders`                               | Active orders |
| PATCH  | `/api/kitchen/orders/:id/status`                    | Update order status |
| PATCH  | `/api/kitchen/orders/:id/items/:itemId/status`      | Update item status |
| POST   | `/api/billing/request-bill/:orderId`                | Generate bill |
| GET    | `/api/billing/pending`                              | Pending bills |
| POST   | `/api/billing/:billId/payment`                      | Process payment |
| GET    | `/api/billing/:billId/receipt`                      | Get receipt |
| GET    | `/api/admin/dashboard`                              | Dashboard stats |
| GET    | `/api/admin/tables/:id/qr-code`                     | Generate QR code |

## Real-time Events (Socket.io)

- `order:created`, `order:status-changed`, `order:item-status`
- `bill:generated`, `bill:paid`
- `kitchen:new-order`

## Project Layout

```
microservices/
  services/
    gateway/       single entry point: routes /api/* + Socket.io to services
    auth/          login, JWT, users (own SQLite db)
    menu/          categories + items (own SQLite db)
    order/         orders + kitchen flow (own SQLite db)
    billing/       bills, payments, receipts (own SQLite db)
    logging/       central event log fed by the Redis bus
    registry/      service discovery for gateway load balancing
  shared/          code shared by all services
  k8s/             Kubernetes manifests
frontend/
  src/
    components/    common, menu, kitchen, billing, admin
    pages/         top-level routes
    context/       Auth, Cart, Socket providers
    services/      api, socket, storage
    styles/        tailwind base
```

See [SETUP.md](SETUP.md) for production deployment guidance.
