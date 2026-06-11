#!/usr/bin/env bash
# Scripted walk-through of every cloud pattern in the lab.
# Run AFTER: docker compose up --build   (from the microservices/ folder)
set -e
G=http://localhost:8080

step() { echo; echo "————— $1 —————"; }

step "1. Health checks: whole system through the gateway"
curl -s $G/health/services | python3 -m json.tool

step "2. Auth (auth-service via gateway)"
TOKEN=$(curl -s -X POST $G/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@restaurant.local","password":"admin123"}' \
  | python3 -c 'import sys,json;print(json.load(sys.stdin)["token"])')
echo "got JWT: ${TOKEN:0:25}..."

step "3. Menu (menu-service, public route)"
curl -s $G/api/menu | python3 -m json.tool | head -20

step "4. Place an order (order-service -> menu-service sync call + event published)"
ORDER=$(curl -s -X POST $G/api/orders \
  -H 'Content-Type: application/json' \
  -d '{"table_number":1,"items":[{"menu_item_id":1,"quantity":2},{"menu_item_id":5,"quantity":1}]}')
echo "$ORDER" | python3 -m json.tool
ORDER_ID=$(echo "$ORDER" | python3 -c 'import sys,json;print(json.load(sys.stdin)["order"]["id"])')

step "5. Event-driven: billing-service created a bill BY ITSELF from the event"
sleep 1
curl -s -H "Authorization: Bearer $TOKEN" $G/api/bills/$ORDER_ID | python3 -m json.tool

step "6. Protected route without token -> 401 (edge auth at the gateway)"
curl -s -o /dev/null -w "GET /api/bills without token -> HTTP %{http_code}\n" $G/api/bills

step "7. Centralized logging + distributed tracing"
TRACE=$(curl -s -i $G/api/menu | grep -i x-trace-id | tr -d '\r' | awk '{print $2}')
echo "this request's trace id: $TRACE"
sleep 1
curl -s "$G/api/logs?traceId=$TRACE" | python3 -m json.tool

step "8. Rate limiting: 120 rapid requests (limit 100/min) -> some 429s"
for i in $(seq 1 120); do curl -s -o /dev/null -w "%{http_code}\n" $G/api/menu; done | sort | uniq -c

step "9. Circuit breaker states"
curl -s $G/health/circuits | python3 -m json.tool
echo
echo "Try yourself: docker compose stop menu-service; curl $G/api/menu x6; curl $G/health/circuits"
echo "Demo complete ✔"
