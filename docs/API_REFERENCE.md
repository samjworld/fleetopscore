
# FleetOps API Reference v1

Base URL: `http://<host>:3001/api/v1`

## Authentication
All endpoints require a Bearer Token.
`Authorization: Bearer <jwt_token>`

## Fleet Management

### List Vehicles
`GET /fleet/vehicles`

**Params:**
- `page`: number (default 1)
- `limit`: number (default 20)
- `status`: 'active' | 'maintenance' | 'offline' | 'All'
- `search`: string (VIN or Name)

**Response:**
```json
{
  "data": [
    {
      "id": "v-123",
      "name": "Excavator X1",
      "status": "active",
      "lastLat": 34.0522,
      "lastLng": -118.2437
    }
  ],
  "meta": {
    "page": 1,
    "total": 50,
    "totalPages": 3
  }
}
```

### Provision Vehicle
`POST /fleet/vehicles`

**Body:**
```json
{
  "name": "Dozer D9",
  "vin": "CATD9X001",
  "make": "Caterpillar",
  "model": "D9",
  "year": 2023
}
```

## Analytics

### Telemetry History
`GET /analytics/telemetry/:vehicleId`

**Params:**
- `start`: ISO Date
- `end`: ISO Date

**Response:**
```json
{
  "data": [
    { "timestamp": "2023-10-01T10:00:00Z", "lat": 34.05, "lng": -118.24, "speed": 45 }
  ]
}
```

## Alerts

### List Alerts
`GET /alerts`

**Response:**
```json
{
  "data": [
    {
      "id": "a-1",
      "type": "overspeed",
      "severity": "high",
      "message": "Speed 120km/h",
      "status": "new"
    }
  ]
}
```

### Resolve Alert
`PATCH /alerts/:id/status`

**Body:**
```json
{ "status": "resolved" }
```
