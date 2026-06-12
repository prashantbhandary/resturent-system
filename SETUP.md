# Setup Guide

## Prerequisites

- Docker (for the microservices API)
- Node.js 18+ and npm (for frontend dev)

## Local development

```bash
# Terminal 1 — the API: all microservices behind the gateway (port 8080)
docker compose -f microservices/docker-compose.yml up --build

# Terminal 2 — the frontend dev server (port 3000)
cd frontend && npm install
cp .env.example .env
npm run dev
```

Point the frontend at the gateway in `frontend/.env`:

```
VITE_API_URL=http://localhost:8080
VITE_SOCKET_URL=http://localhost:8080
```

(Or run the frontend in Docker too: `docker compose up --build` at the repo root — it is pre-configured for the gateway.)

## Production build

```bash
cd frontend && npm run build
# Static assets land in frontend/dist — serve via any static host
```

For a single-box deploy, run the microservices with `docker compose -f microservices/docker-compose.yml up -d` and serve the frontend `dist/` from nginx pointing API traffic at the gateway on port 8080. Kubernetes manifests live in `microservices/k8s/`.

## Environment variables

### Microservices

Service configuration lives in `microservices/docker-compose.yml`. The notable ones:

| Key            | Default                  | Notes |
|----------------|--------------------------|-------|
| `JWT_SECRET`   | `lab-secret-change-me`   | **Change this for production!** (auth-service) |
| `REDIS_URL`    | `redis://redis:6379`     | Event bus + log channel |
| `REGISTRY_URL` | `http://registry:4000`   | Service discovery |
| `DATA_DIR`     | `/data`                  | SQLite location inside each container |
| `TAX_RATE`     | `0.13`                   | Bill tax rate (billing-service) |

### Frontend (`frontend/.env`)

| Key                | Default                  |
|--------------------|--------------------------|
| `VITE_API_URL`     | `http://localhost:8080`  |
| `VITE_SOCKET_URL`  | `http://localhost:8080`  |

## QR codes

Admin → Tables → click **QR** on a table → download the PNG → print and place at the table.

The QR URL is built from `window.location.origin` (e.g. `http://192.168.1.10:3000/menu/table/1`). On a LAN, set the origin to your machine's LAN IP so phones can reach it.

## Backup

Each data-owning service keeps its own SQLite file, bind-mounted under `microservices/data/<service>/`. Copy that directory for backups.

## Reset

```bash
docker compose -f microservices/docker-compose.yml down
rm -rf microservices/data
docker compose -f microservices/docker-compose.yml up
```

Services recreate and reseed their databases on first start.
