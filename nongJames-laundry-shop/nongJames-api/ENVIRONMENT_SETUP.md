# Environment Configuration Guide

## Quick Start

### 1. Create `.env` File

Create `.env` file in the root of `nongJames-api` folder:

```bash
# Server
NODE_ENV=development
PORT=3000

# Database (PostgreSQL)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=nongjames_laundry
DB_USER=postgres
DB_PASSWORD=your_db_password

# JWT Secret (use strong random string in production)
JWT_SECRET=your_super_secret_jwt_key_at_least_32_characters_long

# CORS Configuration
CORS_ORIGIN=http://localhost:3000,http://localhost:3001,http://localhost:5173

# SCB Payment API (Sandbox for development)
SCB_API_URL=https://api.sandbox.scb.example.com
SCB_API_KEY=your_scb_api_key
SCB_SECRET_KEY=your_scb_secret_key
SCB_MERCHANT_ID=your_scb_merchant_id

# LINE Official Account
LINE_CHANNEL_ID=your_line_channel_id
LINE_CHANNEL_SECRET=your_line_channel_secret
LINE_ACCESS_TOKEN=your_line_access_token
```

---

## Getting API Credentials

### PostgreSQL Database Setup

**Option 1: Local PostgreSQL**

```bash
# Windows
# 1. Download from: https://www.postgresql.org/download/windows/
# 2. Install with default settings
# 3. Create database:

psql -U postgres
CREATE DATABASE nongjames_laundry;
\q
```

**Option 2: Docker**

```bash
# Run PostgreSQL in Docker
docker run --name nongjames-postgres \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=nongjames_laundry \
  -p 5432:5432 \
  -d postgres:15

# Verify connection
psql -U postgres -h localhost -d nongjames_laundry
```

### Run Database Migrations

```bash
# Generate migrations (if using Drizzle)
bun run drizzle-kit generate:pg

# Apply migrations
bun run drizzle-kit push:pg

# Check schema
bun run drizzle-kit studio  # Open Drizzle Studio
```

---

### SCB Payment API

1. **Register at SCB Developer Portal**
   - Go to: https://www.scb-developer.com/
   - Create account with business email
   - Create app/project

2. **Get Sandbox Credentials**
   - Navigate to: Apps → Your App → Credentials
   - Copy:
     - `Consumer Key` → SCB_API_KEY
     - `Consumer Secret` → SCB_SECRET_KEY
   - Get Merchant ID from: Sandbox Settings

3. **Test Sandbox**
   ```bash
   # Example payment request (replace with real values)
   curl -X POST https://api.sandbox.scb.example.com/payment/request \
     -H "Content-Type: application/json" \
     -H "X-API-Key: YOUR_API_KEY" \
     -d '{
       "merchantId": "MERCHANT_ID",
       "orderId": "ORDER-123",
       "amount": 50000,
       "description": "Test payment"
     }'
   ```

4. **Update `.env`**
   ```env
   SCB_API_URL=https://api.sandbox.scb.example.com
   SCB_API_KEY=your_consumer_key
   SCB_SECRET_KEY=your_consumer_secret
   SCB_MERCHANT_ID=your_merchant_id
   ```

---

### LINE Channel Setup

1. **Create LINE Developer Account**
   - Go to: https://developers.line.biz/
   - Sign in with LINE account
   - Create provider → Create channel

2. **Get Channel Credentials**
   - Go to: Your Channel → Basic Settings
   - Copy:
     - `Channel ID` → LINE_CHANNEL_ID
     - `Channel Secret` → LINE_CHANNEL_SECRET
   - Go to: Messaging API → Access Token
   - Generate long-lived token → LINE_ACCESS_TOKEN

3. **Configure Webhook URL**
   - Messaging API → Webhook URL
   - Set to: `https://your-domain.com/webhooks/line/events`
   - Enable webhook

4. **Test LINE Integration**
   ```bash
   # Send test message (requires Access Token)
   curl -X POST https://api.line.me/v2/bot/message/push \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
     -d '{
       "to": "USER_ID",
       "messages": [{
         "type": "text",
         "text": "Hello from NongJames!"
       }]
     }'
   ```

5. **Update `.env`**
   ```env
   LINE_CHANNEL_ID=your_channel_id
   LINE_CHANNEL_SECRET=your_channel_secret
   LINE_ACCESS_TOKEN=your_long_lived_token
   ```

---

## Development Setup

### 1. Install Dependencies

```bash
cd nongJames-api
bun install
```

### 2. Verify Database Connection

```bash
# Test connection
bun run src/db.ts

# Should show: ✅ Database connected or similar
```

### 3. Start Development Server

```bash
# Auto-reload on file changes
bun run --watch src/index.ts

# Output:
# 🚀 NongJames Laundry API running at http://localhost:3000
# 📚 API Docs: http://localhost:3000/docs
```

### 4. Access API Documentation

Open in browser: `http://localhost:3000/docs`

Interactive Swagger UI with ability to test all endpoints.

---

## Production Deployment

### 1. Environment Variables

Use strong values in production:

```bash
# Generate strong JWT secret
# Using OpenSSL or online tool
# Must be >32 characters

# Node environment
NODE_ENV=production

# Use production database credentials
DB_PASS=very_strong_password_here

# Use production payment API
SCB_API_URL=https://api.scb.co.th/payment  # Real API
SCB_MERCHANT_ID=production_merchant_id
SCB_API_KEY=production_api_key

# CORS for production domain
CORS_ORIGIN=https://app.nongjames.com,https://admin.nongjames.com

# LINE production token
LINE_ACCESS_TOKEN=production_token
```

### 2. Build & Run

```bash
# Build (if needed)
bun run build

# Start production server
PORT=8080 NODE_ENV=production bun run src/index.ts

# Or use process manager (PM2, systemd, etc)
pm2 start "bun run src/index.ts" --name nongjames-api
```

### 3. Configure Webhooks

**SCB Webhook:** Update in SCB Developer Console
```
POST https://your-domain.com/webhooks/scb/payment-callback
```

**LINE Webhook:** Update in LINE Developer Console
```
POST https://your-domain.com/webhooks/line/events
```

### 4. Setup HTTPS

Use reverse proxy (nginx) with SSL:

```nginx
server {
    listen 443 ssl http2;
    server_name api.nongjames.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header Authorization $http_authorization;
    }
}
```

### 5. Monitoring & Logging

Install monitoring tools:

```bash
# Option 1: Sentry for error tracking
npm install @sentry/node

# Option 2: LogRocket for session replay
npm install logrocket

# Add to app.ts:
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: 'https://your-sentry-dsn',
  environment: process.env.NODE_ENV,
});
```

---

## Troubleshooting

### Database Connection Error

```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**Solution:**
```bash
# Check if PostgreSQL is running
psql -U postgres -d nongjames_laundry

# Start PostgreSQL
# Windows: Use Services (postgresql-x64)
# macOS: brew services start postgresql
# Linux: sudo systemctl start postgresql
```

### SCB API Returns 401

```
Error: Invalid API key or signature
```

**Solution:**
- Verify SCB_API_KEY is correct
- Check if token is expired (regenerate)
- Confirm API is in sandbox mode if testing

### LINE Webhook Not Working

```
Error: Webhook verification failed
```

**Solution:**
- Verify webhook URL is publicly accessible
- Check X-Line-Signature header exists
- Confirm LINE_CHANNEL_SECRET is correct
- Test with LINE Webhook Console in developer.line.biz

### Memory Issues

```
JavaScript heap out of memory
```

**Solution:**
```bash
# Increase Node memory
export NODE_OPTIONS="--max-old-space-size=4096"
bun run src/index.ts
```

---

## Testing With API Client

### Postman Collection

Import from Swagger docs:
1. Go to `http://localhost:3000/docs`
2. Click "Download" or use Swagger's Postman export

### Thunder Client (VS Code)

Install extension: Install "Thunder Client"

Create collection with base URL:
```
http://localhost:3000

# Environment variables:
{{token}} = JWT from login response
{{userId}} = User ID from login
```

### Manual cURL Testing

```bash
# 1. Register
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "fullName": "Test User"
  }' | jq -r .accessToken)

# 2. Create order (using token)
curl -X POST http://localhost:3000/api/orders \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "items": [{"serviceId": "s1", "quantity": 3, "unitPrice": 100}],
    "deliveryType": "DELIVERY",
    "deliveryAddress": "123 Main St"
  }'
```

---

## Performance Tuning

### Database Connection Pool

```typescript
// In db.ts
export const db = connect({
  connectionString: process.env.DATABASE_URL,
  max: 20,              // Connection pool size
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
```

### Caching Layer (Optional)

```bash
# Install Redis
docker run --name nongjames-redis -p 6379:6379 -d redis:7

# Add to code
import { createClient } from 'redis';
const cache = createClient();
await cache.connect();
```

### Rate Limiting

```typescript
// Install rate-limiting
bun add @elysiajs/rate-limit

// Use in app.ts
import { rateLimit } from '@elysiajs/rate-limit';

app.use(rateLimit({
  max: 100,      // Max 100 requests
  duration: 900, // Per 15 minutes
}));
```

---

## Next Steps

1. ✅ Setup `.env` with correct credentials
2. ✅ Verify database connection
3. ✅ Start development server
4. ✅ Test endpoints in Swagger UI
5. ✅ Implement missing controllers (if any)
6. ✅ Deploy to production environment
7. ✅ Configure webhooks for SCB & LINE
8. ✅ Monitor and maintain API

---

## Support & Documentation

- **API Docs:** `http://localhost:3000/docs` (Swagger UI)
- **Elysia Docs:** https://elysia.io
- **Drizzle ORM:** https://orm.drizzle.team
- **SCB Developer:** https://www.scb-developer.com
- **LINE Developer:** https://developers.line.biz
- **PostgreSQL:** https://www.postgresql.org
