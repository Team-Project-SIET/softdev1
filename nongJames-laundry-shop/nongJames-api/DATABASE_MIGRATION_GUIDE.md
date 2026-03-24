# Database Migration & Setup Guide

## Quick Start

### 1. Install Dependencies (Already Done)

```bash
cd nongJames-api
bun install
```

### 2. Setup Environment

Create `.env.local`:

```env
# Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/laundry_db

# SCB API
SCB_MERCHANT_ID=merchant_id_from_scb
SCB_API_KEY=api_key_from_scb
SCB_SECRET_KEY=secret_key_from_scb
SCB_API_URL=https://api-sandbox.scb.or.th
SCB_CHANNEL_ID=channel_id_from_scb

# LINE OA
LINE_CHANNEL_ID=channel_id_from_line
LINE_CHANNEL_SECRET=channel_secret_from_line
LINE_ACCESS_TOKEN=access_token_from_line

# JWT
JWT_SECRET=your_secret_key_here

# Server
NODE_ENV=development
PORT=3001
```

### 3. Create PostgreSQL Database

```bash
# Using psql
createdb laundry_db

# Or using Docker
docker run --name laundry-postgres \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=laundry_db \
  -p 5432:5432 \
  -d postgres:15-alpine
```

### 4. Generate and Apply Migrations

```bash
# Generate migration files from schema
bun drizzle-kit generate:pg

# Apply all migrations
bun drizzle-kit migrate

# Or push schema directly (dev only)
bun drizzle-kit push:pg
```

---

## Detailed Migration Process

### Step 1: Verify Schema Files

All schema files located in `src/db/schema/`:

```
src/db/schema/
├── auth.ts              # User authentication tables
├── orders.ts            # Order and order items
├── order-workflow.ts    # Order workflow history and events
├── transactions.ts      # SCB API transaction tracking
├── contracts.ts         # B2B contract management
├── payments.ts          # Payment processing
├── logistics.ts         # Driver and delivery tracking
├── services.ts          # Service catalog and pricing
├── finance.ts           # Invoices and financial reports
├── notifications.ts     # Notifications and LINE integration
└── index.ts             # Central export point
```

### Step 2: Verify drizzle.config.ts

Located at project root:

```typescript
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/db/schema',
  out: './drizzle/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
  migrations: {
    prefix: 'timestamp',
  },
});
```

### Step 3: Run Migration Generation

```bash
# This creates migration files in /drizzle/migrations
bun drizzle-kit generate:pg

# Output should show:
# ✓ Generated migration for schema changes
# ✓ Migrations generated at drizzle/migrations
```

### Step 4: Inspect Generated Migrations

Open `drizzle/migrations/` and verify:

- Migration file naming: `0001_<timestamp>_<description>.sql`
- Contains CREATE TABLE statements
- Indexes are created
- Foreign keys have proper constraints

Example migration structure:

```sql
-- 0001_<timestamp>_create_users.sql
CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email varchar(255) UNIQUE NOT NULL,
  password varchar(255) NOT NULL,
  role user_role NOT NULL DEFAULT 'CUSTOMER',
  ...
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_line_user_id ON users(line_user_id);
-- ... more tables and indexes
```

### Step 5: Apply Migrations

```bash
# Apply all pending migrations
bun drizzle-kit migrate

# Or programmatically in your app
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { db } from './db';

// On app startup
await migrate(db, { migrationsFolder: './drizzle/migrations' });
```

### Step 6: Verify Database

```bash
# Connect to PostgreSQL
psql -U postgres -d laundry_db

# List all tables
\dt

# Expected output should show:
# - users
# - orders
# - order_items
# - order_workflow_history
# - transactions
# - contracts
# - contract_line_items
# - contract_history
# - payments
# - payment_logs
# - drivers
# - delivery_assignments
# - driver_location_history
# - invoices
# - financial_reports
# - account_ledger
# - services
# - service_pricing_rules
# - notifications
# - line_users
# - notification_templates

# View table structure
\d users
\d orders
# etc.
```

---

## Migration Troubleshooting

### Issue: "database does not exist"

**Solution:**
```bash
createdb laundry_db
# Then retry migrations
bun drizzle-kit migrate
```

### Issue: "column does not exist" after migration

**Solution:**
```bash
# Check if migration was applied
bun drizzle-kit status

# If not applied, apply manually
bun drizzle-kit migrate

# Or reset dev database (CAUTION: deletes all data)
bun drizzle-kit drop
bun drizzle-kit migrate
```

### Issue: Foreign key constraint violation

**Solution:**
- Ensure migrations are applied in correct order
- Check that parent tables are created before child tables
- Verify all FK references point to existing tables

```sql
-- List all constraints
SELECT constraint_name, constraint_type
FROM information_schema.table_constraints
WHERE table_name IN ('orders', 'payments', 'transactions');
```

### Issue: Enum type conflicts

**Solution:**
```sql
-- Drop and recreate enum
DROP TYPE user_role;
DROP TYPE order_status;
-- Re-run migrations
bun drizzle-kit migrate
```

---

## Database Backup & Recovery

### Backup PostgreSQL Database

```bash
# Backup entire database
pg_dump -U postgres laundry_db > backup_$(date +%Y%m%d_%H%M%S).sql

# Backup specific table
pg_dump -U postgres -t users laundry_db > users_backup.sql

# Backup with custom format (compressed)
pg_dump -U postgres -F c laundry_db > backup.dump
```

### Restore from Backup

```bash
# From SQL file
psql -U postgres laundry_db < backup_20260324_120000.sql

# From custom format
pg_restore -U postgres -d laundry_db backup.dump
```

---

## Schema Versioning

### Tracking Migrations

Each migration file includes:

1. **Timestamp** - Ensures execution order
2. **Description** - Explains the change
3. **SQL Operations** - CREATE/ALTER/DROP statements

Example:
```
0001_1711234567890_initial_schema.sql
0002_1711245678901_add_contracts.sql
0003_1711256789012_add_indices.sql
```

### Schema Version Query

```sql
-- Check migration history
SELECT migration FROM drizzle_migrations ORDER BY executed_at;

-- Count tables
SELECT COUNT(*) FROM information_schema.tables 
WHERE table_schema = 'public';

-- Expected: 20 tables (as of v2.4)
```

---

## Development Workflow

### When Making Schema Changes

1. **Modify schema file** (e.g., `src/db/schema/orders.ts`)
2. **Generate migration**:
   ```bash
   bun drizzle-kit generate:pg
   ```
3. **Review migration** in `drizzle/migrations/`
4. **Apply migration**:
   ```bash
   bun drizzle-kit migrate
   ```
5. **Update services** if table structure changed
6. **Test** with sample data

### Creating Seed Data

Create `src/db/seeds.ts`:

```typescript
import { db } from './index';
import { users, orders, services } from './schema';

export async function seedDatabase() {
  // Create admin user
  await db.insert(users).values({
    email: 'admin@laundry.com',
    fullName: 'Admin User',
    role: 'ADMIN',
    isActive: true,
  });

  // Create sample services
  await db.insert(services).values([
    {
      name: 'Standard Wash',
      category: 'WASH',
      basePrice: 100,
      estimatedDays: 2,
    },
    {
      name: 'Dry Clean',
      category: 'DRY_CLEAN',
      basePrice: 200,
      estimatedDays: 3,
    },
  ]);

  console.log('✓ Database seeded successfully');
}

// Run in separate script:
// bun src/db/seeds.ts
```

---

## Production Deployment

### Pre-Deployment Checklist

- [ ] All migrations tested in development
- [ ] Database backup created
- [ ] `.env` secrets configured
- [ ] PostgreSQL version compatible (13+)
- [ ] Connection pooling configured
- [ ] Monitoring alerts set up

### Deployment Steps

```bash
# 1. Run migrations on production
NODE_ENV=production bun drizzle-kit migrate

# 2. Verify tables created
# psql -U postgres -d laundry_db -c "\dt"

# 3. Start application
bun run start

# 4. Monitor logs
tail -f application.log | grep -i error
```

### Connection Pooling (Recommended for Production)

Install connection pooler:

```bash
bun add pg-ipc
```

Configure in `src/db/index.ts`:

```typescript
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

export const db = drizzle(pool);
```

---

## Monitoring & Maintenance

### Regular Maintenance Tasks

```sql
-- 1. Vacuum and analyze (optimize)
VACUUM ANALYZE;

-- 2. Check table sizes
SELECT schemaname, tablename, 
       pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- 3. Check index usage
SELECT schemaname, tablename, indexname
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename;

-- 4. Unused indices
SELECT schemaname, tablename, indexname
FROM pg_indexes
WHERE schemaname = 'public'
AND indexname NOT IN (
  SELECT indexrelname FROM pg_stat_user_indexes
);

-- 5. Active connections
SELECT count(*) as active_connections FROM pg_stat_activity;
```

### Performance Monitoring

```sql
-- Slow queries (log must be enabled)
SELECT query, calls, mean_exec_time, max_exec_time
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;

-- Table row counts
SELECT tablename, n_live_tup as row_count
FROM pg_stat_user_tables
ORDER BY n_live_tup DESC;
```

---

## Common Database Queries

### User Management

```sql
-- List all admin users
SELECT id, email, role FROM users WHERE role = 'ADMIN';

-- Count users by role
SELECT role, COUNT(*) FROM users GROUP BY role;

-- Inactive users (not updated in 30 days)
SELECT email, updated_at FROM users 
WHERE updated_at < NOW() - INTERVAL '30 days';
```

### Order Analytics

```sql
-- Orders by status
SELECT status, COUNT(*) FROM orders GROUP BY status;

-- Revenue by date
SELECT DATE(received_at), SUM(total_amount) 
FROM orders GROUP BY DATE(received_at);

-- Average order value
SELECT AVG(total_amount) as avg_order_value FROM orders;

-- Orders by customer (top 10)
SELECT u.email, COUNT(o.id) as order_count, SUM(o.total_amount) as total
FROM orders o
JOIN users u ON o.customer_id = u.id
GROUP BY o.customer_id, u.email
ORDER BY order_count DESC
LIMIT 10;
```

### Financial Reports

```sql
-- Monthly revenue
SELECT DATE_TRUNC('month', received_at) as month, 
       SUM(total_amount) as revenue
FROM orders
WHERE status = 'COMPLETED'
GROUP BY DATE_TRUNC('month', received_at);

-- Payment method breakdown
SELECT payment_method, COUNT(*), SUM(amount)
FROM payments
WHERE status = 'COMPLETED'
GROUP BY payment_method;

-- Unpaid invoices
SELECT invoice_number, total_amount, due_date
FROM invoices
WHERE status IN ('ISSUED', 'OVERDUE')
ORDER BY due_date ASC;
```

### Logistics Analytics

```sql
-- Driver performance
SELECT u.full_name, d.total_deliveries, d.average_rating, d.success_rate
FROM drivers d
JOIN users u ON d.user_id = u.id
ORDER BY d.average_rating DESC;

-- Pending deliveries
SELECT o.order_number, da.status, u.full_name as driver
FROM delivery_assignments da
JOIN orders o ON da.order_id = o.id
LEFT JOIN users u ON da.driver_id = u.id
WHERE da.status IN ('ASSIGNED', 'ON_WAY_PICKUP', 'ON_WAY_DELIVERY');
```

---

## Next Steps After Migration

1. **Run Application**: `bun run dev`
2. **Test Database Connection**: Check logs for successful DB startup
3. **Create Test Data**: Use seeds.ts file
4. **Implement Service Layer**: Add business logic to services
5. **Setup API Endpoints**: Connect routes to controllers
6. **Enable Authentication**: Implement JWT middleware
7. **Test SCB Integration**: Use SCB sandbox environment

---

**Last Updated:** March 24, 2026  
**Drizzle ORM Version:** 0.28+  
**PostgreSQL Version:** 13+
