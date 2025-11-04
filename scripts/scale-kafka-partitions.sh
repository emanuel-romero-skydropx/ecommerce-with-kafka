#!/usr/bin/env bash

set -euo pipefail

# Scale partitions for given Kafka topics running under docker compose
# Usage:
#   bash scripts/scale-kafka-partitions.sh <partitions> [topic1 topic2 ...]
#
# If no topics are provided, defaults to high-throughput topics for this POC:
#   - orders.sync.page.requested
#   - orders.sync.page.processed

if [[ ${1:-} == "" ]]; then
  echo "Usage: $0 <partitions> [topic1 topic2 ...]"
  exit 1
fi

PARTITIONS="$1"
shift || true

TOPICS=("$@")
if [[ ${#TOPICS[@]} -eq 0 ]]; then
  TOPICS=(
    "orders.sync.page.requested"
    "orders.sync.page.processed"
  )
fi

# Try to resolve the kafka container from compose; fallback to the default name
KAFKA_CONTAINER=$(docker compose ps -q kafka 2>/dev/null || true)
if [[ -z "${KAFKA_CONTAINER}" ]]; then
  KAFKA_CONTAINER="ecommerce-with-kafka-kafka-1"
fi

echo "Scaling topics to ${PARTITIONS} partitions using container: ${KAFKA_CONTAINER}"

for topic in "${TOPICS[@]}"; do
  echo "Altering topic: ${topic} -> partitions=${PARTITIONS}"
  docker exec "${KAFKA_CONTAINER}" /opt/kafka/bin/kafka-topics.sh \
    --bootstrap-server localhost:9092 \
    --alter \
    --topic "${topic}" \
    --partitions "${PARTITIONS}"
done

echo "Describe topics after alter:"
for topic in "${TOPICS[@]}"; do
  docker exec "${KAFKA_CONTAINER}" /opt/kafka/bin/kafka-topics.sh \
    --bootstrap-server localhost:9092 \
    --describe \
    --topic "${topic}"
done

echo "Done. Note: Increasing partitions can change key->partition mapping for future messages. Plan changes when queues are low if strict ordering per key is required."


