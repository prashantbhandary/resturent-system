FROM node:20-bookworm-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
      python3 make g++ \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 5000

# Server runs migrations on boot, then serves. Production is configured via the
# first-boot provisioning wizard — no demo accounts are seeded. For a local demo
# with sample data, run `npm run seed` against the container instead.
CMD ["node", "src/server.js"]
