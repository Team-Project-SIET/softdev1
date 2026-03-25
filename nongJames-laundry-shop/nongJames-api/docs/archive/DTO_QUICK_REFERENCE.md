# DTO Schemas - Quick Reference & Examples

## Quick Pattern Overview

### Pattern 1: Simple POST Request/Response

```typescript
import Elysia from 'elysia';
import { CreateOrderSchema, OrderResponseSchema, CreateOrder, OrderResponse } from '@/common/dto';
import { OrderService } from './services/order.service';

const orderService = new OrderService();

export function createOrderRoutes(): Elysia {
  return new Elysia({ prefix: '/orders' })
    .post(
      '/',
      async ({ body }): Promise<{ success: boolean; data: OrderResponse }> => {
        const order = await orderService.createOrder(body.customerId, body.items);
        return { success: true, data: order };
      },
      { body: CreateOrderSchema }
    );
}
```

---

## Pattern 2: GET with Pagination

```typescript
import { OrderListSchema, OrderList } from '@/common/dto';

.get(
  '/list',
  async ({ query }): Promise<OrderList> => {
    const { orders, total, pages } = await orderService.listOrders(
      undefined,
      undefined,
      undefined,
      undefined,
      query.page || 1,
      query.limit || 10
    );

    return {
      orders,
      pagination: {
        page: query.page || 1,
        limit: query.limit || 10,
        total,
        pages,
      },
    };
  },
  {
    query: t.Object({
      page: t.Optional(t.Number({ minimum: 1 })),
      limit: t.Optional(t.Number({ minimum: 1, maximum: 100 })),
      status: t.Optional(t.String()),
    }),
  }
)
```

---

## Pattern 3: PATCH with Optional Fields

```typescript
import { UpdateOrderSchema, UpdateOrder, OrderResponseSchema, OrderResponse } from '@/common/dto';

.patch(
  '/:id',
  async ({ params, body }): Promise<{ success: boolean; data: OrderResponse }> => {
    // All fields in body are optional, checked only if provided
    if (body.status) {
      await orderService.updateOrderStatus(params.id, body.status);
    }
    if (body.notes) {
      // Update notes if provided
    }
    
    const updated = await orderService.getOrderById(params.id);
    return { success: true, data: updated };
  },
  {
    params: t.Object({ id: t.String() }),
    body: UpdateOrderSchema, // All fields optional
  }
)
```

---

## Pattern 4: Payment with Enum

```typescript
import { CreatePaymentSchema, PaymentResponseSchema, CreatePayment, PaymentResponse } from '@/common/dto';

.post(
  '/payments',
  async ({ body }): Promise<{ success: boolean; data: PaymentResponse }> => {
    // body.paymentMethod is validated against enum:
    // 'SCB' | 'CASH' | 'TRANSFER' | 'CREDIT_CARD' | 'QR_CODE'
    
    const payment = await paymentService.createPayment(
      body.orderId,
      body.amount,
      body.paymentMethod
    );
    
    return { success: true, data: payment };
  },
  { body: CreatePaymentSchema }
)
```

---

## Pattern 5: Driver Assignment with Validation

```typescript
import { AssignOrderSchema, DeliveryAssignmentSchema, AssignOrder, DeliveryAssignment } from '@/common/dto';

.post(
  '/assign',
  async ({ body }): Promise<{ success: boolean; data: DeliveryAssignment }> => {
    // Validates:
    // - orderId: required, non-empty string
    // - driverId: required, non-empty string
    // - assignmentType: must be 'PICKUP' | 'DELIVERY' | 'BOTH'
    // - priority: optional, 1-5 if provided

    const assignment = await assignmentService.assignOrderToDriver(
      body.orderId,
      body.driverId,
      body.assignmentType,
      body.priority
    );
    
    return { success: true, data: assignment };
  },
  { body: AssignOrderSchema }
)
```

---

## Pattern 6: Using Schemas in Controllers

```typescript
// src/modules/orders/controllers/orders.controller.ts

import { CreateOrder, UpdateOrder, OrderResponse } from '@/common/dto';
import { OrderService } from '../services/order.service';

export class OrdersController {
  private orderService = new OrderService();

  // Type parameters use imported types
  async createOrder(body: CreateOrder): Promise<OrderResponse> {
    return this.orderService.createOrder(body.customerId, body.items);
  }

  async updateOrder(id: string, body: UpdateOrder): Promise<OrderResponse> {
    // body is fully typed: all fields optional unless required
    if (body.status) {
      await this.orderService.updateOrderStatus(id, body.status);
    }
    return this.orderService.getOrderById(id);
  }

  async deleteOrder(id: string): Promise<{ success: boolean }> {
    await this.orderService.deleteOrder(id);
    return { success: true };
  }
}
```

**Then connect in routes:**

```typescript
// src/modules/orders/orders.routes.ts

import { CreateOrderSchema, UpdateOrderSchema, OrderResponseSchema } from '@/common/dto';
import { OrdersController } from './controllers/orders.controller';

export function createOrderRoutes(): Elysia {
  const controller = new OrdersController();

  return new Elysia({ prefix: '/orders' })
    .post('/', (ctx) => controller.createOrder(ctx.body), { body: CreateOrderSchema })
    .patch('/:id', (ctx) => controller.updateOrder(ctx.params.id, ctx.body), { body: UpdateOrderSchema })
    .delete('/:id', (ctx) => controller.deleteOrder(ctx.params.id));
}
```

---

## Valid/Invalid Request Examples

### Example 1: Create Order

**✅ Valid Request:**
```json
POST /orders
{
  "customerId": "user_123",
  "items": [
    { "serviceId": "s1", "quantity": 3, "description": "Shirts" },
    { "serviceId": "s2", "quantity": 2 }
  ],
  "deliveryType": "DELIVERY",
  "deliveryAddress": "123 Main St",
  "notes": "Handle with care"
}
```

**❌ Invalid - Missing required field:**
```json
{
  "items": [...],
  "deliveryType": "DELIVERY"
  // Missing: customerId
}
// Response 400:
// "customerId" is required
```

**❌ Invalid - Wrong enum:**
```json
{
  "customerId": "user_123",
  "items": [...],
  "deliveryType": "EXPRESS"  // ❌ Must be PICKUP or DELIVERY
}
// Response 400:
// "deliveryType" must be one of: PICKUP, DELIVERY
```

**❌ Invalid - Empty items array:**
```json
{
  "customerId": "user_123",
  "items": [],  // ❌ minItems: 1
  "deliveryType": "DELIVERY"
}
// Response 400:
// "items" must have at least 1 item
```

---

### Example 2: Update Order

**✅ Valid - All optional fields:**
```json
PATCH /orders/order_123
{
  "status": "WASHING"
}
```

**✅ Valid - Multiple fields:**
```json
PATCH /orders/order_123
{
  "status": "PACKING",
  "notes": "Customer requested expedited",
  "deliveryAddress": "456 Oak Ave"
}
```

**❌ Invalid - Wrong status:**
```json
{
  "status": "INVALID_STATUS"  // ❌ Not in enum
}
// Response 400:
// "status" must be one of: PENDING, WASHING, PACKING, READY, COMPLETED, CANCELLED
```

---

### Example 3: Create Payment

**✅ Valid Request:**
```json
POST /payments
{
  "orderId": "order_123",
  "amount": 500.50,
  "paymentMethod": "SCB",
  "description": "Order payment"
}
```

**❌ Invalid - Amount too low:**
```json
{
  "orderId": "order_123",
  "amount": 0,  // ❌ minimum: 0.01
  "paymentMethod": "SCB"
}
// Response 400:
// "amount" must be at least 0.01
```

**❌ Invalid - Bad payment method:**
```json
{
  "orderId": "order_123",
  "amount": 500,
  "paymentMethod": "BITCOIN"  // ❌ Invalid enum
}
// Response 400:
// "paymentMethod" must be one of: SCB, CASH, TRANSFER, CREDIT_CARD, QR_CODE
```

---

### Example 4: Assign Order

**✅ Valid Request:**
```json
POST /logistics/assign
{
  "orderId": "order_123",
  "driverId": "driver_456",
  "assignmentType": "DELIVERY",
  "priority": 3
}
```

**❌ Invalid - Priority out of range:**
```json
{
  "orderId": "order_123",
  "driverId": "driver_456",
  "assignmentType": "DELIVERY",
  "priority": 10  // ❌ maximum: 5
}
// Response 400:
// "priority" must be at most 5
```

**❌ Invalid - Missing required fields:**
```json
{
  "orderId": "order_123"
  // Missing: driverId, assignmentType
}
// Response 400:
// "driverId" is required
// "assignmentType" is required
```

---

## Testing with Swagger UI

1. **Access API docs:**
   ```
   http://localhost:3000/docs
   ```

2. **Test a POST endpoint:**
   - Click "POST /orders"
   - Click "Try it out"
   - Paste valid JSON in request body
   - Click "Execute"
   - See response with proper validation

3. **Schema validation examples:**
   - Try invalid enums → See error message
   - Try missing required fields → See error message
   - Try wrong data types → See error message
   - Try out-of-range numbers → See error message

---

## Type Safety Benefits

### Before (Class-based errors):
```typescript
const dto = new CreateOrderDTO();
// ❌ Property has no initializer errors
// ❌ No validation at runtime
// ❌ Manual validation code needed
```

### After (Schema-based):
```typescript
import type { CreateOrder } from '@/common/dto';

const body: CreateOrder = req.body;
// ✅ Full type safety
// ✅ Automatic validation
// ✅ Clear error messages
// ✅ IDE autocomplete
```

---

## Common Mistakes & Fixes

### ❌ Mistake 1: Using class instead of type
```typescript
// Wrong
const order: CreateOrderDTO = body;

// Right
import type { CreateOrder } from '@/common/dto';
const order: CreateOrder = body;
```

### ❌ Mistake 2: Forgetting schema in route
```typescript
// Wrong - no validation
.post('/', async ({ body }) => { ... })

// Right - validates body
.post('/', async ({ body }) => { ... }, { body: CreateOrderSchema })
```

### ❌ Mistake 3: Not handling optional fields
```typescript
// Wrong - could crash if not provided
const notes = body.notes.length;

// Right - check if exists
const notes = body.notes ? body.notes.length : 0;
```

### ❌ Mistake 4: Manual validation
```typescript
// Wrong - redundant
if (!body.customerId) throw new Error(...)

// Right - schema already validates
.post('/', ..., { body: CreateOrderSchema })
```

---

## Debugging

### Check if schema is applied:

```typescript
// This means Elysia isn't applying the schema
const body = ctx.body;  // type: any

// Fix: Pass schema to route config
.post('/', handler, { body: MySchema })
// Now: const body = ctx.body;  // type: MyData ✅
```

### Check Swagger UI:

1. Go to: `http://localhost:3000/docs`
2. Find your endpoint
3. Check the "Request body" section shows your schema fields
4. If not showing, you forgot to pass schema config

### Test with cURL:

```bash
# Test with invalid data
curl -X POST http://localhost:3000/orders \
  -H "Content-Type: application/json" \
  -d '{"customerId":""}'  # ❌ minLength: 1

# Elysia responds with 400 and clear error message
```

---

## Next Steps

1. ✅ Update all routes to use schemas (see patterns above)
2. ✅ Check Swagger UI at `/docs` - schemas should be visible
3. ✅ Test invalid requests - should get validation errors
4. ✅ Update controllers to use imported types
5. ✅ Remove any manual validation code
6. ✅ Delete legacy DTO class usage

Your API is now **type-safe and validated!** 🎉
