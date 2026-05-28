# Setup Guide

## Prerequisites

- Node.js 18+
- npm

## Local development

```bash
# Install
cd backend && npm install
cd ../frontend && npm install

# Configure
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# Seed
cd backend && npm run seed

# Run (two terminals)
cd backend && npm run dev
cd frontend && npm run dev
```

The frontend (Vite) proxies `/api` and `/socket.io` to `http://localhost:5000`, so it works out of the box.

## Production build

```bash
cd frontend && npm run build
# Static assets land in frontend/dist — serve via any static host
# or copy to backend/public and serve from Express
```

For a single-box deploy, run the backend with `pm2` or `systemd` and serve the frontend `dist/` from nginx (or behind the same Express server with a small static-mount addition).

## Environment variables

### Backend (`backend/.env`)

| Key            | Default                       | Notes |
|----------------|-------------------------------|-------|
| `PORT`         | `5000`                        | API + Socket.io port |
| `JWT_SECRET`   | `change-me`                   | **Change this for production!** |
| `JWT_EXPIRES_IN` | `7d`                        | JWT lifetime |
| `DATABASE_PATH`| `./database.sqlite`           | Relative to backend dir |
| `CORS_ORIGIN`  | `http://localhost:3000`       | Frontend origin |
| `TAX_RATE`     | `0.13`                        | Bill tax rate |

### Frontend (`frontend/.env`)

| Key                | Default                  |
|--------------------|--------------------------|
| `VITE_API_URL`     | `http://localhost:5000`  |
| `VITE_SOCKET_URL`  | `http://localhost:5000`  |

## QR codes

Admin → Tables → click **QR** on a table → download the PNG → print and place at the table.

The QR URL is built from `window.location.origin` (e.g. `http://192.168.1.10:3000/menu/table/1`). On a LAN, set the origin to your machine's LAN IP so phones can reach it.

## Backup

The database is a single file: `backend/database.sqlite`. Copy it for backups.

## Reset

```bash
rm backend/database.sqlite
cd backend && npm run seed
```
