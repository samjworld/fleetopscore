
# FleetOps Deployment & Operations Strategy

## 1. Environment Strategy

We utilize a 3-tier environment structure to ensure stability and reliability.

| Environment | Purpose | Infrastructure | Deployment Trigger |
|-------------|---------|----------------|--------------------|
| **Local**   | Development & Unit Testing | Docker Compose | Manual (`npm run dev`) |
| **Staging** | Integration Testing & QA | Kubernetes (Namespace: `staging`) | Auto-deploy on push to `main` |
| **Production** | Live User Traffic | Kubernetes (Namespace: `prod`) | Manual Approval / Tag Release |

## 2. CI/CD Pipeline

We use GitHub Actions for our pipeline (`.github/workflows/ci-cd.yml`).

1.  **Code Analysis**: Runs ESLint and Prettier to enforce code style.
2.  **Test**: Runs Unit and Integration tests (Jest).
3.  **Build**: Creates optimized Docker images (Multi-stage builds).
4.  **Publish**: Pushes images to ECR/GCR with tags (`:latest`, `:sha`, `:semver`).
5.  **Deploy**: Updates Kubernetes manifests via `kubectl` or Helm.

## 3. Database Management

*   **Engine**: PostgreSQL 15 + TimescaleDB extension for telemetry time-series optimization.
*   **Migrations**: 
    *   Currently using startup SQL execution for simplicity.
    *   **Future Upgrade**: Implement `flyway` or `node-pg-migrate` in the CI pipeline to run migrations *before* app deployment.
*   **Backups**: 
    *   Daily full snapshots (WAL archiving).
    *   Point-in-time recovery enabled.

## 4. Observability & Monitoring

*   **Metrics**: Prometheus scrapes the `/metrics` endpoint exposed by the backend.
    *   *Key Metrics*: HTTP Response Time, Error Rate, Active Device Connections, DB Pool Utilization.
    *   *Dashboards*: Grafana.
*   **Logging**: 
    *   Structured JSON logging via `winston`.
    *   Aggregated via Fluentbit/Fluentd -> Elasticsearch/Loki.
*   **Health Checks**:
    *   `livenessProbe`: `/health/liveness` - Restarts pod if app deadlocks.
    *   `readinessProbe`: `/health/readiness` - Removes pod from LoadBalancer if DB is unreachable.

## 5. Disaster Recovery (DR)

*   **RPO (Recovery Point Objective)**: < 15 minutes (Max data loss).
*   **RTO (Recovery Time Objective)**: < 1 hour (Time to restore).
*   **Strategy**:
    1.  Infrastructure as Code (Terraform) to rebuild K8s cluster.
    2.  Database restored from cross-region replica or S3 snapshot.
    3.  DNS failover via Cloudflare/Route53.
