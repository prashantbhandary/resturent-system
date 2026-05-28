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

- Backend: Node.js + Express + Socket.io + SQLite3
- Frontend: React 18 + Vite + TailwindCSS + React Router
- Auth: JWT + bcrypt

## Quick Start (Docker — recommended)

One command runs the whole stack:

```bash
docker compose up --build
```

That builds both images, seeds the database on first start, and serves:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5001 (host port 5001 → container port 5000; remapped because macOS Control Center grabs 5000)

Override the host port with `BACKEND_PORT=5002 docker compose up`. Database persists in the `backend_data` named volume; reset with `docker compose down -v`.

Reseed without recreating containers:
```bash
docker compose exec backend sh -c "rm -f /data/database.sqlite && node src/utils/seed.js"
docker compose restart backend
```

## Quick Start (local without Docker)

### 1. Install dependencies

```bash
cd backend && npm install
cd ../frontend && npm install
```

### 2. Configure environment

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

Update the `JWT_SECRET` in `backend/.env` for security.

### 3. Seed initial data (creates tables, menu, demo users)

```bash
cd backend && npm run seed
```

### 4. Run

```bash
# Terminal 1
cd backend && npm run dev

# Terminal 2
cd frontend && npm run dev
```

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
backend/
  src/
    config/        env + sqlite setup + schema init
    models/        data access for users, tables, menu, orders, bills
    controllers/   route handlers
    routes/        Express routers
    services/      auth, order, billing business logic
    middleware/    auth, error handler, validation
    socket/        Socket.io event handlers
    utils/         jwt, logger, seed, validators
frontend/
  src/
    components/    common, menu, kitchen, billing, admin
    pages/         top-level routes
    context/       Auth, Cart, Socket providers
    services/      api, socket, storage
    styles/        tailwind base
```

See [SETUP.md](SETUP.md) for production deployment guidance.
