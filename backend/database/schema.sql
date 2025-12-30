-- =====================================================
-- CORE TENANT & USER TABLES
-- =====================================================

CREATE TABLE tenants (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE users (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  role TEXT NOT NULL CHECK (role IN ('viewer', 'operator', 'admin')),
  created_at TIMESTAMP DEFAULT now()
);

-- =====================================================
-- MACHINES
-- =====================================================

CREATE TABLE machines (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  label TEXT,
  created_at TIMESTAMP DEFAULT now()
);

-- =====================================================
-- RAW TELEMETRY (IMMUTABLE)
-- =====================================================

CREATE TABLE telemetry_raw (
  id UUID PRIMARY KEY,
  machine_id UUID NOT NULL REFERENCES machines(id),
  timestamp TIMESTAMP NOT NULL,
  metric_type TEXT NOT NULL,
  metric_value NUMERIC NOT NULL,
  source TEXT NOT NULL CHECK (source IN ('DEVICE', 'EXCEL')),
  received_at TIMESTAMP DEFAULT now()
);

-- IMPORTANT:
-- - Rows in this table are NEVER updated
-- - Rows in this table are NEVER deleted
-- - This table represents ground truth

-- =====================================================
-- ADMIN OVERRIDES (MUTABLE, AUDITED)
-- =====================================================

CREATE TABLE telemetry_overrides (
  id UUID PRIMARY KEY,
  telemetry_id UUID NOT NULL REFERENCES telemetry_raw(id),
  overridden_value NUMERIC NOT NULL,
  reason TEXT NOT NULL,
  overridden_by UUID NOT NULL REFERENCES users(id),
  overridden_at TIMESTAMP DEFAULT now()
);

-- IMPORTANT:
-- - Overrides never modify telemetry_raw
-- - Latest override wins
-- - Reason is mandatory

-- =====================================================
-- EXCEL IMPORT BATCHES (HISTORICAL)
-- =====================================================

CREATE TABLE import_batches (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  uploaded_by UUID NOT NULL REFERENCES users(id),
  uploaded_at TIMESTAMP DEFAULT now(),
  status TEXT NOT NULL
);

-- =====================================================
-- END OF SCHEMA
-- =====================================================
