#!/usr/bin/env bash

set -euo pipefail

# Heavy stress test against POST /api/orders/sync
# Usage: ./scripts/stress-orders-sync.sh <requests> <concurrency> [pages] [host]
#   requests: total number of HTTP requests to send (e.g., 10000)
#   concurrency: parallel workers (e.g., 100)
#   pages: payload pages value (default: 100)
#   host: base url (default: http://localhost:8080)

REQS=${1:-1000}
CONC=${2:-50}
PAGES=${3:-100}
HOST=${4:-http://localhost:8080}

echo "Sending $REQS requests with concurrency=$CONC to $HOST/api/orders/sync (pages=$PAGES)"

seq 1 "$REQS" | xargs -I{} -P "$CONC" bash -c '
  i=$RANDOM
  shop="stress-shop-$i"
  curl -sS -X POST "$0/api/orders/sync" \
    -H "Content-Type: application/json" \
    -d "{\"shopId\":\"$shop\",\"pages\":$1}" \
    >/dev/null || true
' "$HOST" "$PAGES"

echo "Done."


