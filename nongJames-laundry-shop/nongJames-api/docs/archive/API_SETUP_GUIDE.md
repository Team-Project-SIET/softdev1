# NongJames Laundry API - Complete Setup Guide

## Overview

The NongJames Laundry Management API is now fully configured with:
- ✅ Modular route architecture
- ✅ JWT authentication middleware
- ✅ Business logic service layer
- ✅ SCB payment integration (ready for webhooks)
- ✅ LINE Official Account integration (ready for webhooks)
- ✅ Error handling and logging
- ✅ Type-safe request validation

---

## Architecture Overview

```
src/
├── app.ts                          # Main app setup with all middleware & routes
├── index.ts                        # Entry point (listens on port)
├── db/                             # Drizzle ORM setup
├── modules/                        # Feature modules (organized)
│   ├── auth/                       # Authentication module
│   │   ├── auth.routes.ts         # Route handlers
│   │   ├── controllers/           # HTTP controllers
│   │   └── services/              # Business logic
│   ├── orders/                     # Order management
│   │   ├── orders.routes.ts
│   │   ├── controllers/
│   │   └── services/              # Order, OrderItem, Workflow services
│   ├── logistics/                  # Driver & delivery management
│   │   └── services/              # Assignment, Driver, Tracking services
│   └── finance/                    # Financial operations
│       └── services/              # Payment, SCB, Invoice, Accounting services
├── middlewares/
│   └── auth.middleware.ts          # JWT verification, role-based guards
├── integrations/
│   ├── scb/                        # SCB Developer API client
│   │   ├── scb.client.ts          # Real payment API methods
│   │   └── scb.config.ts          # Environment config
│   └── line/                       # LINE Official Account client
│       ├── line.client.ts         # Real messaging & webhook handling
│       └── line.config.ts         # Environment config
└── common/                         # Shared utilities
    ├── dto/                        # Data transfer objects
    ├── types/                      # TypeScript types
    └── utils/                      # Helper functions
```

---

## 1. Application Setup (app.ts)

### What's Configured

#### Middleware Stack:
```typescript
// 1. CORS - Cross-origin requests
// 2. Swagger Docs - Interactive API documentation at /docs
// 3. Bearer Token - Authorization header parsing
// 4. JWT - Token verification and signing
// 5. Auth Plugin - Injects { user } context into all routes
// 6. Request Logging - Logs every request
// 7. Error Handler - Global error catching & formatting
```

#### Global Endpoints:
- `GET /health` - Health check with environment info
- `GET /api/version` - API version info
- `GET /api/info` - Features list
- `POST /webhooks/scb/payment-callback` - SCB payment webhook
- `POST /webhooks/line/events` - LINE Official Account webhook

#### Module Routes (all with `/api` prefix):
- `/api/auth/*` - Authentication endpoints
- `/api/orders/*` - Order management endpoints
- `/api/logistics/*` - Driver & delivery endpoints
- `/api/finance/*` - Financial endpoints

### Running the Server

```bash
# Development mode (auto-reload)
bun run --watch src/index.ts

# Production mode
bun run src/index.ts

# With custom port
PORT=5000 bun run src/index.ts
```

Server starts on `http://localhost:3000` (or custom PORT)
- API Docs: `http://localhost:3000/docs`
- Health: `http://localhost:3000/health`

---

## 2. Authentication & JWT Middleware

### How It Works

```typescript
// JWT Flow:
1. User registers/logs in
2. AuthService creates JWT token with userId + role
3. Token stored on client (localStorage, cookies, etc.)
4. Client sends token in Authorization header: "Bearer <token>"
5. JWT middleware verifies signature
6. AuthPlugin adds { user: UserObject } to context
7. Routes use @requireAuth or @requireRole guards
```

### JWT Payload

```typescript
{
  userId: string;        // Internal user ID
  role: 'ADMIN' | 'STAFF' | 'DRIVER' | 'CUSTOMER';
  exp: number;          // Expiration (7 days from issue)
  iat: number;          // Issued at
}
```

### Protected Routes

```typescript
// In any route handler:
.post('/protected-endpoint', (ctx) => {
  // ctx.user contains verified user data
  const { user } = ctx;
  
  if (!user) {
    return { error: 'Unauthorized' };
  }
  
  // user = { id, email, fullName, role, ... }
  return { message: `Hello ${user.fullName}` };
}, { beforeHandle: [requireAuth] })

// Role-based access:
.post('/admin-only', (ctx) => {
  // Only ADMIN can access
}, { beforeHandle: [requireRole(['ADMIN'])] })

.post('/staff-action', (ctx) => {
  // ADMIN or STAFF can access
  }, { beforeHandle: [requireRole(['ADMIN', 'STAFF'])] })
```

### Auth Service Methods

**Registration:**
```typescript
const user = await authService.registerUser(
  email: 'user@example.com',
  password: 'secure_password',  // Min 6 chars
  fullName: 'John Doe',
  phone: '0812345678',
  role: 'CUSTOMER'  // CUSTOMER | STAFF | DRIVER
);
```

**Login:**
```typescript
const user = await authService.validateCredentials(
  email: 'user@example.com',
  password: 'password'
);
// Returns user without password
// Then generate JWT token with:
jwt.sign({ userId: user.id, role: user.role })
```

**Get Current User with LINE Info:**
```typescript
const userWithLine = await authService.getUserWithLineInfo(userId);
// { ...user, lineInfo: { lineUserId, lineDisplayName, linePictureUrl, ... } }
```

**Link LINE Account:**
```typescript
await authService.linkLineUser(
  userId,
  lineUserId: 'Uxxxxxx',
  lineDisplayName: 'John',
  linePictureUrl: 'https://...'
);
```

**Change Password:**
```typescript
await authService.changePassword(
  userId,
  oldPassword: 'current_password',
  newPassword: 'new_password'
);
```

---

## 3. Order Management Service

### Order Service Methods

**Create Order:**
```typescript
const order = await orderService.createOrder(
  customerId: 'user_123',
  {
    items: [
      { serviceId: 'service_1', quantity: 5, unitPrice: 50 },
      { serviceId: 'service_2', quantity: 2, unitPrice: 30 }
    ],
    deliveryType: 'DELIVERY',  // PICKUP | DELIVERY
    deliveryAddress: '123 Main St, Bangkok',
    notes: 'Handle with care'
  }
);

// Returns: {
//   id, orderNumber, status: 'PENDING',
//   subtotal, taxAmount (7%), deliveryFee, totalAmount,
//   loyaltyPointsEarned, estimatedReadyDate, ...
// }
```

**Get Order with Full Details:**
```typescript
const orderFull = await orderService.getOrderById(orderId);
// { ...order, items[], customer, payment, assignment }
```

**List Orders (with filtering):**
```typescript
const { orders, total, pages } = await orderService.listOrders(
  customerId?: 'user_123',
  status?: 'PENDING',      // PENDING|WASHING|PACKING|READY|COMPLETED
  dateFrom?: new Date('2024-01-01'),
  dateTo?: new Date('2024-12-31'),
  page: 1,
  limit: 10
);
```

**Update Order Status:**
```typescript
await orderService.updateOrderStatus(orderId, 'WASHING');
// Valid transitions:
// PENDING -> WASHING or CANCELLED
// WASHING -> PACKING
// PACKING -> READY
// READY -> COMPLETED or CANCELLED
// (throws error if invalid)
```

**Get Orders by LINE User ID:**
```typescript
const { orders } = await orderService.getOrdersByLineUserId(
  lineUserId: 'Uxxxxx',
  page: 1,
  limit: 10
);
// Useful for B2C LINE OA queries
```

---

## 4. Logistics & Driver Assignment

### Assignment Service Methods

**Assign Driver to Order:**
```typescript
const assignment = await assignmentService.assignOrderToDriver(
  orderId: 'order_123',
  driverId: 'driver_456',
  assignmentType: 'DELIVERY',  // PICKUP | DELIVERY | BOTH
  priority: 1                   // 1-5, higher = more urgent
);

// Returns: { id, status: 'ASSIGNED', estimatedPickupTime, estimatedDeliveryTime, ... }
```

**Get Driver's Assignments:**
```typescript
const { assignments, total, pages } = await assignmentService.getDriverAssignments(
  driverId: 'driver_456',
  status?: 'ASSIGNED',  // ASSIGNED|PICKED_UP|DELIVERED|FAILED|CANCELLED
  page: 1,
  limit: 20
);

// Returns orders with: orderId, orderNumber, deliveryAddress, totalAmount, ...
```

**Update Delivery Status with Location:**
```typescript
const updated = await assignmentService.updateAssignmentStatus(
  assignmentId: 'assign_123',
  newStatus: 'PICKED_UP',      // PICKED_UP | DELIVERED | FAILED
  latitude: 13.7563,
  longitude: 100.5018
);

// Valid transitions:
// ASSIGNED -> PICKED_UP or CANCELLED
// PICKED_UP -> DELIVERED or FAILED
// (Location is saved to driverLocationHistory for tracking)
```

**Reassign Order to Different Driver:**
```typescript
await assignmentService.reassignOrder(
  assignmentId: 'assign_123',
  newDriverId: 'driver_789',
  reason: 'Driver unavailable'
);
```

---

## 5. Payment & Financial Management

### Payment Service Methods

**Create Payment Record:**
```typescript
const payment = await paymentService.createPayment(
  orderId: 'order_123',
  amount: 500,               // in THB
  method: 'CREDIT_CARD'      // CASH|CREDIT_CARD|QR_CODE|TRANSFER
);

// Returns: { id, status: 'PENDING', ... }
```

**Initiate SCB Payment:**
```typescript
const scbResult = await paymentService.initiateSCBPayment(
  paymentId: 'pay_123',
  returnUrl: 'https://app.example.com/payment/return'
);

// Returns: {
//   paymentId, 
//   paymentUrl: 'https://scb.api/payment/form?ref=...',
//   transactionRef: 'SCB-ORD-123-...'
// }
// Send paymentUrl to user to complete payment
```

**Get Payment Details:**
```typescript
const payment = await paymentService.getPayment(paymentId);
```

**Get Order Payments:**
```typescript
const payments = await paymentService.getOrderPayments(orderId);
```

**Process/Confirm Payment:**
```typescript
const processed = await paymentService.processPayment(paymentId);
// Status changes to 'COMPLETED'
// Creates transaction record for accounting
```

**Refund Payment:**
```typescript
const refunded = await paymentService.refundPayment(
  paymentId: 'pay_123',
  reason: 'Customer requested cancellation'
);
// Status changes to 'REFUNDED'
// Creates expense transaction
```

---

## 6. SCB Payment Integration

### SCB Client - Real Payment Processing

**Configuration:**
```bash
# .env file
SCB_API_URL=https://api.sandbox.scb.example.com  # or production
SCB_API_KEY=your_api_key
SCB_SECRET_KEY=your_secret_key
SCB_MERCHANT_ID=your_merchant_id
```

### SCB Methods

**Create Payment Request:**
```typescript
const scbClient = new ScbClient();

const result = await scbClient.createPaymentRequest(
  orderId: 'order_123',
  amount: 500,                    // in THB
  orderNumber: 'ORD-12345-ABC',
  returnUrl: 'https://app.com/payment/return',
  description: 'Order payment'
);

if (result.success) {
  // Send user to: result.paymentUrl
  // The transactionRef tracks the payment
}
```

**Verify Payment:**
```typescript
const result = await scbClient.verifyPayment(transactionRef);
// Returns: { success, status: 'COMPLETED', amount }
```

**Webhook Signature Verification:**
```typescript
// In webhook handler:
const isValid = await scbClient.verifyWebhookSignature(payload);
if (!isValid) {
  return { error: 'Invalid signature' };
}
```

### SCB Webhook Handler

The app automatically handles SCB payment callbacks at:
```
POST /webhooks/scb/payment-callback
```

When SCB sends payment confirmation:
```typescript
{
  transactionRef: 'SCB-ORD-...',
  status: 'COMPLETED',
  amount: 500,
  timestamp: '2024-01-15T10:30:00Z'
}
```

The webhook:
1. Verifies SCB signature
2. Updates payment status
3. Creates transaction record
4. Updates order status

---

## 7. LINE Official Account Integration

### LINE Client - Messaging & Webhooks

**Configuration:**
```bash
# .env file
LINE_CHANNEL_ID=your_channel_id
LINE_CHANNEL_SECRET=your_channel_secret
LINE_ACCESS_TOKEN=your_access_token
```

### LINE Methods

**Send Text Message:**
```typescript
const lineClient = new LineClient();

const result = await lineClient.sendMessage(
  userId: 'Uxxxxxxxxxxxxxxx',  // LINE user ID
  message: 'Your order is ready for pickup! 🎉'
);

// Works even if API not configured (logs to console in dev)
```

**Send Flex Message (Rich Format):**
```typescript
const flexMessage = {
  type: 'bubble',
  body: {
    type: 'box',
    layout: 'vertical',
    contents: [
      { type: 'text', text: 'Order #ORD-123', weight: 'bold' },
      { type: 'text', text: 'Status: READY', color: '#00aa00' }
    ]
  }
};

await lineClient.sendFlexMessage(userId, flexMessage);
```

**Notify Order Status:**
```typescript
// Helper method:
await lineClient.notifyOrderStatus(
  userId: 'Uxxxxxxx',
  orderNumber: 'ORD-123',
  status: 'READY'    // Auto-generates appropriate message
);

// Sends: "✅ Order #ORD-123 is ready for pickup!"
```

**Notify Delivery Update:**
```typescript
await lineClient.notifyDeliveryUpdate(
  userId: 'Uxxxxxxx',
  orderNumber: 'ORD-123',
  driverName: 'Somchai',
  latitude: 13.7563,
  longitude: 100.5018
);

// Sends: "🚗 Driver Somchai is delivering Order #ORD-123\nLocation: 13.7563, 100.5018"
```

**Verify Webhook Signature:**
```typescript
const isValid = await lineClient.verifyWebhookSignature(
  signature: 'xxxxx',  // from X-Line-Signature header
  bodyString: JSON.stringify(eventBody)
);
```

### LINE Webhook Handler

The app automatically handles LINE events at:
```
POST /webhooks/line/events
```

Requires header: `X-Line-Signature: <signature>`

**Supported Events:**
- `message` - User sends text message
- `follow` - User adds bot as friend (auto-registration opportunity)
- `unfollow` - User blocks bot
- `postback` - User clicks a button

When user sends message or triggers action:
1. Signature is verified using channel secret
2. Event type is identified
3. Appropriate handler is called
4. Response sent back to LINE (or async processing)

**Example Event:**
```json
{
  "events": [
    {
      "type": "message",
      "message": {
        "type": "text",
        "text": "Where is my order?"
      },
      "source": {
        "userId": "Uxxxxxxxxxxxxxxx"
      },
      "timestamp": 1234567890000,
      "replyToken": "reply_token_xxxxx"
    }
  ]
}
```

---

## 8. Environment Variables

**Required for Production:**

```bash
# JWT
JWT_SECRET=your_very_secret_key_at_least_32_chars

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=nongjames_laundry
DB_USER=postgres
DB_PASSWORD=password

# SCB Payment
SCB_API_URL=https://api.sandbox.scb.example.com
SCB_API_KEY=your_scb_api_key
SCB_SECRET_KEY=your_scb_secret_key
SCB_MERCHANT_ID=your_merchant_id

# LINE Official Account
LINE_CHANNEL_ID=your_channel_id
LINE_CHANNEL_SECRET=your_channel_secret
LINE_ACCESS_TOKEN=your_long_lived_access_token

# CORS
CORS_ORIGIN=https://app.example.com,https://admin.example.com

# Environment
NODE_ENV=production
PORT=3000
```

---

## 9. API Endpoint Examples

### Authentication
```bash
# Register
POST /api/auth/register
{
  "email": "user@example.com",
  "password": "secure_password",
  "fullName": "John Doe",
  "phone": "0812345678",
  "role": "CUSTOMER"
}

# Login
POST /api/auth/login
{
  "email": "user@example.com",
  "password": "password"
}
# Returns: { accessToken, refreshToken, user }

# Get Profile (requires token)
GET /api/auth/me
# Headers: Authorization: Bearer <token>
```

### Orders
```bash
# Create order
POST /api/orders
{
  "items": [
    {"serviceId": "service_1", "quantity": 5, "unitPrice": 50}
  ],
  "deliveryType": "DELIVERY",
  "deliveryAddress": "123 Main St"
}

# Get order
GET /api/orders/order_123

# List orders
GET /api/orders?status=PENDING&page=1&limit=10

# Update status
PATCH /api/orders/order_123/status
{ "newStatus": "WASHING" }
```

### Logistics
```bash
# Get pending deliveries
GET /api/logistics/pending

# Assign driver
PATCH /api/logistics/order_123/assign
{
  "driverId": "driver_456",
  "assignmentType": "DELIVERY",
  "priority": 1
}

# Update delivery status
PATCH /api/logistics/assign_123/update-status
{
  "status": "DELIVERED",
  "latitude": 13.7563,
  "longitude": 100.5018
}
```

### Finance
```bash
# Create payment
POST /api/finance/payments
{
  "orderId": "order_123",
  "amount": 500,
  "method": "CREDIT_CARD"
}

# Initiate SCB payment
POST /api/finance/payments/pay_123/scb
{ "returnUrl": "https://app.com/return" }

# Get dashboard summary
GET /api/finance/dashboard/summary?days=30
```

---

## 10. Error Handling

### Standard Error Response Format

```typescript
{
  success: false,
  error: 'ERROR_CODE',
  message: 'Human readable message',
  timestamp: '2024-01-15T10:30:00Z'
}
```

### Common Error Codes

| Code | Meaning |
|------|---------|
| `NOT_FOUND` | Resource not found |
| `UNAUTHORIZED` | No valid token |
| `FORBIDDEN` | User doesn't have permission |
| `INVALID_INPUT` | Request validation failed |
| `INTERNAL_ERROR` | Server error |
| `INVALID_SIGNATURE` | SCB/LINE signature verification failed |
| `PAYMENT_FAILED` | Payment processing failed |

### Example Error Handling

```typescript
try {
  const order = await orderService.createOrder(customerId, data);
} catch (error) {
  return {
    success: false,
    error: 'ORDER_CREATION_FAILED',
    message: error instanceof Error ? error.message : 'Unknown error',
    timestamp: new Date().toISOString()
  };
}
```

---

## 11. Testing the API

### Using cURL

```bash
# Health check
curl http://localhost:3000/health

# Register user
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "fullName": "Test User"
  }'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'

# Create order (with token)
curl -X POST http://localhost:3000/api/orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "items": [{"serviceId": "s1", "quantity": 3, "unitPrice": 100}],
    "deliveryType": "DELIVERY"
  }'
```

### Using Postman

1. Import API from `/docs` Swagger endpoint
2. Set environment variables:
   - `base_url` = `http://localhost:3000`
   - `token` = Response from login endpoint
3. Use `{{token}}` in Authorization headers

---

## 12. Deployment Checklist

- [ ] Set all environment variables in production
- [ ] Use strong JWT secret (32+ characters)
- [ ] Configure CORS origins for your domains
- [ ] Setup SCB sandbox accounts and get API credentials
- [ ] Setup LINE Channel and get credentials
- [ ] Configure database connection for production
- [ ] Setup logging/monitoring (e.g., Sentry, Datadog)
- [ ] Enable HTTPS for all endpoints
- [ ] Setup rate limiting for payment endpoints
- [ ] Configure webhooks in SCB and LINE consoles
- [ ] Run database migrations
- [ ] Test all integrations before going live

---

## 13. Next Steps

### Implementing Controllers

Each module has controllers that use the services:

```typescript
// modules/orders/controllers/orders.controller.ts
export class OrdersController {
  private orderService = new OrderService();

  async createOrder(body: any, context: any) {
    const { user } = context;
    if (!user) throw new Error('Unauthorized');
    
    return this.orderService.createOrder(user.id, body);
  }
  
  // More methods...
}
```

### Connecting Routes to Controllers

Routes file imports controller and hooks up HTTP methods:

```typescript
// modules/orders/orders.routes.ts
export function createOrderRoutes(): Elysia {
  const controller = new OrdersController();
  
  return new Elysia({ prefix: '/orders' })
    .post('/', (ctx) => controller.createOrder(ctx.body, ctx))
    .get('/:id', (ctx) => controller.getOrderById(ctx.params.id, ctx))
    // More routes...
}
```

### Testing Services Directly

```typescript
// Quick test
const orderService = new OrderService();
const order = await orderService.createOrder('user_123', {
  items: [{ serviceId: 's1', quantity: 5, unitPrice: 50 }],
  deliveryType: 'DELIVERY'
});
console.log(order);
```

---

## Summary

✅ **Complete API Setup with:**
- Modular architecture
- JWT authentication
- Service layer with database integration
- SCB payment processing (ready for webhooks)
- LINE Official Account messaging (ready for webhooks)
- Error handling & logging
- Type-safe validation
- Production-ready configuration

**Start developing by:**
1. Running: `bun run --watch src/index.ts`
2. Check docs: `http://localhost:3000/docs`
3. Test endpoints with token from login

**All integrations are ready for:**
- Real SCB payments (configure API credentials)
- LINE messaging (configure channel credentials)
- Webhook callbacks (configure in SCB & LINE consoles)
