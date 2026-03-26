# NongJames Laundry API - Setup Guide

## Fixed Issues

The backend code has been fixed with the following changes:

### 1. Fixed Duplicate Schema Export
- **File**: `src/db/schema/index.ts`
- **Issue**: `driver-tasks` was exported twice (lines 26 and 43)
- **Fix**: Removed duplicate export

### 2. Fixed Auth Service Import
- **File**: `src/modules/auth/services/auth.service.ts`
- **Issue**: `lineUsers` was referenced but not imported
- **Fix**: Added `lineUsers` to the imports from `../../../db`

### 3. Fixed Controller/Router Mismatches
- **Files**: `src/modules/finance/finance.routes.ts`, `src/modules/logistics/logistics.routes.ts`
- **Issue**: Controllers were being called with wrong number of arguments
- **Fix**: Updated all route handlers to match controller function signatures:
  - `createPayment(body)` instead of `createPayment(body, ctx)`
  - `getPayment(params)` instead of `getPayment(params, ctx)`
  - `syncScbTransactions()` instead of `syncScbTransactions(ctx)`
  - And many more similar fixes

### 4. Fixed Logistics Controller
- **File**: `src/modules/logistics/controllers/logistics.controller.ts`
- **Issue**: Functions were accessing `context.set` but receiving wrong context format
- **Fix**: Updated functions to receive `user` directly and return status in response object

---

## Database Setup (Required)

The backend requires a PostgreSQL database. Follow these steps:

### Option 1: Using Docker (Recommended)

```bash
# Run PostgreSQL in Docker
docker run -d \
  --name nj-postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=nj_passwordd \
  -e POSTGRES_DB=nj_laundry \
  -p 5433:5432 \
  postgres:15

# Wait for database to start
sleep 5

# Run migrations
cd nongJames-api
bun drizzle-kit migrate

# Or push schema directly
bun drizzle-kit push
```

### Option 2: Using Local PostgreSQL

1. Install PostgreSQL locally
2. Create database: `createdb nj_laundry`
3. Update `.env` file with your database credentials
4. Run migrations:
   ```bash
   cd nongJames-api
   bun drizzle-kit migrate
   ```

### Option 3: Using Supabase/Neon/Other Cloud PostgreSQL

1. Create a project on your preferred platform
2. Copy the connection string
3. Update `.env` file:
   ```
   DATABASE_URL=postgresql://user:password@host:port/nj_laundry
   ```
4. Run migrations:
   ```bash
   bun drizzle-kit migrate
   ```

---

## Environment Variables

Create `.env` file in `nongJames-api/` directory:

```env
# Server Configuration
NODE_ENV=development
PORT=3000

# Database Configuration
DATABASE_URL=postgresql://postgres:nj_passwordd@localhost:5433/nj_laundry

# JWT Secret (change in production)
JWT_SECRET=your-super-secret-jwt-key-at-least-32-characters-long

# CORS Configuration
CORS_ORIGIN=http://localhost:3000,http://localhost:3001

# SCB Payment API (Optional - for production)
SCB_API_URL=https://api.sandbox.scb.example.com
SCB_API_KEY=your_scb_api_key_here
SCB_SECRET_KEY=your_scb_secret_key_here

# LINE Official Account Integration (Optional)
LINE_CHANNEL_ID=your_line_channel_id
LINE_CHANNEL_SECRET=your_line_channel_secret
LINE_ACCESS_TOKEN=your_line_access_token
```

---

## Running the Server

```bash
cd nongJames-api
bun install  # if not already installed
bun run dev
```

The API will be available at: http://localhost:3000

### API Documentation
- Swagger UI: http://localhost:3000/docs
- Health Check: http://localhost:3000/health

---

## Default Admin User

After database setup, you can register an admin user:

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Admin User",
    "email": "admin@nongjames.com",
    "password": "admin123",
    "role": "ADMIN"
  }'
```

Then login:

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@nongjames.com",
    "password": "admin123"
  }'
```

---

## API Endpoints Summary

| Module | Endpoint | Method | Description |
|--------|----------|--------|-------------|
| Auth | `/api/auth/register` | POST | Register new user |
| Auth | `/api/auth/login` | POST | Login user |
| Auth | `/api/auth/profile` | GET | Get user profile |
| Orders | `/api/orders` | GET/POST | List/Create orders |
| Orders | `/api/orders/:id` | GET/PATCH | Get/Update order |
| Services | `/api/services` | GET/POST | List/Create services |
| Customers | `/api/customers` | GET/POST | List/Create customers |
| Finance | `/api/finance/payments` | GET/POST | Payment management |
| Logistics | `/api/logistics/drivers` | GET/POST | Driver management |
| Logistics | `/api/logistics/assignments` | POST | Assign orders |

---

## Common Issues

### "Database connection failed"
- Check if PostgreSQL is running
- Verify DATABASE_URL in `.env`
- Ensure database exists

### "Failed query: select ... from services"
- Database tables don't exist yet
- Run `bun drizzle-kit migrate` to create tables

### "Cannot find module 'bcryptjs'"
- Run `bun install` to install dependencies

---

## Testing with Postman

See the file `POSTMAN_TESTING_GUIDE.md` in the `nongJames-api/` directory for detailed API testing instructions.

## Project Structure

```
nongJames-api/
├── src/
│   ├── db/
│   │   ├── schema/         # Database schema definitions
│   │   └── seed.sql        # Sample data
│   ├── modules/
│   │   ├── auth/           # Authentication module
│   │   ├── orders/         # Order management
│   │   ├── finance/        # Payments & reports
│   │   ├── logistics/      # Driver & delivery
│   │   ├── customers/      # Customer management
│   │   ├── services/       # Service catalog
│   │   └── notifications/  # LINE & email notifications
│   ├── integrations/       # SCB, LINE APIs
│   ├── middlewares/        # Auth, validation
│   └── index.ts            # Entry point
├── .env                    # Environment variables
└── drizzle.config.ts       # Database config
```

## Next Steps

1. Set up the database (see above)
2. Run migrations to create tables
3. Register an admin user
4. Test the API endpoints
5. Connect the frontend (if applicable)

For any issues, check the server logs for detailed error messages.
