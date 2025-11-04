#!/bin/bash

# Script to create Kafka topics for the ecommerce application
# Usage: bash scripts/create-kafka-topics.sh

KAFKA_BROKER=${KAFKA_BROKERS:-localhost:9092}

echo "Creating Kafka topics on $KAFKA_BROKER..."

topics=(
  "commerce.orders.sync.request.v1"
  "commerce.orders.page.request.v1"
  "commerce.orders.page.fetched.v1"
  "commerce.orders.normalized.v1"
  "commerce.orders.retry.v1"
  "commerce.orders.dlq.v1"
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

