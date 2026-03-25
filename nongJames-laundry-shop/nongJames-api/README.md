# NongJames Laundry Management API

🚀 B2C & B2B Laundry Management System with ORDER WORKFLOW, LOGISTICS, FINANCE, SCB & LINE Integration

**Status**: ✅ Core backend functional | 🟢 Ready for testing

---

## 📋 Quick Start

### Prerequisites
- Bun or Node.js installed
- PostgreSQL database running
- `.env` file configured (see Environment Variables)

### Installation & Running

```bash
# 1. Install dependencies
bun install
# or: npm install

# 2. Setup database (if first time)
bun run drizzle-kit push:pg

# 3. Start development server
bun run dev
# Server: http://localhost:3000
# API Docs: http://localhost:3000/docs
# Health: http://localhost:3000/health

# Or production:
bun run start
```

---

## 🏛️ Architecture Overview

### Tech Stack
- **Runtime**: Bun (fast) + Node.js compatible
- **Framework**: Elysia (TypeScript HTTP API framework)
- **Database**: PostgreSQL + Drizzle ORM
- **Auth**: JWT (Bearer tokens) + bcryptjs (password hashing)
- **Integrations**: SCB Payment API, LINE Messaging API

### Project Structure
```
src/
├── app.ts                 # Main application setup
├── db.ts                  # Database configuration
├── index.ts               # Entry point
├── modules/               # Feature modules
│   ├── auth/              # User authentication ✅
│   ├── orders/            # Order management ⚠️
│   ├── logistics/         # Driver & delivery 🔴
│   ├── finance/           # Payments & invoicing 🔴
│   └── notifications/     # Notifications 🔴
├── db/schema/             # Database schema ✅
├── middlewares/           # Auth middleware ✅
├── integrations/          # 3rd party APIs
│   ├── scb/               # SCB payment 🔴
│   └── line/              # LINE messaging 🔴
├── common/                # Shared utilities ✅
└── routes/                # Route handlers
```

**Status Legend**: ✅ Complete | ⚠️ Needs Testing | 🔴 Needs Implementation

---

## 🔐 API Endpoints & Authentication

### Authentication Flow
```
1. Register → POST /api/auth/register
   ↓
2. Login → POST /api/auth/login (get JWT tokens)
   ↓
3. Use Authorization: Bearer <accessToken>
   ↓
4. Access protected endpoints
   ↓
5. Refresh → POST /api/auth/refresh (get new token)
```

### Core Endpoints

#### Auth Module (`/api/auth`)
```
POST   /api/auth/register      - Register new user
POST   /api/auth/login         - Login & get JWT
POST   /api/auth/refresh       - Refresh access token
POST   /api/auth/logout        - Logout
GET    /api/auth/profile       - Get user profile (requires auth)
```

#### Orders Module (`/api/orders`)
```
POST   /api/orders             - Create order (Admin/Staff)
GET    /api/orders             - List orders with pagination
GET    /api/orders/:id         - Get order details
PATCH  /api/orders/:id         - Update order
DELETE /api/orders/:id         - Cancel order
POST   /api/orders/:id/status  - Update order status (workflow)
```

#### Logistics Module (`/api/logistics`)
```
POST   /api/logistics/drivers                          - Create driver
GET    /api/logistics/drivers                          - List drivers
GET    /api/logistics/drivers/:driverId                - Get driver details
POST   /api/logistics/assignments                      - Assign order to driver
GET    /api/logistics/drivers/:driverId/assignments   - Get driver tasks
PATCH  /api/logistics/tasks/:id/status                - Update task status
GET    /api/logistics/orders/:orderId/status          - Track delivery
POST   /api/logistics/drivers/:driverId/location      - Update location
```

#### Finance Module (`/api/finance`)
```
POST   /api/finance/payments                   - Create payment
GET    /api/finance/payments/:id               - Get payment details
POST   /api/finance/scb/initiate               - Initiate SCB payment
POST   /api/finance/scb/callback               - SCB webhook (auto)
GET    /api/finance/transactions               - List transactions
POST   /api/finance/expenses                   - Create expense
```

### Health & Info
```
GET    /health                 - Health check
GET    /api/info               - API information
GET    /api/version            - API version
```

### Standard Response Format
```json
{
  "success": true/false,
  "message": "Human readable message",
  "data": {},
  "timestamp": "2026-03-25T..."
}
```

---

## 🗄️ Database Schema

### Core Tables

| Table | Purpose | Status |
|-------|---------|--------|
| `users` | User accounts (all roles) | ✅ |
| `customers` | Customer profiles | ✅ |
| `orders` | Order records | ✅ |
| `orderItems` | Line items per order | ✅ |
| `orderWorkflowHistory` | Order status changes | ✅ |
| `payments` | Payment records | ✅ |
| `transactions` | Financial transactions | ✅ |
| `expenses` | Expense tracking | ✅ |
| `driverTasks` | Driver assignments | ✅ |
| `logistics` | Delivery tracking | ✅ |

### User Roles
- `ADMIN` - Full system access
- `STAFF` - Create orders, manage logistics
- `DRIVER` - View assigned tasks, update location
- `CUSTOMER` - Create orders, view own orders
- `EXECUTIVE` - Financial reporting & analytics

---

## 🔑 Environment Variables

Create `.env` file in root:
```env
# Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/laundry

# JWT
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRES_IN=7d

# Server
NODE_ENV=development
PORT=3000
CORS_ORIGIN=*

# SCB Payment API
SCB_API_KEY=your-scb-key
SCB_API_SECRET=your-scb-secret
SCB_MERCHANT_ID=your-merchant-id
SCB_CALLBACK_URL=https://yourdomain.com/api/finance/scb/callback

# LINE Messaging API
LINE_CHANNEL_ID=your-channel-id
LINE_CHANNEL_SECRET=your-channel-secret
LINE_ACCESS_TOKEN=your-access-token
```

---

## 📝 Testing

### With cURL
```bash
# Health check
curl http://localhost:3000/health

# Register user
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "user@example.com",
    "password": "secure123",
    "role": "CUSTOMER"
  }'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "secure123"
  }'
```

### With Postman
See [POSTMAN_TESTING_GUIDE.md](./POSTMAN_TESTING_GUIDE.md) for comprehensive testing instructions and collections.

---

## ✅ Completed Tasks

### Core Implementation
- ✅ Authentication system (password hashing, JWT tokens)
- ✅ API route structure with `/api` prefix
- ✅ Role-Based Access Control (RBAC) with uppercase roles
- ✅ Database schema with Drizzle ORM
- ✅ Error handling middleware
- ✅ Request logging
- ✅ Environment configuration

### Testing & Documentation
- ✅ Comprehensive Postman testing guide
- ✅ API endpoint documentation
- ✅ All TypeScript files compile without errors
- ✅ Backend runs successfully on localhost:3000

---

## 🔴 TODO - Critical Items (High Priority)

### Database Setup
```bash
# Initialize database
bun run drizzle-kit push:pg

# Verify tables created
bun run drizzle-kit studio
```

### Controller Implementation
- [ ] Complete Orders Controller methods
- [ ] Complete Logistics Controller methods
- [ ] Complete Finance Controller methods
- [ ] Complete Notifications Controller

### Integration Completion
- [ ] SCB Payment API integration
- [ ] LINE Messaging API integration
- [ ] Webhook handlers for SCB & LINE

### Testing
- [ ] Unit tests for services
- [ ] Integration tests for endpoints
- [ ] End-to-end workflow tests

---

## 🟡 TODO - Important Items (Medium Priority)

- [ ] Request validation middleware
- [ ] Structured logging
- [ ] Error tracking (Sentry)
- [ ] Rate limiting
- [ ] Input sanitization
- [ ] CSRF protection

---

## 🔵 TODO - Nice-to-Have (Low Priority)

- [ ] API versioning
- [ ] Caching layer
- [ ] Performance optimization
- [ ] Automated backups
- [ ] Monitoring dashboard
- [ ] Advanced analytics

---

## 📚 Documentation Files

| File | Purpose | Location |
|------|---------|----------|
| **README.md** (this file) | Main documentation | Root |
| **POSTMAN_TESTING_GUIDE.md** | Complete API testing guide | Root |
| **docs/archive/** | Archived technical guides | docs/ |
| **SRS-002.md** | Business requirements | documents/SRS-laundry-shop/ |

---

## 🔗 Important Links

### External Resources
- **Bun Documentation**: https://bun.sh
- **Elysia Framework**: https://elysia.io/
- **Drizzle ORM**: https://orm.drizzle.team/
- **PostgreSQL**: https://www.postgresql.org/

### API Partners
- **SCB Developer Portal**: https://www.scb-developer.com/
- **LINE Messaging API**: https://developers.line.biz/en/

### Project Docs
- **Business Requirements**: `documents/PM.XX/PM.00/SRS-laundry-shop/SRS-002.md`
- **Technical Guides**: `docs/archive/` (archived guides)

---

## 🚨 Important Security Notes

1. **Change JWT_SECRET in production** - Use strong, unique secret
2. **Database credentials** - Use environment variables, never commit `.env`
3. **CORS settings** - Restrict to specific origins in production
4. **SSL/HTTPS** - Use in production (required for payment APIs)
5. **API Keys** - Keep SCB and LINE credentials secure

---

## 🆘 Troubleshooting

### Cannot find module error
- Run `bun install` or `npm install`
- Check import paths use correct relative paths

### Database connection refused
- Verify PostgreSQL is running: `psql`
- Check DATABASE_URL in `.env`
- Verify database exists: `psql -l`

### Port 3000 in use
```bash
# Kill process using port 3000
lsof -ti :3000 | xargs kill -9
# or
netstat -ano | findstr :3000
```

### JWT token expired
- Tokens expire after 7 days
- Use `/api/auth/refresh` endpoint to get new token
- See POSTMAN_TESTING_GUIDE.md for refresh flow

---

## 📞 Support & Development

**Development Status**: ACTIVE 🟢

Last Updated: March 25, 2026
Version: 1.0.0
API Stability: Beta (core features working, some modules incomplete)
