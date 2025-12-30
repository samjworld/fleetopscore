
import client from 'prom-client';

// Create a Registry
export const register = new client.Registry();

// Add a default label which is added to all metrics
register.setDefaultLabels({
  app: 'fleetops-backend'
});

// Enable the collection of default metrics
client.collectDefaultMetrics({ register });

// Custom Metrics
export const httpRequestDurationMicroseconds = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'code'],
  buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10]
});

export const dbPoolSize = new client.Gauge({
  name: 'db_pool_size',
  help: 'Number of total connections in the pool'
});

export const connectedDevices = new client.Gauge({
  name: 'connected_devices_total',
  help: 'Total number of active devices sending telemetry'
});

register.registerMetric(httpRequestDurationMicroseconds);
register.registerMetric(dbPoolSize);
register.registerMetric(connectedDevices);
