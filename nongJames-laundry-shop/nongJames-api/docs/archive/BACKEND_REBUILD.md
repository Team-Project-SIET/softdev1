# NongJames Laundry API - Backend Rebuild Progress

## Overview
This document outlines the fixes applied to the backend API based on the SRS v2.4 requirements and the current implementation status.

## ✅ Completed Fixes

### 1. Authentication Module (FIXED)
**Issues Fixed:**
- ✅ Password validation was not being performed during login (now uses bcryptjs)
- ✅ JWT token generation not properly receiving context
- ✅ Password hashing not implemented during registration (now implemented)
- ✅ Improper parameter passing from routes to controllers

**Changes Made:**
- Updated `src/modules/auth/auth.routes.ts`:
  - Added `/api/auth` prefix (was `/auth`)
  - Fixed role checking to use uppercase (`ADMIN`, `STAFF`, etc.)
  - Pass `ctx.jwt` to controller methods
  - Pass full `ctx` context to handlers
  
- Updated `src/modules/auth/controllers/auth.controller.ts`:
  - Implemented proper password hashing with bcryptjs
  - Added password verification during login
  - Fixed token generation to use proper context
  - Improved error handling with proper HTTP status codes
  - Added password-free user object returns

### 2. API Routes Structure (FIXED)
**Issues Fixed:**
- ✅ Routes not prefixed with `/api` for consistency

**Changes Made:**
- Updated all module routes to use `/api` prefix:
  - Auth: `/api/auth/*`
  - Orders: `/api/orders/*`
  - Logistics: `/api/logistics/*`
  - Finance: `/api/finance/*`

### 3. Role-Based Access Control (FIXED)
**Issues Fixed:**
- ✅ Role checks using lowercase (should be uppercase per enum)

**Changes Made:**
- Updated all `requireRole()` calls to use uppercase roles:
  - `ADMIN`, `STAFF`, `DRIVER`, `CUSTOMER`, `EXECUTIVE`

### 4. Dependencies (FIXED)
**Issues Fixed:**
- ✅ Missing `bcryptjs` dependency

**Changes Made:**
- Added `bcryptjs@^2.4.3` to package.json

### 5. Environment Configuration (FIXED)
**Issues Fixed:**
- ✅ No `.env` file present

**Changes Made:**
- Created `.env` file with all required variables:
  - Database connection (PostgreSQL)
  - JWT secret
  - CORS origins
  - SCB API credentials (placeholders)
  - LINE channel credentials (placeholders)

---

## 📋 In-Progress / To-Do Items

### 1. Orders Module
**Status:** Routes restructured, Controller needs verification
**Tasks:**
- [ ] Verify `OrdersController` uses correct schema tables
- [ ] Test order creation workflow
- [ ] Implement missing methods: `listOrders`, `updateOrder`, `deleteOrder`, `transitionOrder`, `getWorkflowHistory`
- [ ] Add proper order numbering generation
- [ ] Implement order status workflow validation

### 2. Logistics Module
**Status:** Routes restructured
**Tasks:**
- [ ] Verify `LogisticsController` implementation
- [ ] Implement driver management endpoints
- [ ] Implement order assignment endpoints
- [ ] Implement task status update endpoints
- [ ] Implement location tracking endpoints
- [ ] Test driver workflow

### 3. Finance Module
**Status:** Routes restructured
**Tasks:**
- [ ] Verify `FinanceController` implementation
- [ ] Implement payment creation endpoints
- [ ] Integrate SCB API for payment processing (CRITICAL)
- [ ] Implement transaction syncing with SCB
- [ ] Implement expense tracking
- [ ] Create financial dashboard aggregation endpoints

### 4. Database & Schema
**Tasks:**
- [ ] Verify all schema tables are properly defined:
  - `users` ✅
  - `customers` ✅
  - `orders` ✅
  - `orderItems` - Check existence
  - `orderWorkflowHistory` ✅
  - `payments` - Check existence
  - `transactions` - Check existence
  - `expenses` - Check existence
  - `driverTasks` - Check existence
  - `logistics` - Check existence
- [ ] Run database migrations
- [ ] Verify indexes are created
- [ ] Test database connection

### 5. Integrations (SCB & LINE)
**Status:** Not started
**Tasks:**
- [ ] Implement SCB API client (`src/integrations/scb/scb.client.ts`)
- [ ] Set up payment webhook handlers
- [ ] Implement LINE OA integration (`src/integrations/line/line.client.ts`)
- [ ] Set up LINE webhook handlers
- [ ] Test webhook signatures and callbacks

### 6. Notifications Module
**Tasks:**
- [ ] Verify notifications module implementation
- [ ] Implement email notifications
- [ ] Implement LINE message notifications
- [ ] Implement SMS notifications (if needed)

### 7. Testing
**Tasks:**
- [ ] Set up test environment
- [ ] Run API health check
- [ ] Test authentication endpoints
- [ ] Test orders workflow
- [ ] Test logistics workflow
- [ ] Test financial endpoints
- [ ] Integration tests

---

## 🔧 How to Run the Backend

### Prerequisites
1. **Bun Runtime** (or Node.js)
   - Install Bun: https://bun.sh
   - Or use Node.js with compatible TypeScript support

2. **PostgreSQL Database**
   - Install PostgreSQL 12+
   - Or use Docker: `docker run -p 5432:5432 -e POSTGRES_PASSWORD=password postgres:15`

3. **Environment Setup**
   - Configure `.env` file (already created)
   - Update database credentials
   - Add SCB API keys
   - Add LINE channel credentials

### Installation
```bash
# Navigate to project directory
cd nongJames-laundry-shop/nongJames-api

# Install dependencies
bun install
# OR with npm/pnpm
npm install
pnpm install

# Set up database
bun run drizzle-kit push:pg
# Check in Drizzle Studio
bun run drizzle-kit studio
```

### Running the Server
```bash
# Development mode (with hot reload)
bun run dev

# Production mode
bun run start

# The API will be available at:
# - Server: http://localhost:3000
# - API Docs: http://localhost:3000/docs
# - Health Check: http://localhost:3000/health
```

---

## 📝 SRS v2.4 Compliance Checklist

### Functional Requirements

#### CRM & Orders ✅ (Partial)
- [x] Auth system with JWT
- [ ] Order creation (implemented, needs testing)
- [ ] Order status tracking (workflow: pending → washing → packing → ready → completed)
- [ ] B2C customer support (via LINE OA and Web)
- [ ] B2B contract management

#### Operations & Tracking ✅ (Partial)
- [ ] Workflow status management
- [ ] Kanban board preparation (Frontend responsibility)
- [ ] Driver task assignment
- [ ] Real-time status updates

#### Financial System 🔴 (Not Started)
- [ ] SCB API integration
- [ ] Transaction syncing
- [ ] Financial dashboard
- [ ] Profit/Loss calculation
- [ ] Cash flow tracking

#### User Roles ✅ (Framework Ready)
- [x] ADMIN - System administrator
- [x] STAFF - Shop staff
- [x] DRIVER - Delivery driver
- [x] CUSTOMER - B2C customer
- [x] EXECUTIVE - Management reporting

---

## 🐛 Known Issues & Limitations

1. **Database Setup**: Need to create tables
2. **SCB Integration**: Credentials are placeholders
3. **LINE Integration**: Channel credentials are placeholders
4. **Controller Methods**: Some methods not fully implemented
5. **Error Handling**: Need more comprehensive error handling
6. **Logging**: Basic logging implemented, needs enhancement
7. **Rate Limiting**: Not implemented
8. **Request Validation**: Need to add more comprehensive DTOs

---

## 📚 Documentation Files

- `API_SETUP_GUIDE.md` - Initial setup guide
- `ARCHITECTURE.md` - System architecture
- `DATABASE_MIGRATION_GUIDE.md` - Database setup
- `DTO_QUICK_REFERENCE.md` - Data transfer objects
- `FINANCE_ROUTES_GUIDE.md` - Finance endpoints
- `SCHEMA_DOCUMENTATION.md` - Database schema details
- `IMPLEMENTATION_COMPLETE.md` - Previous implementation notes

---

## 🔑 Key Environment Variables

```
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://postgres:password@localhost:5432/nongjames_laundry
JWT_SECRET=your-secret-key-32-chars-minimum
CORS_ORIGIN=http://localhost:3000,http://localhost:3001,http://localhost:5173
SCB_API_URL=https://api.sandbox.scb.example.com
SCB_API_KEY=your_key
SCB_SECRET_KEY=your_secret
LINE_CHANNEL_ID=your_channel_id
LINE_CHANNEL_SECRET=your_secret
```

---

## 📞 Contact & Support

For integration issues or questions about the SRS requirements, refer to:
- SRS Document: `documents/PM.XX/PM.00/SRS-laundry-shop/SRS-002.md`
- Project Manager: Check PM documentation

---

**Last Updated:** March 25, 2026
**API Version:** 1.0.0
