# nongJames-api - Modular Architecture Guide

## 📁 Project Structure

```
src/
├── modules/                 # Feature modules (domain-driven)
│   ├── auth/               # Authentication & User Roles
│   ├── orders/             # Order Management with Workflow
│   ├── logistics/          # Driver & Delivery Management
│   ├── finance/            # Payments & Invoicing
│   └── notifications/      # LINE OA, Email, SMS
├── db/                     # Database Layer
│   ├── schema/            # Drizzle ORM schemas
│   └── migrations/        # DB migrations
├── common/                # Shared Utilities
│   ├── enums/            # Enumerations (OrderStatus, UserRole, etc.)
│   ├── dto/              # Data Transfer Objects
│   ├── types/            # TypeScript types & interfaces
│   ├── utils/            # Utility functions
│   ├── constants/        # Constants & config
│   └── decorators/       # Custom decorators
├── integrations/         # External Services
│   ├── scb/             # SCB Payment Integration
│   └── line/            # LINE Official Account Integration
├── app.ts              # Main Elysia app setup
└── index.ts            # Entry point
```

## 🏗️ Architecture Principles

### 1. **Modular Structure**
- Each feature in its own module folder
- Services contain business logic
- Controllers handle HTTP requests/responses
- Routes define API endpoints

### 2. **Database Layer**
- Drizzle ORM schemas in `db/schema/`
- One file per entity (users, orders, payments, etc.)
- Supports complex relationships and enums

### 3. **Order Workflow**
```
PENDING → WASHING → PACKING → READY → COMPLETED
   ↓
CANCELLED
```
- Tracked in `order-workflow` schema with audit trail
- State transitions validated in `WorkflowService`

### 4. **User Roles**
- **ADMIN**: Full access
- **DRIVER**: Delivery management
- **CUSTOMER_B2C**: Individual customers
- **CUSTOMER_B2B**: Business customers

## 📦 How to Use

### Creating a New Module
1. Create folder: `src/modules/feature-name/`
2. Add:
   - `services/` - Business logic
   - `controllers/` - HTTP handlers
   - `feature-name.routes.ts` - Route definitions
   - `index.ts` - Exports

### Adding a Database Schema
1. Create file in `src/db/schema/`
2. Define Drizzle table
3. Export from `src/db/schema/index.ts`

### Service Implementation
```typescript
export class OrderService {
  async createOrder(customerId: string, data: any) {
    // TODO: Implement
  }
}
```

### Controller Implementation
```typescript
export class OrdersController {
  async createOrder(body: any, context: any) {
    // Call service, handle response
  }
}
```

### Route Definition
```typescript
export function createOrderRoutes(): Elysia {
  return new Elysia({ prefix: '/orders' })
    .post('/', controller.createOrder)
    .get('/:id', controller.getOrder);
}
```

## 🔌 External Integrations

### SCB Payment
- Configuration: `src/integrations/scb/`
- Usage: `ScbService` in finance module
- Webhook handling in payment controller

### LINE Official Account
- Configuration: `src/integrations/line/`
- Usage: `LineOaService` in notifications module
- Webhook endpoint for LINE events

## 🗄️ Database Setup

Create migrations in `src/db/migrations/` using Drizzle:

```bash
bun drizzle-kit generate:pg
bun drizzle-kit migrate
```

## 🚀 Environment Variables

```env
PORT=3000
JWT_SECRET=your-secret-key
DATABASE_URL=postgres://...

# SCB Integration
SCB_API_URL=https://api.scb.example.com
SCB_API_KEY=xxx
SCB_SECRET_KEY=xxx
SCB_MERCHANT_ID=xxx

# LINE Integration
LINE_CHANNEL_ID=xxx
LINE_CHANNEL_SECRET=xxx
LINE_ACCESS_TOKEN=xxx
```

## 📝 Naming Conventions

- **Services**: `*.service.ts` (e.g., `order.service.ts`)
- **Controllers**: `*.controller.ts` (e.g., `orders.controller.ts`)
- **Routes**: `*.routes.ts` (e.g., `orders.routes.ts`)
- **DTOs**: `*.dto.ts` (e.g., `order.dto.ts`)
- **Schemas**: `*.ts` in `db/schema/` (e.g., `orders.ts`)

## 🔄 Data Flow

1. **Request** → Controller
2. Controller validates request, calls **Service**
3. Service executes business logic, uses **Database**
4. Response flows back: Service → Controller → Response

## ✅ TODO List

- [ ] Implement all services with database calls
- [ ] Add error handling & validation
- [ ] Setup JWT authentication middleware
- [ ] Implement SCB payment integration
- [ ] Implement LINE OA messaging
- [ ] Add unit tests
- [ ] Add integration tests
- [ ] Deploy to production

---

Generated modular structure ready for development! 🎉
