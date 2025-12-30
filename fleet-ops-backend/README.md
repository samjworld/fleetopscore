
# FleetOps Backend (Phase 4)

Production-ready, event-driven backend for high-volume fleet telemetry.

## Architecture

1. **Ingestion Service (8081)**: Accepts raw telemetry via HTTP, validates HMAC, pushes to Kafka.
2. **Telemetry Processor**: Consumes Kafka stream, writes to TimescaleDB (History) and Postgres (State).
3. **API Service (8080)**: Read-only REST API for dashboards.

## Prerequisites

- Java 21 (Temurin or OpenJDK)
- Docker & Docker Compose

## Quick Start

1. **Start Infrastructure**:
   ```bash
   cd infra
   docker-compose up -d
   ```

2. **Build All Modules**:
   ```bash
   ./mvnw clean package -DskipTests
   ```

3. **Run Services** (In separate terminals):
   ```bash
   # Ingestion
   java -jar ingestion-service/target/ingestion-service-1.0.0-SNAPSHOT.jar
   
   # Processor
   java -jar telemetry-processor/target/telemetry-processor-1.0.0-SNAPSHOT.jar
   
   # API
   java -jar api-service/target/api-service-1.0.0-SNAPSHOT.jar
   ```

## Testing Telemetry

Send a mock heartbeat:

```bash
curl -X POST http://localhost:8081/ingest/v1/telemetry \
  -H "Content-Type: application/json" \
  -H "X-Device-ID: 550e8400-e29b-41d4-a716-446655440000" \
  -H "X-Tenant-ID: 999e8400-e29b-41d4-a716-446655449999" \
  -H "X-Signature: mock-sig" \
  -d '{
    "lat": 34.0522,
    "lng": -118.2437,
    "speed": 65,
    "fuelLevel": 88
  }'
```

Check state:

```bash
curl http://localhost:8080/api/v1/vehicles \
  -H "X-Tenant-ID: 999e8400-e29b-41d4-a716-446655449999"
```
