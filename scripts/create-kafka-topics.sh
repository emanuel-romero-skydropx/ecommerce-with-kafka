#!/bin/bash

# Script to create Kafka topics for the ecommerce application
# Usage: bash scripts/create-kafka-topics.sh

KAFKA_BROKER=${KAFKA_BROKERS:-localhost:9092}

echo "Creating Kafka topics on $KAFKA_BROKER..."

topics=(
  "orders.sync.requested"
  "orders.sync.page.requested"
  "orders.sync.page.processed"
  "orders.sync.completed"
  "orders.sync.page.retry"
  "orders.sync.page.dlq"
)

for topic in "${topics[@]}"; do
  echo "Creating topic: $topic"
  docker exec ecommerce-with-kafka-kafka-1 /opt/kafka/bin/kafka-topics.sh \
    --bootstrap-server localhost:9092 \
    --create \
    --if-not-exists \
    --topic "$topic" \
    --partitions 1 \
    --replication-factor 1
done

echo "Done! Listing all topics:"
docker exec ecommerce-with-kafka-kafka-1 /opt/kafka/bin/kafka-topics.sh \
  --bootstrap-server localhost:9092 \
  --list

