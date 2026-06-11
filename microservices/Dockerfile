# Containerization (lab requirement: "Containerization with Docker").
#
# ONE parameterized Dockerfile builds every service: pass the service folder
# name as a build arg (docker-compose does this for you). Each image contains
# only that service's code + the shared/ libs — services ship independently.
FROM node:20-bookworm-slim

ARG SERVICE
WORKDIR /app

# shared cross-cutting libs (logging, discovery, tracing, events, sqlite)
COPY shared ./shared

# install this service's dependencies at /app so BOTH the service code and
# the shared/ libs can resolve them (Node walks up from the requiring file)
COPY services/${SERVICE}/package*.json ./
RUN npm install --omit=dev

# then the service's source
COPY services/${SERVICE}/src ./services/${SERVICE}/src

ENV NODE_ENV=production
ENV SERVICE_DIR=services/${SERVICE}
CMD ["sh", "-c", "node ${SERVICE_DIR}/src/server.js"]
