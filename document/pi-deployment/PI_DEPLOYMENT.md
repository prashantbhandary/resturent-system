# Raspberry Pi Deployment Guide

Run the restaurant system as a single-box LAN appliance: one Node process on the
Pi serves both the API and the built frontend on port `5000`. Customer phones,
the kitchen display, and billing devices all reach it over the local network at
`http://restaurant.local:5000` (or the Pi's IP). No cloud, no internet required.

This guide leaves the cloud config (`render.yaml`, Dockerfile) in place but
unused. Follow the steps in order.

---

## 0. Hardware / OS

- Raspberry Pi 4 (2GB+) or Pi 5, on the same LAN as the devices.
- Raspberry Pi OS (64-bit, Bookworm). `uname -m` should report `aarch64`.
- A static or DHCP-reserved IP for the Pi so the address is stable.

---

## 1. One code change: let the backend serve the frontend

Right now `backend/src/server.js` only serves `/api/*` and then 404s — it does
**not** serve the frontend build. Add static serving + SPA fallback.

In `backend/src/server.js`, **after** all the `app.use('/api/...', ...)` route
registrations and **before** `app.use(notFound)`, insert:

```js
const path = require('path');

// Serve the built frontend (single-box LAN appliance: one origin, one port).
const distPath = path.join(__dirname, '..', '..', 'frontend', 'dist');
app.use(express.static(distPath));
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) return next();   // let 404 handler catch bad API routes
  res.sendFile(path.join(distPath, 'index.html'));  // SPA fallback
});
```

`require('path')` may already be imported at the top — if so, drop the duplicate.

---

## 2. Build the frontend for same-origin

The frontend already falls back to same-origin when `VITE_API_URL` is empty
(`baseURL || ''` in `frontend/src/services/api.js`). So point it at nothing.

Create `frontend/.env.production`:

```
VITE_API_URL=
VITE_SOCKET_URL=
```

(Empty values → the browser talks to whatever host served the page, i.e. the Pi.)

---

## 3. Backend environment

Create `backend/.env` on the Pi:

```
PORT=5000
NODE_ENV=production
JWT_SECRET=<paste a long random string>
JWT_EXPIRES_IN=7d
DATABASE_PATH=/home/pi/restaurant/data/database.sqlite
CORS_ORIGIN=*
TAX_RATE=0.13
```

Notes:
- **`DATABASE_PATH`** must be a persistent path (NOT `/tmp` like the cloud
  config). Create the dir: `mkdir -p /home/pi/restaurant/data`.
- **`CORS_ORIGIN=*`** is correct for a LAN appliance — devices hit the box via
  many origins (IP, `restaurant.local`). The server already handles `*` by
  reflecting the request origin (see the comment in `server.js`).
- Generate the secret: `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`

---

## 4. Install Node + build tools on the Pi

`sqlite3` is a native module and compiles on first install, so build tools are
required.

```bash
# Node 20 LTS (NodeSource) — Raspberry Pi OS default node is often too old
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs build-essential python3
node -v   # should be v20.x
```

---

## 5. Get the code onto the Pi and build

```bash
# clone or copy the repo to /home/pi/restaurant/app
cd /home/pi/restaurant/app

# backend deps (compiles sqlite3 — takes a few minutes on a Pi)
cd backend && npm install && cd ..

# frontend deps + production build
cd frontend && npm install && npm run build && cd ..
```

The build lands in `frontend/dist`, which step 1 told the backend to serve.

First boot: the server runs DB migrations automatically. There are **no demo
accounts** — the app uses a first-boot provisioning wizard (see
`backend/src/routes/provisioning.js`). Open the site and complete it to create
the owner account. For sample data instead, run `npm run seed` in `backend/`.

---

## 6. Auto-start on boot with systemd

Create `/etc/systemd/system/restaurant.service`:

```ini
[Unit]
Description=Restaurant ordering system
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=pi
WorkingDirectory=/home/pi/restaurant/app/backend
ExecStart=/usr/bin/node src/server.js
Restart=always
RestartSec=5
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

Enable and start:

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now restaurant
sudo systemctl status restaurant      # confirm it's running
journalctl -u restaurant -f           # live logs
```

After a code update: `git pull`, rebuild the frontend (step 5), then
`sudo systemctl restart restaurant`.

---

## 7. Reach it by name: mDNS (optional but nice)

So devices can use `http://restaurant.local:5000` instead of the raw IP:

```bash
sudo apt install -y avahi-daemon
sudo hostnamectl set-hostname restaurant
sudo systemctl restart avahi-daemon
```

Now `restaurant.local` resolves on the LAN (iOS/macOS/Android all support mDNS;
most Windows do via Bonjour).

To drop the `:5000` and serve on port 80, either set `PORT=80` and grant node
the privileged-port capability
(`sudo setcap 'cap_net_bind_service=+ep' $(which node)`), or front it with nginx.

---

## 8. Verify

From another device on the same Wi-Fi:

```
http://restaurant.local:5000/api/health   → {"ok":true,...}
http://restaurant.local:5000/             → the app loads
```

Check that socket.io live updates work (place an order on a phone, watch the
kitchen display update in real time).

---

## What about the cloud files?

- `render.yaml` and `backend/Dockerfile` are now unused — leave them or delete
  them. They don't affect the Pi deployment.
- The Pi runs entirely offline; nothing phones home.

## Backups

The whole database is one file. Back it up with a cron job:

```bash
# nightly copy of the SQLite DB (WAL-safe via the .backup command)
0 3 * * *  sqlite3 /home/pi/restaurant/data/database.sqlite ".backup '/home/pi/restaurant/backups/db-$(date +\%F).sqlite'"
```
